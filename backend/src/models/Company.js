const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner User ID is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
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
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: '',
      index: true,
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
      email: { type: String, trim: true, lowercase: true, default: '' },
    },
    socialLinks: {
      linkedin: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    targetAudience: [{
      type: String,
      trim: true,
    }],
    budgetMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    budgetMax: {
      type: Number,
      min: 0,
      default: 0,
    },
    interests: [{
      type: String,
      trim: true,
    }],
    sponsorshipPreferences: {
      eventCategories: [{ type: String, trim: true }],
      preferredLocations: [{ type: String, trim: true }],
      targetAudience: [{ type: String, trim: true }],
      budgetMin: { type: Number, min: 0, default: 0 },
      budgetMax: { type: Number, min: 0, default: 0 },
      contributionTypes: [{
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
    },
    selfReportedHistory: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

CompanySchema.index({ 'location.city': 1 });
CompanySchema.index({ 'location.state': 1 });
CompanySchema.index({ industry: 1, 'location.city': 1 });

module.exports = mongoose.models.Company || mongoose.model('Company', CompanySchema);
