const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Mou, MouVersion, Deal, DealAgreement, Event, Company, Committee, File, Proposal } = require('../models');
const {
  MOU_STATUS,
  MOU_VERSION_STATUS,
  DEAL_STATUS,
  TEMPLATE_IDENTIFIER,
  HASH_ALGORITHM,
  FILE_PROVIDER,
  FILE_RESOURCE_TYPE,
  FILE_PURPOSE,
  SIGNER_ROLE,
} = require('../utils/constants');
const ApiError = require('../utils/apiError');
const { verifyDealParticipant } = require('./dealService');
const { generateMouPdf } = require('./pdfService');

/**
 * Storage directory for generated MoU PDF documents
 */
const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage', 'mou');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Assemble comprehensive, immutable agreement snapshot for MoU rendering and versioning.
 */
async function buildAgreementSnapshot({ deal, agreement, options = {} }) {
  const [event, company, committee] = await Promise.all([
    Event.findById(deal.eventId),
    Company.findById(deal.companyId),
    Committee.findById(deal.committeeId),
  ]);

  const snap = agreement?.snapshot || {};

  const committeeRep = committee?.contact || {};
  const companyRep = company?.contact || {};

  return {
    parties: {
      committee: {
        organisationName: committee?.name || '[Committee Name]',
        institutionAddress: committee?.college?.location
          ? `${committee.college.name}, ${committee.college.location.city || ''}, ${committee.college.location.state || ''}`
          : committee?.college?.name || '[Campus Address]',
        legalStatus: committee?.committeeType || 'Recognised Student Body / Institutional Committee',
        registrationNumber: options.committeeRegistrationNumber || 'REG/CAMPUS/2026',
        pan: options.committeePan || 'AAATC1234F',
        gstin: options.committeeGstin || '27AAATC1234F1Z5',
        representative: {
          name: committeeRep.name || 'Student Convener',
          designation: 'Convener / Authorized Student Lead',
          email: committeeRep.email || 'convener@college.edu',
          phone: committeeRep.phone || '+91 9876543210',
        },
        legalContractingEntity: committee?.college?.name || committee?.name || '[College]',
      },
      company: {
        companyName: company?.name || '[Company Name]',
        registeredAddress: company?.location
          ? `${company.location.city || ''}, ${company.location.state || ''}, ${company.location.country || 'India'}`
          : '[Corporate Registered Office]',
        legalStatus: company?.industry ? `${company.industry} Enterprise Entity` : 'Private Limited Company',
        cin: options.companyCin || 'U72900MH2020PTC123456',
        pan: options.companyPan || 'AABCC5678G',
        gstin: options.companyGstin || '27AABCC5678G1Z2',
        representative: {
          name: companyRep.name || 'Head of Partnerships',
          designation: 'Authorized Signatory / Partnerships Lead',
          email: companyRep.email || 'sponsor@brand.com',
          phone: companyRep.phone || '+91 9123456789',
        },
      },
    },
    eventDetails: {
      eventId: event?._id || deal.eventId,
      title: event?.title || 'Campus Event',
      eventType: event?.eventType || event?.category || 'College Festival',
      category: event?.category || 'Sponsorship Event',
      description: event?.description || 'Campus community sponsorship activation',
      eventDate: event?.eventDate || null,
      endDate: event?.endDate || null,
      venue: event?.location?.venue || event?.location?.city || 'Campus Grounds',
      expectedAudience: event?.expectedAudience || { min: 500, max: 5000 },
      socialReach: {
        instagram: 25000,
        linkedin: 10000,
        other: 5000,
      },
    },
    contributions: snap.contributions || deal.contributions || null,
    organiserDeliverables: snap.benefits || deal.benefits || [],
    sponsorDeliverables: snap.deliverables || deal.obligations || [],
    paymentDetails: snap.paymentDetails || {
      beneficiaryName: committee?.name || '[College Account]',
      accountNumber: '123456789012',
      bankName: 'State Bank of India',
      branch: 'Main Campus',
      ifscCode: 'SBIN0001234',
      pan: options.committeePan || 'AAATC1234F',
      gstin: options.committeeGstin || '27AAATC1234F1Z5',
      accountsEmail: committeeRep.email || 'accounts@college.edu',
      paymentSchedule: [],
      gstRate: 18,
      currency: 'INR',
    },
    term: {
      effectiveDate: options.effectiveDate || new Date(),
      expiryDate: event?.endDate || options.expiryDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      duration: options.duration || 'Event Term & Completion of Deliverables',
    },
    legalSettings: {
      jurisdiction: options.jurisdiction || 'Mumbai, India',
      curePeriodDays: Number(options.curePeriodDays) || 15,
      noticePeriodDays: Number(options.noticePeriodDays) || 30,
      refundTerms: options.refundTerms || 'Pro-rata refund of unexecuted cash deliverables upon event cancellation by Organiser; non-refundable if cancelled by Sponsor after campaign launch.',
      disputeResolution: options.disputeResolution || 'Arbitration in Mumbai under the Arbitration and Conciliation Act, 1996',
      stampDutyResponsibility: options.stampDutyResponsibility || 'Shared equally between Parties',
    },
    signatories: [
      {
        role: SIGNER_ROLE.COMMITTEE,
        name: committeeRep.name || 'Student Convener',
        designation: 'Authorized Convener',
        authorityReference: options.committeeAuthority || 'Institutional Society Constitution',
        userId: null,
        signedAt: null,
        documentHash: null,
        signatureData: '',
        consentText: '',
      },
      {
        role: SIGNER_ROLE.COMPANY,
        name: companyRep.name || 'Head of Partnerships',
        designation: 'Authorized Signatory',
        authorityReference: options.companyAuthority || 'Board Resolution / Power of Attorney',
        userId: null,
        signedAt: null,
        documentHash: null,
        signatureData: '',
        consentText: '',
      },
    ],
    witnesses: [
      {
        name: options.witness1Name || 'Faculty Staff Advisor',
        designation: 'Faculty In-Charge',
        signatureData: '',
      },
      {
        name: options.witness2Name || 'Corporate Representative',
        designation: 'Regional Marketing Manager',
        signatureData: '',
      },
    ],
  };
}

/**
 * Generate MoU and create an immutable MoUVersion with PDF and SHA-256 hash.
 */
async function generateMouForDeal({ dealId, userId, role, options = {} }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  // Deal must have an agreed commercial snapshot or accepted proposal
  let agreement = null;
  if (deal.agreedTermsId) {
    agreement = await DealAgreement.findById(deal.agreedTermsId);
  }
  if (!agreement) {
    agreement = await DealAgreement.findOne({ dealId: deal._id }).sort({ createdAt: -1 });
  }

  // If no agreement exists yet, check if there's an accepted proposal to establish one
  if (!agreement) {
    const acceptedProposal = await Proposal.findOne({ dealId: deal._id, status: 'ACCEPTED' });
    if (acceptedProposal) {
      const { agreeDeal } = require('./dealService');
      const agreed = await agreeDeal({ dealId: deal._id, userId, role });
      agreement = agreed.agreement;
    }
  }

  if (!agreement) {
    throw ApiError.badRequest(
      'Cannot generate MoU without an agreed deal. Accept a proposal or agree on commercial terms first.',
      null,
      'AGREEMENT_REQUIRED'
    );
  }

  // Find or create Mou container
  let mou = await Mou.findOne({ dealId: deal._id });
  if (!mou) {
    mou = await Mou.create({
      dealId: deal._id,
      status: MOU_STATUS.DRAFT,
    });
  }

  // Next version number
  const latestVersion = await MouVersion.findOne({ mouId: mou._id }).sort({ versionNumber: -1 });
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  // Build complete snapshot
  const snapshot = await buildAgreementSnapshot({ deal, agreement, options });

  // Generate 5-page PDF document buffer & SHA-256 hash
  const { buffer, documentHash } = await generateMouPdf({
    mou,
    versionNumber: nextVersionNumber,
    snapshot,
  });

  // Save generated PDF to local storage
  const filePath = path.join(STORAGE_DIR, `${documentHash}.pdf`);
  fs.writeFileSync(filePath, buffer);

  // Create File record for tracking
  const fileDoc = await File.create({
    ownerUserId: userId,
    provider: FILE_PROVIDER.CLOUDINARY,
    publicId: `pitch_mou_${mou._id}_v${nextVersionNumber}`,
    url: `/api/v1/mous/${mou._id}/download`,
    resourceType: FILE_RESOURCE_TYPE.DOCUMENT,
    mimeType: 'application/pdf',
    originalName: `PITCH_MoU_v${nextVersionNumber}.pdf`,
    sizeBytes: buffer.length,
    purpose: FILE_PURPOSE.MOU_DOCUMENT,
  });

  // Create immutable MouVersion record
  const mouVersion = await MouVersion.create({
    mouId: mou._id,
    versionNumber: nextVersionNumber,
    sourceAgreementId: agreement._id,
    templateIdentifier: TEMPLATE_IDENTIFIER,
    documentFileId: fileDoc._id,
    documentHash,
    hashAlgorithm: HASH_ALGORITHM,
    agreementSnapshot: snapshot,
    status: MOU_VERSION_STATUS.READY_FOR_SIGNATURE,
  });

  // Update Mou container
  mou.currentVersionId = mouVersion._id;
  mou.status = MOU_STATUS.PENDING_SIGNATURE;
  await mou.save();

  // Update deal reference and state transition if needed
  deal.mouId = mou._id;
  if (deal.status === DEAL_STATUS.AGREED && Deal.isValidTransition(deal.status, DEAL_STATUS.MOU_DRAFT)) {
    deal.status = DEAL_STATUS.MOU_DRAFT;
    await deal.save();
  }
  if (deal.status === DEAL_STATUS.MOU_DRAFT && Deal.isValidTransition(deal.status, DEAL_STATUS.AWAITING_SIGNATURES)) {
    deal.status = DEAL_STATUS.AWAITING_SIGNATURES;
    await deal.save();
  } else {
    await deal.save();
  }

  return {
    mou,
    mouVersion,
    documentHash,
    pdfSize: buffer.length,
  };
}

/**
 * Retrieve MoU container and current version for a deal.
 */
async function getMouForDeal({ dealId, userId, role }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  const mou = await Mou.findOne({ dealId: deal._id }).populate('currentVersionId');
  if (!mou) {
    throw ApiError.notFound('No MoU generated for this deal yet.', null, 'MOU_NOT_FOUND');
  }

  const versions = await MouVersion.find({ mouId: mou._id }).sort({ versionNumber: -1 });

  return {
    mou,
    currentVersion: mou.currentVersionId,
    versions,
  };
}

/**
 * Retrieve MoU by ID with participant authorization.
 */
async function getMouById({ mouId, userId, role }) {
  const mou = await Mou.findById(mouId).populate('currentVersionId');
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  await verifyDealParticipant(mou.dealId, userId, role);

  return mou;
}

/**
 * Get preview payload for document rendering in UI.
 */
async function getMouPreview({ mouId, versionId, userId, role }) {
  const mou = await Mou.findById(mouId);
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  await verifyDealParticipant(mou.dealId, userId, role);

  const targetVersionId = versionId || mou.currentVersionId;
  const version = await MouVersion.findById(targetVersionId);
  if (!version) {
    throw ApiError.notFound('MoU version not found', null, 'MOU_VERSION_NOT_FOUND');
  }

  return {
    mouId: mou._id,
    versionId: version._id,
    versionNumber: version.versionNumber,
    status: version.status,
    templateIdentifier: version.templateIdentifier,
    documentHash: version.documentHash,
    hashAlgorithm: version.hashAlgorithm,
    agreementSnapshot: version.agreementSnapshot,
    generatedAt: version.generatedAt,
  };
}

/**
 * List all versions of an MoU.
 */
async function getMouVersions({ mouId, userId, role }) {
  const mou = await Mou.findById(mouId);
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  await verifyDealParticipant(mou.dealId, userId, role);

  const versions = await MouVersion.find({ mouId: mou._id })
    .populate('documentFileId')
    .sort({ versionNumber: -1 });

  return versions;
}

/**
 * Retrieve specific MoU version.
 */
async function getMouVersionById({ mouId, versionId, userId, role }) {
  const mou = await Mou.findById(mouId);
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  await verifyDealParticipant(mou.dealId, userId, role);

  const version = await MouVersion.findOne({ _id: versionId, mouId: mou._id }).populate('documentFileId');
  if (!version) {
    throw ApiError.notFound('MoU version not found', null, 'MOU_VERSION_NOT_FOUND');
  }

  return version;
}

/**
 * Retrieve exact raw PDF buffer for download, maintaining byte-level SHA-256 integrity.
 */
async function getMouPdfBuffer({ mouId, versionId, userId, role }) {
  const mou = await Mou.findById(mouId);
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  await verifyDealParticipant(mou.dealId, userId, role);

  const targetVersionId = versionId || mou.currentVersionId;
  const version = await MouVersion.findById(targetVersionId);
  if (!version) {
    throw ApiError.notFound('MoU version not found', null, 'MOU_VERSION_NOT_FOUND');
  }

  const filePath = path.join(STORAGE_DIR, `${version.documentHash}.pdf`);
  let buffer;

  if (fs.existsSync(filePath)) {
    buffer = fs.readFileSync(filePath);
  } else {
    // Generate PDF deterministically from immutable snapshot
    const generated = await generateMouPdf({
      mou,
      versionNumber: version.versionNumber,
      snapshot: version.agreementSnapshot,
    });
    buffer = generated.buffer;
    fs.writeFileSync(filePath, buffer);
  }

  return {
    buffer,
    documentHash: version.documentHash,
    versionNumber: version.versionNumber,
    fileName: `PITCH_MoU_v${version.versionNumber}_${version.documentHash.substring(0, 8)}.pdf`,
  };
}

/**
 * Generate a new MoU version (Phase 21: Versioning & amendment workflow).
 * Previous versions remain completely untouched and immutable.
 */
async function createNewMouVersion({ mouId, userId, role, options = {} }) {
  const mou = await Mou.findById(mouId);
  if (!mou) {
    throw ApiError.notFound('MoU not found', null, 'MOU_NOT_FOUND');
  }

  const deal = await Deal.findById(mou.dealId);
  if (!deal) {
    throw ApiError.notFound('Associated deal not found', null, 'DEAL_NOT_FOUND');
  }

  await verifyDealParticipant(deal._id, userId, role);

  return generateMouForDeal({
    dealId: deal._id,
    userId,
    role,
    options,
  });
}

module.exports = {
  generateMouForDeal,
  getMouForDeal,
  getMouById,
  getMouPreview,
  getMouVersions,
  getMouVersionById,
  getMouPdfBuffer,
  createNewMouVersion,
};
