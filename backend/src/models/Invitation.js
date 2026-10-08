const mongoose = require('mongoose');
const { INVITATION_STATUS } = require('../utils/constants');

/**
 * Invitation Model
 * Collection: invitations
 * Source: docs/PITCH_DATABASE_FINAL.md Section 11
 */
const invitationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    committeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Committee ID is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorshipPackage',
      default: null,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 11 & Section 33
invitationSchema.index({ eventId: 1, companyId: 1 });
invitationSchema.index({ companyId: 1, status: 1 });
invitationSchema.index({ committeeId: 1, status: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
