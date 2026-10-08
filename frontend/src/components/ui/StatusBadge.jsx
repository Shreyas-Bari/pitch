import React from 'react';

const statusConfig = {
  // Event statuses
  DRAFT: {
    label: 'Draft',
    dotColor: 'bg-slate-400',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  PUBLISHED: {
    label: 'Published',
    dotColor: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  ONGOING: {
    label: 'Ongoing',
    dotColor: 'bg-blue-500',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  COMPLETED: {
    label: 'Completed',
    dotColor: 'bg-purple-500',
    className: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  ARCHIVED: {
    label: 'Archived',
    dotColor: 'bg-slate-400',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },

  // Deal statuses
  INTERESTED: {
    label: 'Interested',
    dotColor: 'bg-sky-500',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  DISCUSSION: {
    label: 'Discussion',
    dotColor: 'bg-sky-500',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  NEGOTIATING: {
    label: 'Negotiating',
    dotColor: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  PROPOSAL: {
    label: 'Proposal Sent',
    dotColor: 'bg-indigo-500',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  COUNTER_PROPOSAL: {
    label: 'Counter Proposal',
    dotColor: 'bg-indigo-500',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  AGREED: {
    label: 'Agreed',
    dotColor: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  MOU_DRAFT: {
    label: 'MoU Draft',
    dotColor: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  AWAITING_SIGNATURES: {
    label: 'Awaiting Signatures',
    dotColor: 'bg-amber-600 animate-pulse',
    className: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  PARTIALLY_SIGNED: {
    label: 'Partially Signed',
    dotColor: 'bg-teal-500',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  EXECUTED: {
    label: 'MoU Executed',
    dotColor: 'bg-emerald-600',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
  },
  FULFILLMENT: {
    label: 'In Fulfillment',
    dotColor: 'bg-blue-600',
    className: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  DECLINED: {
    label: 'Declined',
    dotColor: 'bg-red-400',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    dotColor: 'bg-slate-400',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  DISPUTED: {
    label: 'Disputed',
    dotColor: 'bg-red-600',
    className: 'bg-red-100 text-red-900 border-red-300 font-semibold',
  },
  EXPIRED: {
    label: 'Expired',
    dotColor: 'bg-slate-400',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },

  // Application & Invitation statuses
  PENDING: {
    label: 'Pending',
    dotColor: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    dotColor: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    dotColor: 'bg-red-500',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    dotColor: 'bg-slate-400',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },

  // Fulfillment statuses
  PARTIALLY_FULFILLED: {
    label: 'Partially Fulfilled',
    dotColor: 'bg-teal-500',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  FULFILLED: {
    label: 'Fulfilled',
    dotColor: 'bg-emerald-600',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

export function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    dotColor: 'bg-slate-400',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none ${config.className} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export default StatusBadge;
