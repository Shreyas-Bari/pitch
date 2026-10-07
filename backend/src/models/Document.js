const mongoose = require('mongoose');
const { HASH_ALGORITHM } = require('../utils/constants');

/**
 * Document Model
 * Collection: documents
 * Source: docs/PITCH_FINAL_BUILD_SPEC.md Section 30
 */
const documentSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Document owner user ID is required'],
    },
    entityType: {
      type: String,
      default: null,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileType: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      required: [true, 'Document URL is required'],
    },
    size: {
      type: Number,
      default: 0,
    },
    hash: {
      type: String,
      match: [/^[a-f0-9]{64}$/i, 'hash must be a valid 64-character SHA-256 hex string'],
      default: null,
    },
    hashAlgorithm: {
      type: String,
      default: HASH_ALGORITHM,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_FINAL_BUILD_SPEC.md Section 30
documentSchema.index({ ownerUserId: 1 });
documentSchema.index({ entityType: 1, entityId: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
