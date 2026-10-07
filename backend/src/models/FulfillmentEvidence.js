const mongoose = require('mongoose');

/**
 * FulfillmentEvidence Model
 * Collection: fulfillmentEvidence
 * Source: docs/PITCH_DATABASE_FINAL.md Section 23
 */
const fulfillmentEvidenceSchema = new mongoose.Schema(
  {
    fulfillmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fulfillment',
      required: [true, 'Fulfillment obligation ID is required'],
    },
    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user ID is required'],
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'Evidence file ID is required'],
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 23
fulfillmentEvidenceSchema.index({ fulfillmentId: 1 });
fulfillmentEvidenceSchema.index({ uploadedByUserId: 1 });

const FulfillmentEvidence = mongoose.model(
  'FulfillmentEvidence',
  fulfillmentEvidenceSchema
);

module.exports = FulfillmentEvidence;
