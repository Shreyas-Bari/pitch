const mongoose = require('mongoose');
const { DISPUTE_STATUS } = require('../utils/constants');

/**
 * Dispute Model
 * Collection: disputes
 * Source: docs/PITCH_FINAL_BUILD_SPEC.md Section 31
 */
const disputeSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required for dispute'],
    },
    reportedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporting user ID is required'],
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
    },
    description: {
      type: String,
      required: [true, 'Dispute description is required'],
    },
    evidence: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    status: {
      type: String,
      enum: Object.values(DISPUTE_STATUS),
      default: DISPUTE_STATUS.OPEN,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_FINAL_BUILD_SPEC.md Section 31
disputeSchema.index({ dealId: 1 });
disputeSchema.index({ reportedByUserId: 1 });
disputeSchema.index({ status: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
