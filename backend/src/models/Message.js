const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'TEXT',
        'IMAGE',
        'FILE',
        'DOCUMENT',
        'EVENT_CARD',
        'PACKAGE_CARD',
        'PROPOSAL',
        'COUNTER_PROPOSAL',
        'CONTACT',
        'MOU_CARD',
        'SYSTEM',
      ],
      default: 'TEXT',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      trim: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    attachments: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
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
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
