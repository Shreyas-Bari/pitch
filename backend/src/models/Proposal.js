const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required'],
      index: true,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    basedOnProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    parentProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    contribution: {
      types: [{
        type: String,
        enum: [
          'CASH',
          'PRODUCT',
          'SERVICE',
          'MIXED',
          'FOOD',
          'BEVERAGE',
          'MERCHANDISE',
          'EQUIPMENT',
          'VENUE',
          'TRANSPORTATION',
          'GIFT_HAMPER',
          'OTHER',
        ],
      }],
      cash: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
      },
      nonCash: [{
        type: { type: String, default: 'PRODUCT' },
        description: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: '' },
      }],
    },
    contributions: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    benefits: [{
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    }],
    deliverables: [{
      party: {
        type: String,
        enum: ['COMPANY', 'COMMITTEE'],
        required: true,
      },
      description: { type: String, trim: true },
      dueDate: { type: Date, default: null },
    }],
    obligations: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    deliveryRequirements: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    terms: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING',
        'ACCEPTED',
        'COUNTERED',
        'DECLINED',
        'REJECTED',
        'WITHDRAWN',
        'SUPERSEDED',
      ],
      default: 'PENDING',
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ProposalSchema.index({ dealId: 1, version: 1 });
ProposalSchema.index({ dealId: 1, status: 1 });

module.exports = mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
