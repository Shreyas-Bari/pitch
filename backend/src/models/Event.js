const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    committeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Owning committee ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      trim: true,
      default: 'Event',
    },
    eventDate: {
      type: Date,
      required: [true, 'Event start date is required'],
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      default: null,
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      mode: {
        type: String,
        enum: ['PHYSICAL', 'ONLINE', 'HYBRID'],
        default: 'PHYSICAL',
      },
      venue: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '', index: true },
      state: { type: String, trim: true, default: '', index: true },
      country: { type: String, trim: true, default: 'India' },
    },
    expectedAudience: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    audienceDescription: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedReach: {
      type: Number,
      default: 0,
    },
    socialReach: {
      instagram: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    sponsorshipTarget: {
      type: Number,
      default: 0,
    },
    banner: {
      type: String,
      default: '',
    },
    bannerFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    mediaFileIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    }],
    gallery: [{
      type: String,
    }],
    sponsorshipRequirements: {
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
      budgetMin: { type: Number, default: 0 },
      budgetMax: { type: Number, default: 0 },
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC',
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

EventSchema.index({ tags: 1 });
EventSchema.index({ 'location.city': 1, status: 1 });
EventSchema.index({ category: 1, status: 1 });
EventSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
