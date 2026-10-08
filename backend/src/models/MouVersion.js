const mongoose = require('mongoose');

const MouVersionSchema = new mongoose.Schema(
  {
    mouId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mou',
      required: [true, 'MoU ID is required'],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    sourceAgreementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DealAgreement',
      default: null,
    },
    generatedFromProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    agreementSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    parties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    eventDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    contributions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    benefits: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    obligations: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    deliveryRequirements: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    terms: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    templateIdentifier: {
      type: String,
      default: 'PITCH_MOU_V1',
    },
    documentFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    documentHash: {
      type: String,
      default: '',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'FINAL',
        'READY_FOR_SIGNATURE',
        'PARTIALLY_SIGNED',
        'SIGNED',
        'EXECUTED',
        'SUPERSEDED',
        'VOID',
      ],
      default: 'DRAFT',
      index: true,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

MouVersionSchema.index({ mouId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.models.MouVersion || mongoose.model('MouVersion', MouVersionSchema);
