import React from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { ROLES, USER_STATUS } from '../../utils/constants';
import { Shield, Eye, Edit2 } from 'lucide-react';

export function UserTable({
  users = [],
  onViewUser,
  onChangeStatus,
  pagination = null,
  onPageChange,
}) {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case USER_STATUS.ACTIVE:
        return 'success';
      case USER_STATUS.SUSPENDED:
        return 'danger';
      case USER_STATUS.DEACTIVATED:
        return 'neutral';
      case USER_STATUS.PENDING:
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'danger';
      case ROLES.COMPANY:
        return 'primary';
      case ROLES.COMMITTEE:
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3.5 px-4 sm:px-6">User</th>
              <th scope="col" className="py-3.5 px-4">Role</th>
              <th scope="col" className="py-3.5 px-4">Account Status</th>
              <th scope="col" className="py-3.5 px-4">Joined Date</th>
              <th scope="col" className="py-3.5 px-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id || user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={user.name || user.email}
                        src={user.avatar}
                        size="sm"
                        role={user.role}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {user.name || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status || (user.isActive ? 'ACTIVE' : 'DEACTIVATED')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right pr-6 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewUser && onViewUser(user)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View user details"
                        aria-label="View user details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeStatus && onChangeStatus(user)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Modify account status"
                        aria-label="Modify account status"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTable;
