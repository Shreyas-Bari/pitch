const mongoose = require('mongoose');
const { APPLICATION_STATUS, CONTRIBUTION_TYPES } = require('../utils/constants');

/**
 * Application Model
 * Collection: applications
 * Source: docs/PITCH_DATABASE_FINAL.md Section 10
 */
const applicationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorshipPackage',
      default: null,
    },
    message: {
      type: String,
      default: '',
    },
    proposedContribution: {
      types: [
        {
          type: String,
          enum: CONTRIBUTION_TYPES,
        },
      ],
      cash: {
        amount: { type: Number, min: 0, default: 0 },
        currency: { type: String, default: 'INR' },
      },
      nonCash: [
        {
          type: {
            type: String,
            enum: CONTRIBUTION_TYPES,
            default: 'PRODUCT',
          },
          description: { type: String, default: '' },
          quantity: { type: Number, min: 0, default: 1 },
          unit: { type: String, default: 'units' },
        },
      ],
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.PENDING,
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

// Indexes per PITCH_DATABASE_FINAL.md Section 10 & Section 33
applicationSchema.index({ eventId: 1, companyId: 1 });
applicationSchema.index({ companyId: 1, status: 1 });
applicationSchema.index({ eventId: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
