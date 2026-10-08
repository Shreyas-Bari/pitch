const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    participantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Participant Company ID is required'],
      index: true,
    },
    participantCommitteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Participant Committee ID is required'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    committeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'BLOCKED'],
      default: 'ACTIVE',
      index: true,
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ participantCompanyId: 1, participantCommitteeId: 1, eventId: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
