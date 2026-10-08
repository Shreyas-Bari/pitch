const mongoose = require('mongoose');
const { MESSAGE_TYPE } = require('../utils/constants');

/**
 * Message Model
 * Collection: messages
 * Source: docs/PITCH_DATABASE_FINAL.md Section 14
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user ID is required'],
    },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      default: MESSAGE_TYPE.TEXT,
    },
    text: {
      type: String,
      default: '',
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    // Structured card fields (PITCH_FINAL_BUILD_SPEC.md Section 20 & PITCH_DATABASE_FINAL_V2.md)
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorshipPackage',
      default: null,
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null,
    },
    mouId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MoU',
      default: null,
    },
    contactShareId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContactShare',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 14 & Section 33
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderUserId: 1 });
messageSchema.index({ conversationId: 1, type: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
