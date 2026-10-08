import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, PenTool } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

export function SignatureStatus({ signatories = [], mouStatus, versionNumber = 1 }) {
  const companySignatory = signatories.find((s) => s.role === 'COMPANY');
  const committeeSignatory = signatories.find((s) => s.role === 'COMMITTEE');

  const isFullyExecuted = mouStatus === 'EXECUTED' || (companySignatory?.signedAt && committeeSignatory?.signedAt);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-primary-600" />
          <span>Execution & Signature Status (MoU V{versionNumber})</span>
        </h4>
        {isFullyExecuted ? (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Fully Executed
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Execution
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Company Signatory */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            companySignatory?.signedAt
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-900">Brand Sponsor</span>
            {companySignatory?.signedAt ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Signed
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                Awaiting Signature
              </span>
            )}
          </div>
          {companySignatory?.signedAt ? (
            <div className="space-y-0.5 text-[11px] text-emerald-800">
              <p>
                <strong>Signer:</strong> {companySignatory.name} ({companySignatory.designation || 'Signatory'})
              </p>
              <p className="text-emerald-600">
                {formatDate(companySignatory.signedAt, { includeTime: true })}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Pending digital sign-off from authorized brand representative.
            </p>
          )}
        </div>

        {/* Committee Signatory */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            committeeSignatory?.signedAt
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-900">Organising Committee</span>
            {committeeSignatory?.signedAt ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Signed
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                Awaiting Signature
              </span>
            )}
          </div>
          {committeeSignatory?.signedAt ? (
            <div className="space-y-0.5 text-[11px] text-emerald-800">
              <p>
                <strong>Signer:</strong> {committeeSignatory.name} ({committeeSignatory.designation || 'Signatory'})
              </p>
              <p className="text-emerald-600">
                {formatDate(committeeSignatory.signedAt, { includeTime: true })}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Pending digital sign-off from authorized campus committee convenor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignatureStatus;
