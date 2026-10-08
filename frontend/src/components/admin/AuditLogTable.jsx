import React from 'react';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { Activity, User, Shield } from 'lucide-react';

export function AuditLogTable({ logs = [], loading = false }) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading system audit trail...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        No recent administrative audit records found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 text-sm">
      {logs.map((log) => {
        const actorName = log.actorUserId?.name || log.actorUserId?.email || 'System / Platform';
        const actorRole = log.actorUserId?.role || 'SYSTEM';

        return (
          <div key={log._id || log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{log.action}</span>
                  <Badge variant="neutral">
                    {log.entityType || 'PLATFORM'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span className="font-medium text-slate-700">{actorName}</span>
                  <span>•</span>
                  <span>{actorRole}</span>
                  {log.entityId && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-400">ID: {String(log.entityId).slice(-8)}</span>
                    </>
                  )}
                  {log.ipAddress && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{log.ipAddress}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {formatDate(log.createdAt)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AuditLogTable;
