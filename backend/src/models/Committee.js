const mongoose = require('mongoose');

/**
 * Committee Model
 * Collection: committees
 * Source: docs/PITCH_DATABASE_FINAL.md Section 6
 */
const committeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for committee profile'],
    },
    name: {
      type: String,
      required: [true, 'Committee name is required'],
      trim: true,
    },
    college: {
      name: {
        type: String,
        required: [true, 'College name is required'],
        trim: true,
      },
      location: {
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: 'India' },
      },
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
    committeeType: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
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

// Explicit indexes per PITCH_DATABASE_FINAL.md Section 6
committeeSchema.index({ userId: 1 }, { unique: true });
committeeSchema.index({ name: 1 });
committeeSchema.index({ 'college.name': 1 });
committeeSchema.index({ 'college.location.city': 1 });

const Committee = mongoose.model('Committee', committeeSchema);

module.exports = Committee;
