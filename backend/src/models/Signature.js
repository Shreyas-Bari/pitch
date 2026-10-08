const mongoose = require('mongoose');

const SignatureSchema = new mongoose.Schema(
  {
    mouId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mou',
      required: [true, 'MoU ID is required'],
      index: true,
    },
    mouVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MouVersion',
      required: [true, 'MoU Version ID is required'],
      index: true,
    },
    signerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    signerRole: {
      type: String,
      enum: ['COMPANY', 'COMMITTEE'],
      required: [true, 'Signer role is required'],
    },
    role: {
      type: String,
      enum: ['COMPANY', 'COMMITTEE'],
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    authorityReference: {
      type: String,
      trim: true,
      default: '',
    },
    place: {
      type: String,
      trim: true,
      default: '',
    },
    agreedToTerms: {
      type: Boolean,
      default: true,
    },
    signatureType: {
      type: String,
      enum: ['PLATFORM', 'EXTERNAL_PROVIDER'],
      default: 'PLATFORM',
    },
    signatureData: {
      type: String,
      default: '',
    },
    consentText: {
      type: String,
      default: '',
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    documentHash: {
      type: String,
      default: '',
    },
    documentHashAtSigning: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['SIGNED', 'REVOKED'],
      default: 'SIGNED',
    },
  },
  {
    timestamps: true,
  }
);

SignatureSchema.index({ mouVersionId: 1, signerRole: 1 });

module.exports = mongoose.models.Signature || mongoose.model('Signature', SignatureSchema);
