import React from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  Calendar,
  Building,
  GraduationCap,
  Banknote,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export function MouViewer({ mouVersion, onDownloadPdf, isDownloading = false }) {
  if (!mouVersion) return null;

  const snapshot = mouVersion.agreementSnapshot || {};
  const parties = snapshot.parties || {};
  const committee = parties.committee || {};
  const company = parties.company || {};
  const event = snapshot.eventDetails || {};
  const contributions = snapshot.contributions || {};
  const organiserDeliverables = snapshot.organiserDeliverables || [];
  const sponsorDeliverables = snapshot.sponsorDeliverables || [];
  const legal = snapshot.legalSettings || {};
  const signatories = snapshot.signatories || [];

  const companySig = signatories.find((s) => s.role === 'COMPANY');
  const committeeSig = signatories.find((s) => s.role === 'COMMITTEE');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
      {/* Document Top Bar */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-950 font-mono tracking-wider">
              {mouVersion.templateIdentifier || 'PITCH_MOU_V1'}
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Version {mouVersion.versionNumber || 1}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-display tracking-tight text-white">
            Digital Memorandum of Understanding
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generated on {formatDate(mouVersion.generatedAt || mouVersion.createdAt, { includeTime: true })}
          </p>
        </div>

        {onDownloadPdf && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadPdf}
            isLoading={isDownloading}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800 self-start sm:self-auto shrink-0"
          >
            Download PDF
          </Button>
        )}
      </div>

      {/* SHA-256 Hash Verification Pill */}
      {mouVersion.documentHash && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 px-5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Lock className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span className="font-semibold text-slate-800">Authoritative Document Hash (SHA-256):</span>
            <code className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-700 select-all break-all">
              {mouVersion.documentHash}
            </code>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Cryptographically Sealed</span>
        </div>
      )}

      {/* Main Document Body */}
      <div className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto text-sm leading-relaxed text-slate-800">
        {/* Title */}
        <div className="text-center pb-6 border-b border-slate-200">
          <h1 className="text-xl sm:text-2xl font-black font-display text-slate-950 uppercase tracking-tight">
            Memorandum of Understanding
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
            For Campus Event Sponsorship & Engagement
          </p>
        </div>

        {/* 1. Parties */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 font-display">
            1. Contracting Parties
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Committee */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>The Organiser</span>
              </div>
              <p><strong>Organisation:</strong> {committee.organisationName || committee.name || 'Campus Committee'}</p>
              {committee.institutionAddress && <p><strong>Address:</strong> {committee.institutionAddress}</p>}
              {committee.representative?.name && (
                <p><strong>Representative:</strong> {committee.representative.name} ({committee.representative.designation || 'Convenor'})</p>
              )}
              {committee.representative?.email && <p><strong>Email:</strong> {committee.representative.email}</p>}
            </div>

            {/* Company */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <Building className="w-4 h-4 text-blue-600" />
                <span>The Sponsor</span>
              </div>
              <p><strong>Company:</strong> {company.companyName || company.name || 'Brand Sponsor'}</p>
              {company.registeredAddress && <p><strong>Registered Address:</strong> {company.registeredAddress}</p>}
              {company.representative?.name && (
                <p><strong>Representative:</strong> {company.representative.name} ({company.representative.designation || 'Signatory'})</p>
              )}
              {company.representative?.email && <p><strong>Email:</strong> {company.representative.email}</p>}
            </div>
          </div>
        </section>

        {/* 2. Event Purpose & Recitals */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 font-display">
            2. Event Purpose & Recitals
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Whereas the Organiser is conducting <strong>"{event.title || 'the Event'}"</strong> scheduled on{' '}
            <strong>{event.eventDate ? formatDate(event.eventDate) : 'the agreed dates'}</strong> at{' '}
            <strong>{event.venue || 'the campus premises'}</strong>, and the Sponsor desires to sponsor the Event under the terms and deliverables mutually agreed herein.
          </p>
        </section>

        {/* 3. Deliverables & Commercial Terms */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 font-display">
            3. Sponsorship Deliverables & Contributions
          </h3>

          {/* Cash & In-Kind Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            {contributions.cash?.amount > 0 && (
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">Financial Consideration (Cash):</span>
                <span className="text-emerald-700 font-display text-sm">
                  {formatCurrency(contributions.cash.amount)}
                </span>
              </div>
            )}

            {Array.isArray(contributions.nonCash) && contributions.nonCash.length > 0 && (
              <div>
                <p className="font-bold text-slate-700 mb-1.5">In-Kind Deliverables:</p>
                <div className="space-y-1">
                  {contributions.nonCash.map((nc, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-600 pl-2">
                      <span>• {nc.name || nc.type} ({nc.quantity} {nc.unit})</span>
                      {nc.estimatedValue > 0 && <span>Est. {formatCurrency(nc.estimatedValue)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Organiser Deliverables */}
          {organiserDeliverables.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-slate-800">Organiser Deliverables to Sponsor:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {organiserDeliverables.map((del, i) => (
                  <li key={i}>{typeof del === 'string' ? del : del.description}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sponsor Deliverables */}
          {sponsorDeliverables.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-slate-800">Sponsor Deliverables to Organiser:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {sponsorDeliverables.map((del, i) => (
                  <li key={i}>{typeof del === 'string' ? del : del.description}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 4. Legal & Operational Terms */}
        <section className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 font-display">
            4. Operational & Legal Clauses
          </h3>
          <div className="space-y-2">
            <p>
              <strong>Intellectual Property:</strong> Each party retains sole ownership of its respective trademarks and logos. Sponsor grants Organiser a limited, non-exclusive license to use its logo solely for marketing materials of the specified Event.
            </p>
            <p>
              <strong>Termination & Cure:</strong> Either party may terminate in the event of material breach, provided a written notice and cure period of {legal.curePeriodDays || 15} days is granted.
            </p>
            <p>
              <strong>Jurisdiction:</strong> This Memorandum shall be governed by the laws of India and subject to the exclusive jurisdiction of the courts in {legal.jurisdiction || 'Mumbai, India'}.
            </p>
          </div>
        </section>

        {/* 5. Signatures Block */}
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
            5. Execution & Signatures
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Organiser Signatory */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <p className="text-xs font-bold text-slate-900 uppercase">For The Organiser</p>
              {committeeSig?.signedAt ? (
                <div className="pt-2 space-y-1 text-xs">
                  <p className="font-serif italic text-base text-slate-900 border-b border-slate-300 pb-1">
                    {committeeSig.signatureData || committeeSig.name}
                  </p>
                  <p className="font-semibold text-slate-900">{committeeSig.name}</p>
                  <p className="text-slate-500">{committeeSig.designation}</p>
                  <p className="text-[10px] text-emerald-700 font-mono">
                    Digitally signed on {formatDate(committeeSig.signedAt, { includeTime: true })}
                  </p>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                  Awaiting Digital Signature
                </div>
              )}
            </div>

            {/* Sponsor Signatory */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <p className="text-xs font-bold text-slate-900 uppercase">For The Sponsor</p>
              {companySig?.signedAt ? (
                <div className="pt-2 space-y-1 text-xs">
                  <p className="font-serif italic text-base text-slate-900 border-b border-slate-300 pb-1">
                    {companySig.signatureData || companySig.name}
                  </p>
                  <p className="font-semibold text-slate-900">{companySig.name}</p>
                  <p className="text-slate-500">{companySig.designation}</p>
                  <p className="text-[10px] text-emerald-700 font-mono">
                    Digitally signed on {formatDate(companySig.signedAt, { includeTime: true })}
                  </p>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                  Awaiting Digital Signature
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MouViewer;
