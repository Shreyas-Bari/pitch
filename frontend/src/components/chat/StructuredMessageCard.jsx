import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Sparkles,
  ExternalLink,
  Package,
  FileText,
  File,
  Download,
  Mail,
  Phone,
  MessageCircle,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

export function StructuredMessageCard({ message, currentUserId }) {
  const [imgExpanded, setImgExpanded] = useState(false);

  if (!message) return null;
  const { type, text, metadata } = message;

  // 1. EVENT CARD
  if (type === 'EVENT_CARD' || message.eventId) {
    const event = typeof message.eventId === 'object' ? message.eventId : null;
    if (event) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-w-sm text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200">
              Campus Fest
            </span>
            <span className="text-xs text-surface-500 font-medium">{event.category || 'Event'}</span>
          </div>

          <h4 className="font-bold text-sm text-navy-950 mb-1">
            {event.title}
          </h4>

          <div className="space-y-1 text-xs text-surface-600 mb-3">
            {event.eventDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <span>{formatDate(event.eventDate)}</span>
              </div>
            )}
            {event.location?.city && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <span>{event.location.city} ({event.location.mode || 'PHYSICAL'})</span>
              </div>
            )}
          </div>

          <Link to={`/events/${event._id || event.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full text-xs" rightIcon={<ExternalLink className="w-3 h-3" />}>
              View Event Marketplace
            </Button>
          </Link>
        </div>
      );
    }
  }

  // 2. PACKAGE CARD
  if (type === 'PACKAGE_CARD' || message.packageId) {
    const pkg = typeof message.packageId === 'object' ? message.packageId : null;
    if (pkg) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-w-sm text-left">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              Sponsorship Package
            </span>
            <span className="text-xs font-bold text-primary-700">
              {pkg.cashRequirement?.amount ? formatCurrency(pkg.cashRequirement.amount) : 'In-Kind / Custom'}
            </span>
          </div>

          <h4 className="font-bold text-sm text-navy-950 mb-1">
            {pkg.title}
          </h4>

          {pkg.description && (
            <p className="text-xs text-surface-600 mb-2 line-clamp-2">
              {pkg.description}
            </p>
          )}

          {pkg.benefits && pkg.benefits.length > 0 && (
            <div className="space-y-1 mb-3 pt-2 border-t border-surface-100 text-xs text-surface-700">
              {pkg.benefits.slice(0, 2).map((b, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{typeof b === 'object' ? (b?.title || b?.description || 'Benefit') : b}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 rounded-lg bg-surface-50 border border-surface-200 text-[11px] text-surface-500 mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Proposal offer • Negotiate specifics in deal phase</span>
          </div>
        </div>
      );
    }
  }

  // 3. CONTACT CARD
  if (type === 'CONTACT' || message.contactShareId) {
    const contact = metadata?.contact || (typeof message.contactShareId === 'object' ? message.contactShareId?.contact : {}) || {};
    return (
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-sm max-w-sm text-left">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span className="font-bold text-xs text-navy-950">Direct Contact Shared</span>
          </div>
          <span className="text-[10px] font-semibold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-full">
            Mutual Interest
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-surface-700 mb-2">
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary-600 shrink-0" />
              <a href={`mailto:${contact.email}`} className="text-primary-700 hover:underline truncate">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <a href={`tel:${contact.phone}`} className="hover:underline">
                {contact.phone}
              </a>
            </div>
          )}
          {contact.whatsapp && (
            <div className="flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline"
              >
                WhatsApp: {contact.whatsapp}
              </a>
            </div>
          )}
        </div>

        <p className="text-[10px] text-surface-500 pt-2 border-t border-blue-100">
          Direct communication permitted after mutual interest.
        </p>
      </div>
    );
  }

  // 4. PROPOSAL / COUNTER_PROPOSAL (Stage 5 Deal Item)
  if (type === 'PROPOSAL' || type === 'COUNTER_PROPOSAL' || message.proposalId) {
    const isCounter = type === 'COUNTER_PROPOSAL';
    const dealId = message.dealId?._id || message.dealId?.id || (typeof message.dealId === 'string' ? message.dealId : null);
    return (
      <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-4 shadow-sm max-w-sm text-left">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-purple-700" />
            <span className="font-bold text-xs text-purple-950">
              {isCounter ? 'Counter-Proposal' : 'Sponsorship Proposal'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
            Negotiation Item
          </span>
        </div>

        <p className="text-xs text-surface-700 mb-2 leading-relaxed">
          {text || 'Formal sponsorship terms submitted.'}
        </p>

        {dealId && (
          <Link to={`/deals/${dealId}`}>
            <Button variant="outline" size="sm" className="w-full text-xs mt-1" rightIcon={<ExternalLink className="w-3 h-3" />}>
              Open Deal Workspace
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // 5. MOU CARD (Stage 5 Formal MoU)
  if (type === 'MOU_CARD' || message.mouId) {
    const mouId = message.mouId?._id || message.mouId?.id || (typeof message.mouId === 'string' ? message.mouId : null);
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 shadow-sm max-w-sm text-left">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-700" />
            <span className="font-bold text-xs text-indigo-950">Memorandum of Understanding</span>
          </div>
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
            Formal Closing
          </span>
        </div>

        <p className="text-xs text-surface-700 mb-2">
          {text || 'Digital MoU agreement reference generated for this partnership.'}
        </p>

        {mouId && (
          <Link to={`/mou/${mouId}`}>
            <Button variant="outline" size="sm" className="w-full text-xs mt-1" rightIcon={<ExternalLink className="w-3 h-3" />}>
              Review & Sign MoU
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // 6. IMAGE MESSAGE
  if (type === 'IMAGE' || (typeof message.fileId === 'object' && message.fileId?.mimeType?.startsWith('image/'))) {
    const file = typeof message.fileId === 'object' && message.fileId ? message.fileId : {};
    const imgUrl = file.url || metadata?.imageUrl;
    if (imgUrl) {
      return (
        <div className="space-y-1.5 max-w-sm text-left">
          <div
            onClick={() => setImgExpanded(!imgExpanded)}
            className="rounded-2xl overflow-hidden border border-slate-200 cursor-pointer bg-slate-100 max-h-64"
          >
            <img
              src={imgUrl}
              alt={file.originalName || 'Chat attachment'}
              loading="lazy"
              className="w-full h-auto object-cover max-h-64 hover:opacity-95 transition-opacity"
            />
          </div>
          {text && <p className="text-xs text-surface-700">{text}</p>}
        </div>
      );
    }
  }

  // 7. DOCUMENT MESSAGE
  if (type === 'DOCUMENT' || (typeof message.fileId === 'object' && message.fileId)) {
    const file = typeof message.fileId === 'object' && message.fileId ? message.fileId : {};
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm max-w-sm text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-100 text-surface-700 flex items-center justify-center shrink-0">
            <File className="w-5 h-5 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs text-navy-950 truncate">
              {file.originalName || file.name || 'Attached Document'}
            </h5>
            <p className="text-[11px] text-surface-500">
              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Document attachment'}
            </p>
          </div>
          {file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
        {text && <p className="text-xs text-surface-700 mt-2">{text}</p>}
      </div>
    );
  }

  return null;
}

export default StructuredMessageCard;
