const mongoose = require('mongoose');
const {
  FULFILLMENT_RESPONSIBLE_PARTY,
  FULFILLMENT_TYPE,
  FULFILLMENT_STATUS,
} = require('../utils/constants');

/**
 * Fulfillment Model
 * Collection: fulfillments
 * Source: docs/PITCH_DATABASE_FINAL.md Section 22
 */
const fulfillmentSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required for fulfillment'],
    },
    responsibleParty: {
      type: String,
      enum: Object.values(FULFILLMENT_RESPONSIBLE_PARTY),
      required: [true, 'Responsible party is required'],
    },
    type: {
      type: String,
      enum: Object.values(FULFILLMENT_TYPE),
      required: [true, 'Fulfillment obligation type is required'],
    },
    description: {
      type: String,
      required: [true, 'Fulfillment description is required'],
    },
    quantity: {
      type: Number,
      min: 0,
      default: 1,
    },
    unit: {
      type: String,
      default: 'units',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(FULFILLMENT_STATUS),
      default: FULFILLMENT_STATUS.PENDING,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 22 & Section 33
fulfillmentSchema.index({ dealId: 1 });
fulfillmentSchema.index({ responsibleParty: 1 });
fulfillmentSchema.index({ status: 1 });
fulfillmentSchema.index({ dueDate: 1 });

const Fulfillment = mongoose.model('Fulfillment', fulfillmentSchema);

module.exports = Fulfillment;
