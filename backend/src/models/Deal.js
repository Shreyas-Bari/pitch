const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    committeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Committee ID is required'],
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'INTERESTED',
        'DISCUSSION',
        'NEGOTIATING',
        'PROPOSAL',
        'COUNTER_PROPOSAL',
        'AGREED',
        'MOU_DRAFT',
        'AWAITING_SIGNATURES',
        'PARTIALLY_SIGNED',
        'EXECUTED',
        'FULFILLMENT',
        'COMPLETED',
        'DECLINED',
        'CANCELLED',
        'DISPUTED',
        'EXPIRED',
      ],
      default: 'INTERESTED',
      index: true,
    },
    currentProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    agreedTermsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DealAgreement',
      default: null,
    },
    mouId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mou',
      default: null,
    },
    contributions: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    benefits: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    obligations: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    terms: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    agreedAt: {
      type: Date,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

DealSchema.index({ companyId: 1, status: 1 });
DealSchema.index({ committeeId: 1, status: 1 });
DealSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.models.Deal || mongoose.model('Deal', DealSchema);
