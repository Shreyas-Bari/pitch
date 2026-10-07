const mongoose = require('mongoose');
const { REPORT_TARGET_TYPE, REPORT_STATUS } = require('../utils/constants');

/**
 * Report Model
 * Collection: reports
 * Source: docs/PITCH_DATABASE_FINAL.md Section 28
 */
const reportSchema = new mongoose.Schema(
  {
    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user ID is required'],
    },
    targetType: {
      type: String,
      enum: Object.values(REPORT_TARGET_TYPE),
      required: [true, 'Report target type is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.OPEN,
    },
    resolution: {
      type: String,
      default: null,
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

// Indexes per PITCH_DATABASE_FINAL.md Section 28
reportSchema.index({ reporterUserId: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
