const mongoose = require('mongoose');
const { DEAL_STATUS, DEAL_TRANSITIONS } = require('../utils/constants');

/**
 * Deal Model
 * Collection: deals
 * Source: docs/PITCH_DATABASE_FINAL.md Section 16 & Reconciliation Note 1
 * Strictly enforces the 16-stage PITCH state machine.
 */
const dealSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required for a deal'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required for a deal'],
    },
    committeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Committee',
      required: [true, 'Committee ID is required for a deal'],
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DEAL_STATUS),
        message: 'Invalid deal status: {VALUE}',
      },
      default: DEAL_STATUS.INTERESTED,
    },
    currentProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    agreedTermsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DealAgreement',
      default: null,
    },
    mouId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mou',
      default: null,
    },
    contributions: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    benefits: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    obligations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    terms: {
      type: String,
      default: '',
    },
    agreedAt: {
      type: Date,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per PITCH_DATABASE_FINAL.md Section 16 & Section 33
dealSchema.index({ companyId: 1, status: 1 });
dealSchema.index({ committeeId: 1, status: 1 });
dealSchema.index({ eventId: 1 });
dealSchema.index({ status: 1 });

/**
 * Validates whether transition from fromStatus to toStatus is valid
 * per the Deal state machine specification.
 */
dealSchema.statics.isValidTransition = function (fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  const allowed = DEAL_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};

/**
 * Instance method to check if deal can transition to targetStatus
 */
dealSchema.methods.canTransitionTo = function (targetStatus) {
  return mongoose.model('Deal').isValidTransition(this.status, targetStatus);
};

/**
 * Cache current status upon retrieval from database
 */
dealSchema.post('init', function () {
  this._originalStatus = this.status;
});

/**
 * Pre-save validation hook: strictly reject invalid state machine transitions
 */
dealSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('status')) {
    const fromStatus = this._originalStatus || this.status;
    const toStatus = this.status;

    if (fromStatus !== toStatus) {
      const isValid = mongoose.model('Deal').isValidTransition(fromStatus, toStatus);
      if (!isValid) {
        const allowed = DEAL_TRANSITIONS[fromStatus] || [];
        const err = new Error(
          `Invalid deal state transition from "${fromStatus}" to "${toStatus}". Allowed transitions: [${allowed.join(', ')}]`
        );
        err.name = 'ValidationError';
        return next(err);
      }
    }

    // Set state change audit timestamps
    if (toStatus === DEAL_STATUS.AGREED && !this.agreedAt) {
      this.agreedAt = new Date();
    }
    if (toStatus === DEAL_STATUS.EXECUTED && !this.executedAt) {
      this.executedAt = new Date();
    }
    if (toStatus === DEAL_STATUS.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
    }
    if (toStatus === DEAL_STATUS.CANCELLED && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }

    this._originalStatus = toStatus;
  }
  next();
});

/**
 * Query middleware hook: strictly reject invalid transitions on query updates
 */
dealSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
  const update = this.getUpdate();
  const newStatus = update?.status || update?.$set?.status;

  if (newStatus) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc && doc.status !== newStatus) {
      const isValid = mongoose.model('Deal').isValidTransition(doc.status, newStatus);
      if (!isValid) {
        const allowed = DEAL_TRANSITIONS[doc.status] || [];
        const err = new Error(
          `Invalid deal state transition from "${doc.status}" to "${newStatus}". Allowed transitions: [${allowed.join(', ')}]`
        );
        err.name = 'ValidationError';
        return next(err);
      }
    }
  }
  next();
});

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
