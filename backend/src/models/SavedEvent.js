const mongoose = require('mongoose');

const SavedEventSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SavedEventSchema.index({ companyId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.models.SavedEvent || mongoose.model('SavedEvent', SavedEventSchema);
