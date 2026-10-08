const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner User ID is required'],
      index: true,
    },
    provider: {
      type: String,
      enum: ['CLOUDINARY', 'LOCAL', 'S3'],
      default: 'CLOUDINARY',
    },
    publicId: {
      type: String,
      required: [true, 'File public ID is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ['IMAGE', 'RAW', 'DOCUMENT', 'VIDEO'],
      default: 'IMAGE',
    },
    mimeType: {
      type: String,
      default: '',
    },
    originalName: {
      type: String,
      default: '',
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    purpose: {
      type: String,
      enum: [
        'PROFILE_IMAGE',
        'EVENT_IMAGE',
        'CHAT_ATTACHMENT',
        'FULFILLMENT_EVIDENCE',
        'MOU_DOCUMENT',
        'OTHER',
      ],
      default: 'OTHER',
    },
  },
  {
    timestamps: true,
  }
);

FileSchema.index({ provider: 1, publicId: 1 }, { unique: true });

module.exports = mongoose.models.File || mongoose.model('File', FileSchema);
