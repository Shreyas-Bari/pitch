const mongoose = require('mongoose');
const { REVIEW_STATUS } = require('../utils/constants');

/**
 * Review Model
 * Collection: reviews
 * Source: docs/PITCH_DATABASE_FINAL.md Section 24
 */
const reviewSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required for review'],
    },
    reviewerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer user ID is required'],
    },
    revieweeCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    revieweeCommitteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PUBLISHED,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 24 & Section 33
reviewSchema.index({ dealId: 1, reviewerUserId: 1 }, { unique: true });
reviewSchema.index({ revieweeCompanyId: 1 });
reviewSchema.index({ revieweeCommitteeId: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
