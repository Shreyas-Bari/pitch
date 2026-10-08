const mongoose = require('mongoose');
const {
  SPONSORSHIP_PACKAGE_STATUS,
  CONTRIBUTION_TYPES,
} = require('../utils/constants');

/**
 * SponsorshipPackage Model
 * Collection: sponsorshipPackages
 * Source: docs/PITCH_DATABASE_FINAL.md Section 9
 */
const sponsorshipPackageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Package title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    contributionTypes: [
      {
        type: String,
        enum: CONTRIBUTION_TYPES,
      },
    ],
    cashRequirement: {
      amount: {
        type: Number,
        min: 0,
        default: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    nonCashRequirements: [
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
    benefits: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    availability: {
      type: Number,
      min: 0,
      default: 1,
    },
    status: {
      type: String,
      enum: Object.values(SPONSORSHIP_PACKAGE_STATUS),
      default: SPONSORSHIP_PACKAGE_STATUS.AVAILABLE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 9 & Section 33
sponsorshipPackageSchema.index({ eventId: 1 });
sponsorshipPackageSchema.index({ status: 1 });

const SponsorshipPackage = mongoose.model(
  'SponsorshipPackage',
  sponsorshipPackageSchema
);

module.exports = SponsorshipPackage;
