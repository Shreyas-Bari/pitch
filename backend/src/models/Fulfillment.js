const mongoose = require('mongoose');

const FulfillmentSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required'],
      index: true,
    },
    responsibleParty: {
      type: String,
      enum: ['COMPANY', 'COMMITTEE'],
      required: [true, 'Responsible party is required'],
      index: true,
    },
    contributionIndex: {
      type: Number,
      default: 0,
    },
    contributionName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'CASH',
        'PRODUCT',
        'SERVICE',
        'PROMOTION',
        'BOOTH',
        'MERCHANDISE',
        'FOOD',
        'BEVERAGE',
        'EQUIPMENT',
        'VENUE',
        'TRANSPORTATION',
        'GIFT_HAMPER',
        'OTHER',
      ],
      default: 'OTHER',
    },
    description: {
      type: String,
      required: [true, 'Fulfillment description is required'],
      trim: true,
    },
    expectedAmount: {
      type: Number,
      default: 0,
    },
    expectedQuantity: {
      type: Number,
      default: 0,
    },
    receivedAmount: {
      type: Number,
      default: 0,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'IN_PROGRESS',
        'SUBMITTED',
        'PARTIALLY_FULFILLED',
        'FULFILLED',
        'COMPLETED',
        'DISPUTED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    evidenceFiles: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    notes: {
      type: String,
      default: '',
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

FulfillmentSchema.index({ dealId: 1, responsibleParty: 1, status: 1 });

module.exports = mongoose.models.Fulfillment || mongoose.model('Fulfillment', FulfillmentSchema);
