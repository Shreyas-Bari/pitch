import React, { useState, useMemo } from 'react';
import { Bell, CheckCheck, Inbox, Filter } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from '../../components/notifications/NotificationItem';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export function Notifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD'

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'UNREAD') {
      return notifications.filter((n) => !n.readAt);
    }
    return notifications;
  }, [notifications, activeTab]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
              Notifications Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay updated on sponsorship applications, negotiation proposals, MoU signatures, and event delivery milestones.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            leftIcon={<CheckCheck className="w-4 h-4 text-blue-600" />}
            className="text-xs shrink-0"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Notifications</span>
            <span className="text-[11px] opacity-75">({notifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('UNREAD')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'UNREAD'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification List */}
      {isLoading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={36} height={36} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" width="50%" height={14} />
                  <Skeleton variant="text" width="80%" height={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-2.5">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title={activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
          description={
            activeTab === 'UNREAD'
              ? 'You have reviewed all current notifications. Switch to "All Notifications" to view your historical logs.'
              : 'You will receive notifications when colleges review applications, send proposals, or update agreement deliverables.'
          }
        />
      )}
    </div>
  );
}

export default Notifications;
