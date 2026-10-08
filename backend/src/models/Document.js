const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner User ID is required'],
      index: true,
    },
    entityType: {
      type: String,
      trim: true,
      default: '',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    hash: {
      type: String,
      default: '',
    },
    publicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
