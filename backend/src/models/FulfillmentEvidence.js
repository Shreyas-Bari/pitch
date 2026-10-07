const mongoose = require('mongoose');

const FulfillmentEvidenceSchema = new mongoose.Schema(
  {
    fulfillmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fulfillment',
      required: [true, 'Fulfillment ID is required'],
      index: true,
    },
    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader User ID is required'],
      index: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.FulfillmentEvidence || mongoose.model('FulfillmentEvidence', FulfillmentEvidenceSchema);
