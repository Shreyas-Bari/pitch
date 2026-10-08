const mongoose = require('mongoose');
const { CONVERSATION_STATUS } = require('../utils/constants');

/**
 * Conversation Model
 * Collection: conversations
 * Source: docs/PITCH_DATABASE_FINAL.md Section 13
 */
const conversationSchema = new mongoose.Schema(
  {
    participantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Participant company ID is required'],
    },
    participantCommitteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Participant committee ID is required'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(CONVERSATION_STATUS),
      default: CONVERSATION_STATUS.ACTIVE,
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 13 & Section 33
conversationSchema.index({ participantCompanyId: 1 });
conversationSchema.index({ participantCommitteeId: 1 });
conversationSchema.index({ dealId: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
