const mongoose = require('mongoose');

const MouSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required'],
      unique: true,
      index: true,
    },
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MouVersion',
      default: null,
    },
    templateIdentifier: {
      type: String,
      default: 'PITCH_MOU_V1',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'UNDER_REVIEW',
        'PENDING_SIGNATURE',
        'AWAITING_SIGNATURES',
        'PARTIALLY_SIGNED',
        'EXECUTED',
        'SUPERSEDED',
        'VOID',
      ],
      default: 'DRAFT',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Mou || mongoose.model('Mou', MouSchema);
