import React from 'react';
import { ArrowLeft, ExternalLink, Calendar, Share2, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export function ConversationHeader({
  conversation,
  userRole,
  isSocketConnected = true,
  typingUserName = null,
  onBack,
  onOpenContactModal,
}) {
  if (!conversation) return null;

  const isCompanyUser = userRole === 'COMPANY';
  const partner = isCompanyUser
    ? conversation.participantCommitteeId
    : conversation.participantCompanyId;

  const partnerName = partner?.name || (isCompanyUser ? 'College Committee' : 'Brand Sponsor');
  const partnerSub = isCompanyUser
    ? partner?.college || 'Campus Committee'
    : partner?.industry || 'Brand Sponsor';
  const partnerAvatar =
    partner?.logoFileId?.url || partner?.logo || partner?.logoUrl || null;
  const partnerRole = isCompanyUser ? 'COMMITTEE' : 'COMPANY';

  const partnerProfileLink = isCompanyUser
    ? partner?._id ? `/committees/${partner._id}` : null
    : partner?._id ? `/companies/${partner._id}` : null;

  const event = conversation.eventId;

  return (
    <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Back to conversations list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Partner Avatar */}
        <div className="relative shrink-0">
          <Avatar
            name={partnerName}
            src={partnerAvatar}
            size="md"
            role={partnerRole}
          />
        </div>

        {/* Partner Info & Event / Typing */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-display truncate">
              {partnerName}
            </h3>
            {partnerProfileLink && (
              <Link
                to={partnerProfileLink}
                target="_blank"
                rel="noopener noreferrer"
                title="View partner profile"
                className="text-slate-400 hover:text-primary-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
            {typingUserName ? (
              <span className="text-primary-600 font-semibold animate-pulse">
                {typingUserName} is typing...
              </span>
            ) : (
              <>
                <span className="truncate">{partnerSub}</span>
                {event?.title && (
                  <>
                    <span>•</span>
                    <Link
                      to={`/events/${event._id || event.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary-700 hover:underline font-medium truncate"
                    >
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.title}</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header Right Actions & Connection Status */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Real-time Status Pill */}
        <div
          title={isSocketConnected ? 'Real-time WebSocket active' : 'Connecting to real-time service...'}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isSocketConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{isSocketConnected ? 'Live' : 'Connecting'}</span>
        </div>

        {/* Share Contact Action */}
        {onOpenContactModal && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenContactModal}
            className="text-xs hidden xs:inline-flex"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            Contact
          </Button>
        )}
      </div>
    </div>
  );
}

export default ConversationHeader;
