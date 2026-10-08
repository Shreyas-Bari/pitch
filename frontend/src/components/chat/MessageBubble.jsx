import React from 'react';
import { Check, CheckCheck, Info } from 'lucide-react';
import StructuredMessageCard from './StructuredMessageCard';
import Avatar from '../ui/Avatar';

export function MessageBubble({ message, currentUserId }) {
  if (!message) return null;

  const senderId =
    typeof message.senderUserId === 'object'
      ? message.senderUserId?._id || message.senderUserId?.id
      : message.senderUserId;

  const isCurrentUser = String(senderId) === String(currentUserId);
  const senderName =
    typeof message.senderUserId === 'object'
      ? message.senderUserId?.name
      : isCurrentUser
      ? 'You'
      : 'Partner';

  const type = message.type || 'TEXT';

  // System Messages
  if (type === 'SYSTEM') {
    return (
      <div className="flex justify-center my-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium max-w-md text-center">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{message.text}</span>
        </div>
      </div>
    );
  }

  // Format time (e.g. 10:45 AM)
  const formatTime = (isoDate) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return '';
    }
  };

  // Check if partner has read this message
  const isReadByPartner =
    Array.isArray(message.readBy) &&
    message.readBy.some((r) => {
      const rId = typeof r.userId === 'object' ? r.userId?._id : r.userId;
      return rId && String(rId) !== String(currentUserId);
    });

  const hasStructuredCard =
    type !== 'TEXT' ||
    message.eventId ||
    message.packageId ||
    message.contactShareId ||
    message.proposalId ||
    message.dealId ||
    message.mouId ||
    message.fileId;

  return (
    <div
      className={`flex items-end gap-2.5 my-2.5 group ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Partner Avatar for incoming messages */}
      {!isCurrentUser && (
        <Avatar
          name={senderName}
          size="sm"
          className="shrink-0 mb-1 ring-1 ring-slate-200"
        />
      )}

      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[62%] ${
          isCurrentUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name for incoming */}
        {!isCurrentUser && (
          <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
            {senderName}
          </span>
        )}

        {/* Message Container / Bubble */}
        <div
          className={`relative p-3.5 text-sm transition-shadow ${
            isCurrentUser
              ? 'bg-slate-900 text-white rounded-2xl rounded-br-sm shadow-sm'
              : 'bg-white text-slate-900 border border-slate-200/90 rounded-2xl rounded-bl-sm shadow-xs'
          } ${hasStructuredCard ? 'p-2.5 sm:p-3' : ''}`}
        >
          {/* Structured Card if present */}
          {hasStructuredCard && (
            <div className="mb-2">
              <StructuredMessageCard message={message} currentUserId={currentUserId} />
            </div>
          )}

          {/* Plain Text if present and not already displayed inside structured card */}
          {type === 'TEXT' && message.text && (
            <p className="whitespace-pre-wrap break-words leading-relaxed font-normal text-sm">
              {message.text}
            </p>
          )}

          {/* Fallback text if type is something else but card didn't consume it */}
          {type !== 'TEXT' && !hasStructuredCard && message.text && (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
              {message.text}
            </p>
          )}

          {/* Footer Metadata: Timestamp & Read Status */}
          <div
            className={`flex items-center justify-end gap-1.5 mt-1.5 select-none text-[10px] ${
              isCurrentUser ? 'text-slate-300/80' : 'text-slate-400'
            }`}
          >
            <span>{formatTime(message.createdAt)}</span>
            {isCurrentUser && (
              <span title={isReadByPartner ? 'Read by partner' : 'Sent'}>
                {isReadByPartner ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
