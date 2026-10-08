import React from 'react';
import { Calendar, Check, CheckCheck } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { formatDate } from '../../utils/formatDate';

export function ConversationItem({
  conversation,
  isActive = false,
  currentUserId,
  userRole,
  onClick,
}) {
  if (!conversation) return null;

  // Determine partner entity
  const isCompanyUser = userRole === 'COMPANY';
  const partner = isCompanyUser
    ? conversation.participantCommitteeId
    : conversation.participantCompanyId;

  const partnerName = partner?.name || (isCompanyUser ? 'College Committee' : 'Brand Sponsor');
  const partnerSub = isCompanyUser
    ? partner?.college || 'Campus Fest Committee'
    : partner?.industry || 'Brand Partner';
  const partnerAvatar =
    partner?.logoFileId?.url || partner?.logo || partner?.logoUrl || null;
  const partnerRole = isCompanyUser ? 'COMMITTEE' : 'COMPANY';

  const lastMsg = conversation.lastMessageId;
  const lastMsgSenderId =
    typeof lastMsg?.senderUserId === 'object'
      ? lastMsg?.senderUserId?._id || lastMsg?.senderUserId?.id
      : lastMsg?.senderUserId;
  const isSentByMe = lastMsgSenderId && String(lastMsgSenderId) === String(currentUserId);

  // Determine snippet
  let snippet = 'No messages yet';
  if (lastMsg) {
    if (lastMsg.text) {
      snippet = lastMsg.text;
    } else if (lastMsg.type === 'EVENT_CARD') {
      snippet = 'Shared an event';
    } else if (lastMsg.type === 'PACKAGE_CARD') {
      snippet = 'Shared a sponsorship package';
    } else if (lastMsg.type === 'CONTACT') {
      snippet = 'Shared direct contact info';
    } else if (lastMsg.type === 'PROPOSAL' || lastMsg.type === 'COUNTER_PROPOSAL') {
      snippet = 'Shared proposal details';
    } else if (lastMsg.type === 'MOU_CARD') {
      snippet = 'Shared digital MoU';
    } else if (lastMsg.type === 'IMAGE' || lastMsg.type === 'DOCUMENT') {
      snippet = 'Sent an attachment';
    } else if (lastMsg.type === 'SYSTEM') {
      snippet = lastMsg.text || 'System update';
    }
  }

  // Check unread state: message exists, not sent by me, and current user has not read it
  const isUnread =
    lastMsg &&
    !isSentByMe &&
    Array.isArray(lastMsg.readBy) &&
    !lastMsg.readBy.some((r) => {
      const rId = typeof r.userId === 'object' ? r.userId?._id : r.userId;
      return rId && String(rId) === String(currentUserId);
    });

  const timestamp = conversation.lastMessageAt || conversation.updatedAt;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 border-b border-slate-100 hover:bg-slate-50 focus:outline-none focus:bg-slate-50 ${
        isActive
          ? 'bg-blue-50/70 hover:bg-blue-50/80 border-l-4 border-l-primary-600'
          : 'border-l-4 border-l-transparent'
      }`}
    >
      <div className="relative shrink-0 mt-0.5">
        <Avatar
          name={partnerName}
          src={partnerAvatar}
          size="md"
          role={partnerRole}
        />
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-600 rounded-full ring-2 ring-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4
            className={`text-sm truncate font-display ${
              isUnread ? 'font-bold text-slate-950' : 'font-semibold text-slate-900'
            }`}
          >
            {partnerName}
          </h4>
          <span className="text-[11px] text-slate-400 shrink-0">
            {formatDate(timestamp, { format: 'relative' })}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 truncate mb-1">
          {partnerSub}
        </p>

        {/* Event context tag if available */}
        {conversation.eventId?.title && (
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 mb-1.5 max-w-full truncate">
            <Calendar className="w-2.5 h-2.5 shrink-0 text-slate-400" />
            <span className="truncate">{conversation.eventId.title}</span>
          </div>
        )}

        {/* Message preview snippet */}
        <div className="flex items-center gap-1.5 text-xs">
          {isSentByMe && (
            <span className="text-slate-400 shrink-0">
              <Check className="w-3 h-3 inline" />
            </span>
          )}
          <p
            className={`truncate ${
              isUnread ? 'font-semibold text-slate-900' : 'text-slate-500'
            }`}
          >
            {snippet}
          </p>
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
