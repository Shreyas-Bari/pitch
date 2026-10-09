import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, Filter, Compass, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConversationItem from './ConversationItem';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import Button from '../ui/Button';

export function ConversationList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  isLoading = false,
  error = null,
  onRetry = null,
  currentUserId,
  userRole,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNREAD'

  const isCompany = userRole === 'COMPANY';

  // Helper to check if a conversation has unread messages
  const checkIsUnread = (c) => {
    const lastMsg = c.lastMessageId;
    if (!lastMsg) return false;
    const lastMsgSenderId =
      typeof lastMsg.senderUserId === 'object'
        ? lastMsg.senderUserId?._id || lastMsg.senderUserId?.id
        : lastMsg.senderUserId;
    if (lastMsgSenderId && String(lastMsgSenderId) === String(currentUserId)) {
      return false;
    }
    if (Array.isArray(lastMsg.readBy)) {
      return !lastMsg.readBy.some((r) => {
        const rId = typeof r.userId === 'object' ? r.userId?._id : r.userId;
        return rId && String(rId) === String(currentUserId);
      });
    }
    return false;
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Unread filter
      if (filterMode === 'UNREAD' && !checkIsUnread(c)) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const partner = isCompany
        ? c.participantCommitteeId
        : c.participantCompanyId;

      const partnerName = partner?.name?.toLowerCase() || '';
      const partnerCollege = typeof partner?.college === 'object' ? partner?.college?.name : partner?.college;
      const partnerSub = (isCompany ? partnerCollege : partner?.industry)?.toLowerCase() || '';
      const eventTitle = c.eventId?.title?.toLowerCase() || '';
      const lastText = c.lastMessageId?.text?.toLowerCase() || '';

      return (
        partnerName.includes(q) ||
        partnerSub.includes(q) ||
        eventTitle.includes(q) ||
        lastText.includes(q)
      );
    });
  }, [conversations, searchQuery, filterMode, isCompany, currentUserId]);

  const unreadCount = useMemo(() => {
    return conversations.filter(checkIsUnread).length;
  }, [conversations, currentUserId]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Conversations
            </h2>
            {conversations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                {conversations.length}
              </span>
            )}
          </div>

          {/* Unread pill */}
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners or events..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('UNREAD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'UNREAD'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {error ? (
          <div className="p-6">
            <ErrorState
              type="api"
              title="Unable to load conversations"
              message={error}
              onRetry={onRetry}
            />
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" height={14} />
                  <Skeleton variant="text" width="85%" height={12} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((c) => (
            <ConversationItem
              key={c._id}
              conversation={c}
              isActive={c._id === activeConversationId}
              currentUserId={currentUserId}
              userRole={userRole}
              onClick={() => onSelectConversation(c._id)}
            />
          ))
        ) : searchQuery.trim() || filterMode === 'UNREAD' ? (
          <div className="p-8 text-center">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              No matching conversations
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Try adjusting your search query or switching to "All".
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterMode('ALL');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={MessageSquare}
              title="No active conversations yet"
              description="Direct communication threads are automatically established upon accepted applications, confirmed invitations, or mutual marketplace interest."
              action={
                isCompany ? (
                  <Link to="/company/events">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Compass className="w-4 h-4" />}
                    >
                      Discover Events
                    </Button>
                  </Link>
                ) : (
                  <Link to="/committee/companies">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Building2 className="w-4 h-4" />}
                    >
                      Explore Companies
                    </Button>
                  </Link>
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationList;
