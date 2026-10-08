const mongoose = require('mongoose');

const SponsorshipPackageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Package title is required'],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    contributionTypes: [{
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
    cashPrice: {
      type: Number,
      default: 0,
    },
    cashRequirement: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    nonCashRequirements: [{
      type: {
        type: String,
        enum: [
          'PRODUCT',
          'SERVICE',
          'FOOD',
          'BEVERAGE',
          'MERCHANDISE',
          'EQUIPMENT',
          'VENUE',
          'TRANSPORTATION',
          'GIFT_HAMPER',
          'OTHER',
        ],
      },
      description: { type: String, trim: true },
      quantity: { type: Number, default: 1 },
      unit: { type: String, trim: true, default: '' },
    }],
    benefits: [{
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    }],
    availability: {
      type: Number,
      default: 1,
    },
    maxSponsors: {
      type: Number,
      default: 1,
    },
    currentSponsors: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL', 'LIMITED', 'SOLD_OUT', 'INACTIVE'],
      default: 'AVAILABLE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SponsorshipPackageSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.models.SponsorshipPackage || mongoose.model('SponsorshipPackage', SponsorshipPackageSchema);
