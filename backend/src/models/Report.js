const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter User ID is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['USER', 'EVENT', 'MESSAGE', 'DEAL', 'COMPANY', 'COMMITTEE'],
      required: [true, 'Target type is required'],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true,
    },
    resolution: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.models.Report || mongoose.model('Report', ReportSchema);
