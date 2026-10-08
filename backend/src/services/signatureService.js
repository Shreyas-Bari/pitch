const mongoose = require('mongoose');
const { Signature, Mou, MouVersion, Deal } = require('../models');
const {
  SIGNER_ROLE,
  SIGNATURE_TYPE,
  HASH_ALGORITHM,
  MOU_STATUS,
  MOU_VERSION_STATUS,
  DEAL_STATUS,
  ROLES,
} = require('../utils/constants');
const ApiError = require('../utils/apiError');
const { verifyDealParticipant } = require('./dealService');

/**
 * Digital Signing Service (Platform Consent & Cryptographic Audit)
 * Source of Truth: docs/PITCH_DATABASE_FINAL.md Section 21, docs/PITCH_API_FINAL.md Section 15,
 * and docs/PITCH_MOU_FINAL.md Sections 12-13.
 *
 * Rules:
 * - Requires both COMPANY and COMMITTEE signatures to reach EXECUTED.
 * - Signer must be an authorized participant belonging to the deal.
 * - Captures exact documentHash of the version signed.
 * - Signatures and signed versions are immutable.
 * - Protects against duplicate signing by the same user or role.
 */

/**
 * Get signing status for both parties on current MoU version.
 */
async function getSigningStatus({ mouId, userId, role }) {
  const mou = await Mou.findById(mouId).populate('currentVersionId');
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  const { deal, userRole } = await verifyDealParticipant(mou.dealId, userId, role);

  const currentVersion = mou.currentVersionId;
  if (!currentVersion) {
    throw ApiError.notFound('No current MoU version found for this MoU', null, 'VERSION_NOT_FOUND');
  }

  const signatures = await Signature.find({ mouVersionId: currentVersion._id }).sort({ signedAt: 1 });

  const companySig = signatures.find((s) => s.signerRole === SIGNER_ROLE.COMPANY);
  const committeeSig = signatures.find((s) => s.signerRole === SIGNER_ROLE.COMMITTEE);

  const isUserSignerRole = userRole === ROLES.COMPANY ? SIGNER_ROLE.COMPANY : SIGNER_ROLE.COMMITTEE;
  const hasUserSigned = signatures.some(
    (s) => (s.signerUserId && s.signerUserId.equals(userId)) || s.signerRole === isUserSignerRole
  );

  return {
    mouId: mou._id,
    versionId: currentVersion._id,
    versionNumber: currentVersion.versionNumber,
    documentHash: currentVersion.documentHash,
    hashAlgorithm: currentVersion.hashAlgorithm || HASH_ALGORITHM,
    mouStatus: mou.status,
    dealStatus: deal.status,
    companySigned: !!companySig,
    committeeSigned: !!committeeSig,
    isFullyExecuted: !!companySig && !!committeeSig,
    hasUserSigned,
    userRole,
    signatures: signatures.map((s) => ({
      id: s._id,
      signerRole: s.signerRole,
      fullName: s.fullName,
      designation: s.designation,
      signedAt: s.signedAt,
      documentHash: s.documentHashAtSigning,
    })),
  };
}

/**
 * Execute digital signing for current MoU version.
 */
async function signMou({ mouId, userId, role, data = {}, reqMeta = {} }) {
  const mou = await Mou.findById(mouId);
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  const { deal, userRole } = await verifyDealParticipant(mou.dealId, userId, role);

  const currentVersion = await MouVersion.findById(mou.currentVersionId);
  if (!currentVersion) {
    throw ApiError.notFound('No current MoU version found to sign', null, 'VERSION_NOT_FOUND');
  }

  if (currentVersion.status === MOU_VERSION_STATUS.EXECUTED) {
    throw ApiError.conflict('This MoU version is already fully executed and locked.', null, 'ALREADY_EXECUTED');
  }
  if (currentVersion.status === MOU_VERSION_STATUS.VOID) {
    throw ApiError.conflict('Cannot sign a voided MoU version.', null, 'VERSION_VOID');
  }

  // Determine signer role
  let signerRole = data.signerRole;
  if (userRole === ROLES.COMPANY) {
    signerRole = SIGNER_ROLE.COMPANY;
  } else if (userRole === ROLES.COMMITTEE) {
    signerRole = SIGNER_ROLE.COMMITTEE;
  } else if (role === ROLES.ADMIN) {
    if (!signerRole || !Object.values(SIGNER_ROLE).includes(signerRole)) {
      signerRole = SIGNER_ROLE.COMMITTEE;
    }
  }

  // Duplicate signing protection
  const existingUserSignature = await Signature.findOne({
    mouVersionId: currentVersion._id,
    $or: [{ signerUserId: userId }, { signerRole }],
  });

  if (existingUserSignature) {
    throw ApiError.conflict(
      `A signature has already been recorded for role ${signerRole} on this MoU version.`,
      { existingSignatureId: existingUserSignature._id, signerRole },
      'ALREADY_SIGNED'
    );
  }

  // Create immutable Signature document
  const signature = await Signature.create({
    mouId: mou._id,
    mouVersionId: currentVersion._id,
    signerUserId: userId,
    signerRole,
    signatureType: SIGNATURE_TYPE.PLATFORM,
    signatureData: data.signatureData,
    consentText: data.consentText,
    signedAt: new Date(),
    ipAddress: reqMeta.ipAddress || null,
    userAgent: reqMeta.userAgent || null,
    documentHashAtSigning: currentVersion.documentHash,
    hashAlgorithm: currentVersion.hashAlgorithm || HASH_ALGORITHM,
  });

  // Update signatories block inside agreementSnapshot
  if (Array.isArray(currentVersion.agreementSnapshot?.signatories)) {
    const signatoryEntry = currentVersion.agreementSnapshot.signatories.find(
      (s) => s.role === signerRole
    );
    if (signatoryEntry) {
      signatoryEntry.name = data.fullName;
      signatoryEntry.designation = data.designation;
      signatoryEntry.authorityReference = data.authorityReference || signatoryEntry.authorityReference || '';
      signatoryEntry.userId = userId;
      signatoryEntry.signedAt = signature.signedAt;
      signatoryEntry.documentHash = currentVersion.documentHash;
      signatoryEntry.signatureData = data.signatureData;
      signatoryEntry.consentText = data.consentText;
    } else {
      currentVersion.agreementSnapshot.signatories.push({
        role: signerRole,
        name: data.fullName,
        designation: data.designation,
        authorityReference: data.authorityReference || '',
        userId,
        signedAt: signature.signedAt,
        documentHash: currentVersion.documentHash,
        signatureData: data.signatureData,
        consentText: data.consentText,
      });
    }
    currentVersion.markModified('agreementSnapshot');
  }

  // Check all signatures for this version
  const allVersionSignatures = await Signature.find({ mouVersionId: currentVersion._id });
  const hasCompany = allVersionSignatures.some((s) => s.signerRole === SIGNER_ROLE.COMPANY);
  const hasCommittee = allVersionSignatures.some((s) => s.signerRole === SIGNER_ROLE.COMMITTEE);

  if (hasCompany && hasCommittee) {
    // Both required parties have signed -> EXECUTED!
    currentVersion.status = MOU_VERSION_STATUS.EXECUTED;
    mou.status = MOU_STATUS.EXECUTED;

    // Transition Deal to EXECUTED
    if (Deal.isValidTransition(deal.status, DEAL_STATUS.EXECUTED)) {
      deal.status = DEAL_STATUS.EXECUTED;
    } else if (deal.status === DEAL_STATUS.MOU_DRAFT && Deal.isValidTransition(deal.status, DEAL_STATUS.AWAITING_SIGNATURES)) {
      deal.status = DEAL_STATUS.AWAITING_SIGNATURES;
      if (Deal.isValidTransition(deal.status, DEAL_STATUS.EXECUTED)) {
        deal.status = DEAL_STATUS.EXECUTED;
      }
    }
    deal.executedAt = new Date();
  } else {
    // Only 1 party signed -> PARTIALLY_SIGNED
    currentVersion.status = MOU_VERSION_STATUS.PARTIALLY_SIGNED;
    mou.status = MOU_STATUS.PARTIALLY_SIGNED;

    if (deal.status === DEAL_STATUS.MOU_DRAFT && Deal.isValidTransition(deal.status, DEAL_STATUS.AWAITING_SIGNATURES)) {
      deal.status = DEAL_STATUS.AWAITING_SIGNATURES;
    }
    if (Deal.isValidTransition(deal.status, DEAL_STATUS.PARTIALLY_SIGNED)) {
      deal.status = DEAL_STATUS.PARTIALLY_SIGNED;
    }
  }

  await currentVersion.save();
  await mou.save();
  await deal.save();

  return {
    signature,
    mouVersion: currentVersion,
    dealStatus: deal.status,
    mouStatus: mou.status,
    isFullyExecuted: deal.status === DEAL_STATUS.EXECUTED,
  };
}

/**
 * Retrieve all signatures for an MoU.
 */
async function getSignatures({ mouId, userId, role }) {
  const mou = await Mou.findById(mouId);
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  await verifyDealParticipant(mou.dealId, userId, role);

  const signatures = await Signature.find({ mouId: mou._id })
    .populate('signerUserId', 'fullName email role')
    .sort({ signedAt: 1 });

  return signatures;
}

/**
 * Retrieve executed document details once both parties have signed.
 */
async function getExecutedDocument({ mouId, userId, role }) {
  const mou = await Mou.findById(mouId).populate('currentVersionId');
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  const { deal } = await verifyDealParticipant(mou.dealId, userId, role);

  if (mou.status !== MOU_STATUS.EXECUTED || deal.status !== DEAL_STATUS.EXECUTED) {
    throw ApiError.badRequest(
      'MoU is not yet fully executed by both required parties.',
      { mouStatus: mou.status, dealStatus: deal.status },
      'NOT_FULLY_EXECUTED'
    );
  }

  const currentVersion = mou.currentVersionId;
  const signatures = await Signature.find({ mouVersionId: currentVersion._id });

  return {
    mouId: mou._id,
    dealId: deal._id,
    versionNumber: currentVersion.versionNumber,
    documentHash: currentVersion.documentHash,
    hashAlgorithm: currentVersion.hashAlgorithm,
    executedAt: deal.executedAt,
    signatories: signatures.map((s) => ({
      role: s.signerRole,
      fullName: s.fullName,
      designation: s.designation,
      signedAt: s.signedAt,
      documentHash: s.documentHashAtSigning,
    })),
    downloadUrl: `/api/v1/mous/${mou._id}/download`,
  };
}

module.exports = {
  getSigningStatus,
  signMou,
  getSignatures,
  getExecutedDocument,
};
