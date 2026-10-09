import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  FileText,
  Mail,
  Briefcase,
  FileSignature,
  ShieldCheck,
  PackageCheck,
  Award,
  AlertTriangle,
  Check,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onCloseDropdown,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;
  const isCompany = userRole === 'COMPANY';

  if (!notification) return null;

  const isRead = !!notification.readAt;

  const getIconAndColor = () => {
    const type = notification.type;
    switch (type) {
      case 'NEW_MESSAGE':
        return {
          icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200',
        };
      case 'APPLICATION_RECEIVED':
      case 'APPLICATION_ACCEPTED':
      case 'APPLICATION_REJECTED':
        return {
          icon: <FileText className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200',
        };
      case 'INVITATION_RECEIVED':
      case 'INVITATION_ACCEPTED':
        return {
          icon: <Mail className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-200',
        };
      case 'NEW_PROPOSAL':
      case 'COUNTER_PROPOSAL':
      case 'PROPOSAL_ACCEPTED':
        return {
          icon: <Briefcase className="w-4 h-4 text-indigo-600" />,
          bg: 'bg-indigo-50 border-indigo-200',
        };
      case 'MOU_GENERATED':
      case 'MOU_SIGNED':
        return {
          icon: <FileSignature className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'DEAL_EXECUTED':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-teal-600" />,
          bg: 'bg-teal-50 border-teal-200',
        };
      case 'FULFILLMENT_UPDATE':
        return {
          icon: <PackageCheck className="w-4 h-4 text-sky-600" />,
          bg: 'bg-sky-50 border-sky-200',
        };
      case 'DEAL_COMPLETED':
      case 'NEW_REVIEW':
        return {
          icon: <Award className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'DISPUTE_CREATED':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-50 border-slate-200',
        };
    }
  };

  const handleClick = () => {
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
    if (onCloseDropdown) {
      onCloseDropdown();
    }

    const { entityType, entityId } = notification;

    if (entityType === 'CONVERSATION') {
      const basePath = isCompany ? '/company/conversations' : '/committee/conversations';
      navigate(entityId ? `${basePath}/${entityId}` : basePath);
    } else if (entityType === 'DEAL') {
      const basePath = isCompany ? '/company/deals' : '/committee/deals';
      navigate(entityId ? `${basePath}/${entityId}` : basePath);
    } else if (entityType === 'APPLICATION') {
      navigate(isCompany ? '/company/applications' : '/committee/applications');
    } else if (entityType === 'INVITATION') {
      navigate(isCompany ? '/company/invitations' : '/committee/invitations');
    } else if (entityType === 'MOU') {
      navigate(entityId ? `/mou/${entityId}` : (isCompany ? '/company/deals' : '/committee/deals'));
    } else if (entityType === 'FULFILLMENT') {
      navigate(isCompany ? '/company/deals' : '/committee/deals');
    } else if (entityType === 'REVIEW' || entityType === 'DISPUTE') {
      navigate(isCompany ? '/company/deals' : '/committee/deals');
    } else {
      navigate(isCompany ? '/company/dashboard' : '/committee/dashboard');
    }
  };

  const { icon, bg } = getIconAndColor();

  return (
    <div
      onClick={handleClick}
      className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
        isRead
          ? 'bg-white hover:bg-slate-50 border-slate-200/80'
          : 'bg-blue-50/40 hover:bg-blue-50/70 border-blue-200 shadow-2xs'
      }`}
    >
      {/* Icon */}
      <div className={`p-2 rounded-xl shrink-0 border mt-0.5 ${bg}`}>
        {icon}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4
            className={`text-xs sm:text-sm font-display truncate ${
              isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-950'
            }`}
          >
            {notification.title}
          </h4>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400">
              {formatDate(notification.createdAt, { format: 'relative' })}
            </span>
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {/* Hover / Action buttons */}
        <div className="flex items-center justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isRead && onMarkAsRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification._id);
              }}
              title="Mark as read"
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
              title="Delete notification"
              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
