const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../utils/constants');

/**
 * Notification Model
 * Collection: notifications
 * Source: docs/PITCH_DATABASE_FINAL.md Section 27
 */
const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user ID is required'],
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    entityType: {
      type: String,
      default: null,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 27 & Section 33
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, readAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
