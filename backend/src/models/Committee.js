const mongoose = require('mongoose');

const CommitteeSchema = new mongoose.Schema(
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
      required: [true, 'Committee name is required'],
      trim: true,
      index: true,
    },
    committeeName: {
      type: String,
      trim: true,
    },
    college: {
      name: {
        type: String,
        required: [true, 'College name is required'],
        trim: true,
        index: true,
      },
      location: {
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: 'India' },
      },
    },
    collegeName: {
      type: String,
      trim: true,
    },
    collegeEmail: {
      type: String,
      trim: true,
      lowercase: true,
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
    committeeType: {
      type: String,
      trim: true,
      default: 'General',
    },
    category: {
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
      type: String,
      trim: true,
      default: '',
    },
    socialLinks: {
      instagram: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    contact: {
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
    },
    selfReportedEvents: [{
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

CommitteeSchema.index({ 'college.location.city': 1 });

module.exports = mongoose.models.Committee || mongoose.model('Committee', CommitteeSchema);
