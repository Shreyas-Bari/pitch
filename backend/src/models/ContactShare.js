const mongoose = require('mongoose');

/**
 * ContactShare Model
 * Collection: contactShares
 * Source: docs/PITCH_DATABASE_FINAL.md Section 15
 */
const contactShareSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
    },
    sharedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID sharing contact is required'],
    },
    contact: {
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      whatsapp: { type: String, trim: true, default: '' },
      other: { type: String, trim: true, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 15
contactShareSchema.index({ conversationId: 1 });
contactShareSchema.index({ sharedByUserId: 1 });

const ContactShare = mongoose.model('ContactShare', contactShareSchema);

module.exports = ContactShare;
