const mongoose = require('mongoose');

const DealAgreementSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required'],
      index: true,
    },
    acceptedProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: [true, 'Accepted Proposal ID is required'],
      index: true,
    },
    snapshot: {
      contribution: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      benefits: [{
        type: mongoose.Schema.Types.Mixed,
      }],
      deliverables: [{
        type: mongoose.Schema.Types.Mixed,
      }],
      terms: {
        type: mongoose.Schema.Types.Mixed,
        default: '',
      },
      paymentDetails: {
        beneficiaryName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        branch: { type: String, default: '' },
        ifsc: { type: String, default: '' },
        gstin: { type: String, default: '' },
        pan: { type: String, default: '' },
        accountsEmail: { type: String, default: '' },
        paymentSchedule: { type: String, default: '' },
        gstRate: { type: Number, default: 18 },
      },
    },
    agreedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['COMPANY', 'COMMITTEE'],
      },
      agreedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    status: {
      type: String,
      enum: ['AGREED', 'SUPERSEDED'],
      default: 'AGREED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.DealAgreement || mongoose.model('DealAgreement', DealAgreementSchema);
