import React from 'react';
import { AlertCircle } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

/**
 * SelfReportedBadge
 * Clearly distinguishes external unverified history from PITCH platform deals.
 * Strictly adheres to docs/PITCH_UI_SPEC_FINAL.md: "External history must say SELF-REPORTED
 * and cannot count toward PITCH reputation."
 */
export function SelfReportedBadge({ className = '' }) {
  return (
    <Tooltip content="External history self-reported by organizer. Not verified by PITCH platform records and does not count toward PITCH reputation score.">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 cursor-help ${className}`}
      >
        <AlertCircle className="w-3 h-3 text-amber-600" />
        SELF-REPORTED
      </span>
    </Tooltip>
  );
}

export default SelfReportedBadge;
