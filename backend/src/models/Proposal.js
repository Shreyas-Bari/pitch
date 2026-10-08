const mongoose = require('mongoose');
const {
  PROPOSAL_STATUS,
  PROPOSAL_TRANSITIONS,
  CONTRIBUTION_TYPES,
} = require('../utils/constants');

/**
 * Proposal Model
 * Collection: proposals
 * Source: docs/PITCH_DATABASE_FINAL.md Section 17 & docs/PITCH_FINAL_BUILD_SPEC.md Section 23
 * Strictly immutable negotiation version records with governed lifecycle state machine.
 */
const proposalSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: [true, 'Deal ID is required for proposal'],
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    basedOnProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    contribution: {
      types: [
        {
          type: String,
          enum: {
            values: CONTRIBUTION_TYPES,
            message: 'Invalid contribution type: {VALUE}',
          },
        },
      ],
      cash: {
        amount: { type: Number, min: 0, default: 0 },
        currency: { type: String, default: 'INR' },
      },
      nonCash: [
        {
          type: {
            type: String,
            enum: CONTRIBUTION_TYPES,
            default: 'PRODUCT',
          },
          name: { type: String, default: '' },
          description: { type: String, default: '' },
          quantity: { type: Number, min: 0, default: 1 },
          unit: { type: String, default: 'units' },
          estimatedValue: { type: Number, min: 0, default: 0 },
          expectedDate: { type: Date, default: null },
          status: { type: String, default: 'PENDING' },
        },
      ],
    },
    benefits: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    deliverables: [
      {
        party: {
          type: String,
          enum: ['COMPANY', 'COMMITTEE'],
          required: true,
        },
        description: { type: String, required: true },
        dueDate: { type: Date, default: null },
      },
    ],
    terms: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(PROPOSAL_STATUS),
      default: PROPOSAL_STATUS.PENDING,
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

// Indexes per PITCH_DATABASE_FINAL.md Section 17 & Section 33
proposalSchema.index({ dealId: 1, version: 1 });
proposalSchema.index({ dealId: 1, status: 1 });
proposalSchema.index({ createdByUserId: 1 });

/**
 * Cache original status upon load and save
 */
proposalSchema.post('init', function () {
  this._originalStatus = this.status;
});

proposalSchema.post('save', function () {
  this._originalStatus = this.status;
});

/**
 * Static method to check whether a proposal state transition is permitted
 */
proposalSchema.statics.isValidTransition = function (fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  const allowed = PROPOSAL_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
};

/**
 * Instance helper to check transition
 */
proposalSchema.methods.canTransitionTo = function (targetStatus) {
  return mongoose.model('Proposal').isValidTransition(this.status, targetStatus);
};

/**
 * Pre-save immutability & lifecycle transition enforcement:
 * 1. Commercial terms can NEVER be edited once created.
 * 2. Only valid lifecycle transitions (e.g. PENDING -> ACCEPTED) are allowed.
 */
proposalSchema.pre('save', function (next) {
  if (!this.isNew) {
    // 1. Verify immutable terms fields
    const immutableFields = [
      'dealId',
      'createdByUserId',
      'version',
      'basedOnProposalId',
      'contribution',
      'benefits',
      'deliverables',
      'terms',
    ];
    for (const field of immutableFields) {
      if (this.isModified(field)) {
        const err = new Error(
          `Proposal version ${this.version} is immutable. Field "${field}" cannot be modified. Create a new proposal version instead.`
        );
        err.name = 'ValidationError';
        return next(err);
      }
    }

    // 2. Verify lifecycle status transition
    if (this.isModified('status')) {
      const fromStatus = this._originalStatus || this.status;
      const toStatus = this.status;
      const isValid = mongoose.model('Proposal').isValidTransition(fromStatus, toStatus);
      if (!isValid) {
        const allowed = PROPOSAL_TRANSITIONS[fromStatus] || [];
        const err = new Error(
          `Invalid proposal status transition from "${fromStatus}" to "${toStatus}". Allowed transitions: [${allowed.join(', ')}]`
        );
        err.name = 'ValidationError';
        return next(err);
      }
    }
  }
  next();
});

/**
 * Forbid deleting proposal records
 */
proposalSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'],
  function (next) {
    const err = new Error(
      'Proposals are immutable historical negotiation records and cannot be deleted.'
    );
    err.name = 'ValidationError';
    return next(err);
  }
);

/**
 * Forbid mutating negotiation terms & enforce status transitions through query update operators
 */
proposalSchema.pre(
  ['findOneAndUpdate', 'updateOne', 'updateMany'],
  async function (next) {
    const update = this.getUpdate();
    const modifiedKeys = Object.keys(update?.$set || update || {});
    const forbidden = [
      'dealId',
      'createdByUserId',
      'version',
      'basedOnProposalId',
      'contribution',
      'benefits',
      'deliverables',
      'terms',
    ];
    for (const f of forbidden) {
      if (modifiedKeys.some((k) => k === f || k.startsWith(f + '.'))) {
        const err = new Error(
          `Proposal negotiation terms are immutable. Field "${f}" cannot be modified. Create a new proposal version instead.`
        );
        err.name = 'ValidationError';
        return next(err);
      }
    }

    // Verify status transition via query
    const newStatus = update?.status || update?.$set?.status;
    if (newStatus) {
      const doc = await this.model.findOne(this.getQuery());
      if (doc) {
        const isValid = mongoose.model('Proposal').isValidTransition(doc.status, newStatus);
        if (!isValid) {
          const allowed = PROPOSAL_TRANSITIONS[doc.status] || [];
          const err = new Error(
            `Invalid proposal status transition from "${doc.status}" to "${newStatus}". Allowed transitions: [${allowed.join(', ')}]`
          );
          err.name = 'ValidationError';
          return next(err);
        }
      }
    }

    next();
  }
);

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
