const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'APPLICATION_RECEIVED',
        'APPLICATION_ACCEPTED',
        'APPLICATION_REJECTED',
        'INVITATION_RECEIVED',
        'INVITATION_ACCEPTED',
        'INVITATION_DECLINED',
        'NEW_APPLICATION',
        'NEW_INVITATION',
        'NEW_MESSAGE',
        'NEW_PROPOSAL',
        'COUNTER_PROPOSAL',
        'PROPOSAL_ACCEPTED',
        'PROPOSAL_DECLINED',
        'MOU_CREATED',
        'MOU_UPDATED',
        'MOU_GENERATED',
        'SIGNATURE_REQUESTED',
        'MOU_SIGNED',
        'DEAL_EXECUTED',
        'CONTRIBUTION_DUE',
        'CONTRIBUTION_RECEIVED',
        'FULFILLMENT_UPDATE',
        'DEAL_COMPLETED',
        'REVIEW_AVAILABLE',
        'NEW_REVIEW',
        'DISPUTE_CREATED',
        'SYSTEM',
      ],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    body: {
      type: String,
      trim: true,
    },
    entityType: {
      type: String,
      trim: true,
      default: '',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedEntityType: {
      type: String,
      trim: true,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actionUrl: {
      type: String,
      trim: true,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
NotificationSchema.index({ recipientUserId: 1, readAt: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
