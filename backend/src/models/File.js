const mongoose = require('mongoose');
const {
  FILE_PROVIDER,
  FILE_RESOURCE_TYPE,
  FILE_PURPOSE,
} = require('../utils/constants');

/**
 * File Model
 * Collection: files
 * Source: docs/PITCH_DATABASE_FINAL.md Section 7
 */
const fileSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File owner user ID is required'],
    },
    provider: {
      type: String,
      enum: Object.values(FILE_PROVIDER),
      default: FILE_PROVIDER.CLOUDINARY,
    },
    publicId: {
      type: String,
      required: [true, 'File public ID is required'],
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    resourceType: {
      type: String,
      enum: Object.values(FILE_RESOURCE_TYPE),
      default: FILE_RESOURCE_TYPE.IMAGE,
    },
    mimeType: {
      type: String,
      default: null,
    },
    originalName: {
      type: String,
      default: null,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    purpose: {
      type: String,
      enum: Object.values(FILE_PURPOSE),
      default: FILE_PURPOSE.OTHER,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 7 & Section 33
fileSchema.index({ provider: 1, publicId: 1 }, { unique: true });
fileSchema.index({ ownerUserId: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;
