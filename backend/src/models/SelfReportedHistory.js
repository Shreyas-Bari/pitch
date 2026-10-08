const mongoose = require('mongoose');
const { SELF_REPORTED_OWNER_TYPE } = require('../utils/constants');

/**
 * SelfReportedHistory Model
 * Collection: selfReportedHistory
 * Source: docs/PITCH_DATABASE_FINAL.md Section 25
 */
const selfReportedHistorySchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: Object.values(SELF_REPORTED_OWNER_TYPE),
      required: [true, 'Owner type is required (COMPANY or COMMITTEE)'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Owner ID is required'],
    },
    title: {
      type: String,
      required: [true, 'History title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    partnerName: {
      type: String,
      required: [true, 'Partner organization name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    mediaFileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['SELF_REPORTED'],
      default: 'SELF_REPORTED',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 25
selfReportedHistorySchema.index({ ownerType: 1, ownerId: 1 });

const SelfReportedHistory = mongoose.model(
  'SelfReportedHistory',
  selfReportedHistorySchema
);

module.exports = SelfReportedHistory;
