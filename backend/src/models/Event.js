const mongoose = require('mongoose');
const {
  EVENT_LOCATION_MODE,
  EVENT_STATUS,
  CONTRIBUTION_TYPES,
} = require('../utils/constants');

/**
 * Event Model
 * Collection: events
 * Source: docs/PITCH_DATABASE_FINAL.md Section 8
 */
const eventSchema = new mongoose.Schema(
  {
    committeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Owning committee ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
    },
    eventType: {
      type: String,
      trim: true,
      default: '',
    },
    eventDate: {
      type: Date,
      required: [true, 'Event start date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    location: {
      mode: {
        type: String,
        enum: Object.values(EVENT_LOCATION_MODE),
        default: EVENT_LOCATION_MODE.PHYSICAL,
      },
      venue: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    expectedAudience: {
      min: { type: Number, min: 0, default: 0 },
      max: { type: Number, min: 0, default: 0 },
    },
    audienceDescription: {
      type: String,
      default: '',
    },
    estimatedReach: {
      type: Number,
      min: 0,
      default: 0,
    },
    socialReach: {
      instagram: { type: Number, min: 0, default: 0 },
      linkedin: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 },
    },
    bannerFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    mediaFileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    sponsorshipRequirements: {
      contributionTypes: [
        {
          type: String,
          enum: CONTRIBUTION_TYPES,
        },
      ],
      budgetMin: { type: Number, min: 0, default: 0 },
      budgetMax: { type: Number, min: 0, default: 0 },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit indexes per PITCH_DATABASE_FINAL.md Section 8 & Section 33
eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ committeeId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ 'location.state': 1 });
eventSchema.index({ tags: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
