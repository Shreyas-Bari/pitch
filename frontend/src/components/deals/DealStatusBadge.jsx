import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Scale,
  FileText,
  Repeat,
  CheckCircle,
  FileSignature,
  PenTool,
  ShieldCheck,
  PackageCheck,
  Award,
  XCircle,
  Ban,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { DEAL_STATUS } from '../../utils/constants';

const statusConfig = {
  [DEAL_STATUS.INTERESTED]: {
    label: 'Interested',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Sparkles,
  },
  [DEAL_STATUS.DISCUSSION]: {
    label: 'Discussion',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: MessageSquare,
  },
  [DEAL_STATUS.NEGOTIATING]: {
    label: 'Negotiating',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Scale,
  },
  [DEAL_STATUS.PROPOSAL]: {
    label: 'Proposal Submitted',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: FileText,
  },
  [DEAL_STATUS.COUNTER_PROPOSAL]: {
    label: 'Counter-Proposal',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Repeat,
  },
  [DEAL_STATUS.AGREED]: {
    label: 'Terms Agreed',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  [DEAL_STATUS.MOU_DRAFT]: {
    label: 'MoU Drafted',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: FileSignature,
  },
  [DEAL_STATUS.AWAITING_SIGNATURES]: {
    label: 'Awaiting Signatures',
    color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    icon: PenTool,
  },
  [DEAL_STATUS.PARTIALLY_SIGNED]: {
    label: 'Partially Signed',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    icon: PenTool,
  },
  [DEAL_STATUS.EXECUTED]: {
    label: 'Executed (Signed)',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    icon: ShieldCheck,
  },
  [DEAL_STATUS.FULFILLMENT]: {
    label: 'Fulfillment Active',
    color: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: PackageCheck,
  },
  [DEAL_STATUS.COMPLETED]: {
    label: 'Completed',
    color: 'bg-green-50 text-green-700 border-green-200 font-bold',
    icon: Award,
  },
  [DEAL_STATUS.DECLINED]: {
    label: 'Declined',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  [DEAL_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Ban,
  },
  [DEAL_STATUS.DISPUTED]: {
    label: 'Disputed',
    color: 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse',
    icon: AlertTriangle,
  },
  [DEAL_STATUS.EXPIRED]: {
    label: 'Expired',
    color: 'bg-stone-100 text-stone-600 border-stone-200',
    icon: Clock,
  },
};

export function DealStatusBadge({ status, size = 'md', className = '' }) {
  const conf = statusConfig[status] || {
    label: status || 'Unknown',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: FileText,
  };

  const Icon = conf.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium select-none shadow-2xs ${conf.color} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{conf.label}</span>
    </span>
  );
}

export default DealStatusBadge;
