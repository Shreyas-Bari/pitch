const mongoose = require('mongoose');

/**
 * SavedEvent Model
 * Collection: savedEvents
 * Source: docs/PITCH_DATABASE_FINAL.md Section 12
 */
const savedEventSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index per PITCH_DATABASE_FINAL.md Section 12
savedEventSchema.index({ companyId: 1, eventId: 1 }, { unique: true });

const SavedEvent = mongoose.model('SavedEvent', savedEventSchema);

module.exports = SavedEvent;
