const mongoose = require('mongoose');
const {
  SIGNER_ROLE,
  SIGNATURE_TYPE,
  HASH_ALGORITHM,
} = require('../utils/constants');

/**
 * Signature Model
 * Collection: signatures
 * Source: docs/PITCH_DATABASE_FINAL.md Section 21 & Reconciliation Note 7
 * Records strictly immutable cryptographic and consent signatures for an MoU version.
 */
const signatureSchema = new mongoose.Schema(
  {
    mouId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mou',
      required: [true, 'MoU ID is required'],
      index: true,
    },
    mouVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MouVersion',
      required: [true, 'MoU Version ID is required'],
    },
    signerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Signer user ID is required'],
    },
    signerRole: {
      type: String,
      enum: {
        values: Object.values(SIGNER_ROLE),
        message: 'Invalid signer role: {VALUE}',
      },
      required: [true, 'Signer role is required'],
    },
    signatureType: {
      type: String,
      enum: Object.values(SIGNATURE_TYPE),
      default: SIGNATURE_TYPE.PLATFORM,
    },
    signatureData: {
      type: String,
      required: [true, 'Signature representation data is required'],
    },
    consentText: {
      type: String,
      required: [true, 'Consent declaration text is required'],
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    documentHashAtSigning: {
      type: String,
      required: [true, 'SHA-256 document hash at signing time is required'],
      match: [
        /^[a-f0-9]{64}$/i,
        'documentHashAtSigning must be a valid 64-character SHA-256 hex string',
      ],
    },
    hashAlgorithm: {
      type: String,
      default: HASH_ALGORITHM,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 21 & Section 33
signatureSchema.index({ mouVersionId: 1, signerUserId: 1 }, { unique: true });
signatureSchema.index({ mouVersionId: 1 });
signatureSchema.index({ signerUserId: 1 });

/**
 * Immutability enforcement: Signatures can NEVER be modified once saved
 */
signatureSchema.pre('save', function (next) {
  if (!this.isNew) {
    const err = new Error(
      'Signatures are immutable legal/consent audit records and cannot be modified once created.'
    );
    err.name = 'ValidationError';
    return next(err);
  }
  next();
});

/**
 * Forbid mutating signatures via query updates
 */
signatureSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate'],
  function (next) {
    const err = new Error(
      'Signatures are immutable legal/consent audit records and cannot be updated.'
    );
    err.name = 'ValidationError';
    return next(err);
  }
);

/**
 * Forbid deleting signatures
 */
signatureSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'],
  function (next) {
    const err = new Error(
      'Signatures are immutable legal/consent audit records and cannot be deleted.'
    );
    err.name = 'ValidationError';
    return next(err);
  }
);

const Signature = mongoose.model('Signature', signatureSchema);

module.exports = Signature;
