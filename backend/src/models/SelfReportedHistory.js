const mongoose = require('mongoose');

const SelfReportedHistorySchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ['COMPANY', 'COMMITTEE'],
      required: [true, 'Owner type is required'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Owner ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    eventName: {
      type: String,
      trim: true,
      default: '',
    },
    partnerName: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: null,
    },
    mediaFileIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    }],
    mediaUrls: [{
      type: String,
    }],
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

SelfReportedHistorySchema.index({ ownerType: 1, ownerId: 1 });

module.exports = mongoose.models.SelfReportedHistory || mongoose.model('SelfReportedHistory', SelfReportedHistorySchema);
