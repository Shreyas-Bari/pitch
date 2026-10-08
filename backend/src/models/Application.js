const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorshipPackage',
      default: null,
    },
    proposedPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorshipPackage',
      default: null,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    proposedContribution: {
      types: [{
        type: String,
        enum: [
          'CASH',
          'PRODUCT',
          'SERVICE',
          'MIXED',
          'FOOD',
          'BEVERAGE',
          'MERCHANDISE',
          'EQUIPMENT',
          'VENUE',
          'TRANSPORTATION',
          'GIFT_HAMPER',
          'OTHER',
        ],
      }],
      cash: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
      },
      nonCash: [{
        type: { type: String, default: 'PRODUCT' },
        description: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: '' },
      }],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
      index: true,
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

ApplicationSchema.index({ eventId: 1, companyId: 1 });
ApplicationSchema.index({ companyId: 1, status: 1 });
ApplicationSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
