const mongoose = require('mongoose');
const { CONTRIBUTION_TYPES } = require('../utils/constants');

/**
 * Company Model
 * Collection: companies
 * Source: docs/PITCH_DATABASE_FINAL.md Section 5
 */
const companySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for company profile'],
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: '',
    },
    logoFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    coverFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    contact: {
      phone: { type: String, trim: true, default: '' },
    },
    socialLinks: {
      linkedin: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    sponsorshipPreferences: {
      eventCategories: [{ type: String, trim: true }],
      preferredLocations: [{ type: String, trim: true }],
      targetAudience: [{ type: String, trim: true }],
      budgetMin: { type: Number, min: 0, default: 0 },
      budgetMax: { type: Number, min: 0, default: 0 },
      contributionTypes: [
        {
          type: String,
          enum: CONTRIBUTION_TYPES,
        },
      ],
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit indexes per PITCH_DATABASE_FINAL.md Section 5
companySchema.index({ userId: 1 }, { unique: true });
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ 'location.city': 1 });
companySchema.index({ 'location.state': 1 });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
