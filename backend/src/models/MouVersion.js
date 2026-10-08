const mongoose = require('mongoose');
const {
  MOU_VERSION_STATUS,
  HASH_ALGORITHM,
  TEMPLATE_IDENTIFIER,
} = require('../utils/constants');

/**
 * MoU Version Model
 * Collection: mouVersions
 * Source: docs/PITCH_DATABASE_FINAL.md Section 20, Section 38 & docs/PITCH_MOU_FINAL.md
 * Every generated MoU version contains an immutable full legal agreement snapshot
 * and an authoritative SHA-256 document hash.
 */
const mouVersionSchema = new mongoose.Schema(
  {
    mouId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mou',
      required: [true, 'MoU container ID is required'],
    },
    versionNumber: {
      type: Number,
      required: [true, 'Version number is required'],
      default: 1,
    },
    sourceAgreementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DealAgreement',
      required: [true, 'Source DealAgreement ID is required'],
    },
    templateIdentifier: {
      type: String,
      default: TEMPLATE_IDENTIFIER,
    },
    documentFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    documentHash: {
      type: String,
      match: [/^[a-f0-9]{64}$/i, 'documentHash must be a valid 64-character SHA-256 hex string'],
      default: null,
    },
    hashAlgorithm: {
      type: String,
      default: HASH_ALGORITHM,
    },
    agreementSnapshot: {
      parties: {
        committee: {
          organisationName: { type: String, default: '' },
          institutionAddress: { type: String, default: '' },
          legalStatus: { type: String, default: '' },
          registrationNumber: { type: String, default: '' },
          pan: { type: String, default: '' },
          gstin: { type: String, default: '' },
          representative: {
            name: { type: String, default: '' },
            designation: { type: String, default: '' },
            email: { type: String, default: '' },
            phone: { type: String, default: '' },
          },
          legalContractingEntity: { type: String, default: '' },
        },
        company: {
          companyName: { type: String, default: '' },
          registeredAddress: { type: String, default: '' },
          legalStatus: { type: String, default: '' },
          cin: { type: String, default: '' },
          pan: { type: String, default: '' },
          gstin: { type: String, default: '' },
          representative: {
            name: { type: String, default: '' },
            designation: { type: String, default: '' },
            email: { type: String, default: '' },
            phone: { type: String, default: '' },
          },
        },
      },
      eventDetails: {
        eventId: { type: mongoose.Schema.Types.ObjectId, default: null },
        title: { type: String, default: '' },
        eventType: { type: String, default: '' },
        category: { type: String, default: '' },
        description: { type: String, default: '' },
        eventDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        venue: { type: String, default: '' },
        expectedAudience: {
          min: { type: Number, default: 0 },
          max: { type: Number, default: 0 },
        },
        socialReach: {
          instagram: { type: Number, default: 0 },
          linkedin: { type: Number, default: 0 },
          other: { type: Number, default: 0 },
        },
      },
      contributions: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      organiserDeliverables: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      sponsorDeliverables: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
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
      term: {
        effectiveDate: { type: Date, default: null },
        expiryDate: { type: Date, default: null },
        duration: { type: String, default: '' },
      },
      legalSettings: {
        jurisdiction: { type: String, default: 'Mumbai, India' },
        curePeriodDays: { type: Number, default: 15 },
        noticePeriodDays: { type: Number, default: 30 },
        refundTerms: { type: String, default: '' },
        disputeResolution: { type: String, default: 'Arbitration in Mumbai under the Arbitration and Conciliation Act' },
        stampDutyResponsibility: { type: String, default: 'Shared equally' },
      },
      signatories: [
        {
          role: { type: String, enum: ['COMPANY', 'COMMITTEE'] },
          name: { type: String, default: '' },
          designation: { type: String, default: '' },
          authorityReference: { type: String, default: '' },
          userId: { type: mongoose.Schema.Types.ObjectId, default: null },
          signedAt: { type: Date, default: null },
          documentHash: { type: String, default: null },
          signatureData: { type: String, default: '' },
          consentText: { type: String, default: '' },
        },
      ],
      witnesses: [
        {
          name: { type: String, default: '' },
          designation: { type: String, default: '' },
          signatureData: { type: String, default: '' },
        },
      ],
    },
    status: {
      type: String,
      enum: Object.values(MOU_VERSION_STATUS),
      default: MOU_VERSION_STATUS.DRAFT,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 20 & Section 33
mouVersionSchema.index({ mouId: 1, versionNumber: 1 }, { unique: true });
mouVersionSchema.index({ documentHash: 1 });

/**
 * Cache current status upon retrieval from database
 */
mouVersionSchema.post('init', function () {
  this._originalStatus = this.status;
});

mouVersionSchema.post('save', function () {
  this._originalStatus = this.status;
});

/**
 * Pre-save immutability enforcement:
 * Once an MoUVersion is partially or fully signed, its snapshot and hash can NEVER be mutated.
 */
mouVersionSchema.pre('save', function (next) {
  if (!this.isNew) {
    const isSigned =
      this.status === MOU_VERSION_STATUS.PARTIALLY_SIGNED ||
      this.status === MOU_VERSION_STATUS.EXECUTED ||
      this._originalStatus === MOU_VERSION_STATUS.PARTIALLY_SIGNED ||
      this._originalStatus === MOU_VERSION_STATUS.EXECUTED;

    if (isSigned) {
      const immutableFields = [
        'mouId',
        'versionNumber',
        'sourceAgreementId',
        'documentHash',
        'hashAlgorithm',
        'agreementSnapshot',
        'templateIdentifier',
      ];
      for (const field of immutableFields) {
        if (this.isModified(field)) {
          const err = new Error(
            `Signed MoU Version ${this.versionNumber} is immutable. Field "${field}" cannot be modified.`
          );
          err.name = 'ValidationError';
          return next(err);
        }
      }
    }
  }
  next();
});

/**
 * Forbid mutating signed MoU versions via query updates
 */
mouVersionSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (
    doc &&
    (doc.status === MOU_VERSION_STATUS.PARTIALLY_SIGNED ||
      doc.status === MOU_VERSION_STATUS.EXECUTED)
  ) {
    const update = this.getUpdate();
    const modifiedKeys = Object.keys(update?.$set || update || {});
    const forbidden = [
      'mouId',
      'versionNumber',
      'sourceAgreementId',
      'documentHash',
      'hashAlgorithm',
      'agreementSnapshot',
      'templateIdentifier',
    ];
    for (const f of forbidden) {
      if (modifiedKeys.some((k) => k === f || k.startsWith(f + '.'))) {
        const err = new Error(
          `Signed MoU Version ${doc.versionNumber} is immutable. Field "${f}" cannot be modified.`
        );
        err.name = 'ValidationError';
        return next(err);
      }
    }
  }
  next();
});

/**
 * Forbid deleting signed MoU versions
 */
mouVersionSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'],
  async function (next) {
    const doc = await this.model.findOne(this.getQuery());
    if (
      doc &&
      (doc.status === MOU_VERSION_STATUS.PARTIALLY_SIGNED ||
        doc.status === MOU_VERSION_STATUS.EXECUTED)
    ) {
      const err = new Error(
        'Signed MoU versions are legally binding historical records and cannot be deleted.'
      );
      err.name = 'ValidationError';
      return next(err);
    }
    next();
  }
);

const MouVersion = mongoose.model('MouVersion', mouVersionSchema);

module.exports = MouVersion;
