const mongoose = require('mongoose');
const { DEAL_AGREEMENT_STATUS, SIGNER_ROLE } = require('../utils/constants');

/**
 * DealAgreement Model
 * Collection: dealAgreements
 * Source: docs/PITCH_DATABASE_FINAL.md Section 18, docs/PITCH_MOU_FINAL.md & docs/PITCH_FINAL_BUILD_SPEC.md
 * Stores the comprehensive, immutable commercial snapshot agreed upon by both parties.
 */
const dealAgreementSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required for agreement'],
    },
    acceptedProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: [true, 'Accepted proposal ID is required'],
    },
    snapshot: {
      contributions: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Agreed contributions snapshot is required'],
      },
      benefits: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      deliverables: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      deliveryRequirements: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      terms: {
        type: String,
        default: '',
      },
      paymentDetails: {
        beneficiaryName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        branch: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        pan: { type: String, default: '' },
        gstin: { type: String, default: '' },
        accountsEmail: { type: String, default: '' },
        paymentSchedule: { type: [mongoose.Schema.Types.Mixed], default: [] },
        gstRate: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
      },
    },
    agreedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: Object.values(SIGNER_ROLE),
          required: true,
        },
        agreedAt: {
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
      },
    ],
    status: {
      type: String,
      enum: Object.values(DEAL_AGREEMENT_STATUS),
      default: DEAL_AGREEMENT_STATUS.AGREED,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 18
dealAgreementSchema.index({ dealId: 1 });
dealAgreementSchema.index({ acceptedProposalId: 1 });

/**
 * Pre-save immutability: Snapshot contents cannot be mutated once agreed
 */
dealAgreementSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('snapshot')) {
    const err = new Error(
      'DealAgreement commercial snapshot is immutable once established.'
    );
    err.name = 'ValidationError';
    return next(err);
  }
  next();
});

/**
 * Forbid mutating agreed snapshot via query updates
 */
dealAgreementSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate'],
  function (next) {
    const update = this.getUpdate();
    const modifiedKeys = Object.keys(update?.$set || update || {});
    if (modifiedKeys.some((k) => k === 'snapshot' || k.startsWith('snapshot.'))) {
      const err = new Error(
        'DealAgreement commercial snapshot is immutable once established and cannot be updated.'
      );
      err.name = 'ValidationError';
      return next(err);
    }
    next();
  }
);

/**
 * Forbid deletion of agreed records
 */
dealAgreementSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'],
  function (next) {
    const err = new Error(
      'DealAgreement records are binding commercial audit snapshots and cannot be deleted.'
    );
    err.name = 'ValidationError';
    return next(err);
  }
);

const DealAgreement = mongoose.model('DealAgreement', dealAgreementSchema);

module.exports = DealAgreement;
