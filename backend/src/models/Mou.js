const mongoose = require('mongoose');
const { MOU_STATUS } = require('../utils/constants');

/**
 * MoU Model (Container)
 * Collection: mous
 * Source: docs/PITCH_DATABASE_FINAL.md Section 19
 */
const mouSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required for MoU'],
    },
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MouVersion',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(MOU_STATUS),
      default: MOU_STATUS.DRAFT,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 19 & Section 33
mouSchema.index({ dealId: 1 }, { unique: true });

const Mou = mongoose.model('Mou', mouSchema);

module.exports = Mou;
