import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import UserTable from '../../components/admin/UserTable';
import Dialog from '../../components/ui/Dialog';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatDate';
import { ROLES, USER_STATUS } from '../../utils/constants';
import { Search, Filter, ShieldAlert, CheckCircle2, User, Building, GraduationCap } from 'lucide-react';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      };

      const res = await adminService.getUsers(params);
      const userList = res?.data?.users || res?.users || res?.data || [];
      setUsers(Array.isArray(userList) ? userList : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load users list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleViewUser = async (user) => {
    try {
      const res = await adminService.getUser(user._id || user.id);
      setSelectedUser(res?.data || res || user);
      setDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setSelectedUser(user);
      setDetailModalOpen(true);
    }
  };

  const handleOpenStatusModal = (user) => {
    setSelectedUser(user);
    setNewStatus(user.status || 'ACTIVE');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser || !newStatus) return;
    try {
      setActionLoading(true);
      await adminService.updateUserStatus(selectedUser._id || selectedUser.id, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      setStatusModalOpen(false);
      fetchUsers(pagination.page);
    } catch (err) {
      console.error('Failed to update user status:', err);
      toast.error(err?.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          User Account Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect, filter, and moderate registered brand sponsors, campus committees, and administrative accounts.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-pitch-blue focus:ring-1 focus:ring-pitch-blue"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-pitch-blue"
          >
            <option value="">All Roles</option>
            <option value={ROLES.COMPANY}>Company (Brand)</option>
            <option value={ROLES.COMMITTEE}>Committee (Campus)</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-pitch-blue"
          >
            <option value="">All Statuses</option>
            <option value={USER_STATUS.ACTIVE}>Active</option>
            <option value={USER_STATUS.SUSPENDED}>Suspended</option>
            <option value={USER_STATUS.PENDING}>Pending</option>
            <option value={USER_STATUS.DEACTIVATED}>Deactivated</option>
          </select>

          <Button type="button" variant="outline" size="sm" onClick={() => fetchUsers(1)}>
            Apply
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading message="Loading user directory..." />
      ) : error ? (
        <ErrorState title="Failed to load users" message={error} onRetry={() => fetchUsers(pagination.page)} />
      ) : (
        <UserTable
          users={users}
          onViewUser={handleViewUser}
          onChangeStatus={handleOpenStatusModal}
          pagination={pagination}
          onPageChange={(page) => fetchUsers(page)}
        />
      )}

      {/* View User Details Modal */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="User Account Details"
      >
        {selectedUser && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-base">{selectedUser.name || 'Unnamed'}</p>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <Badge variant={selectedUser.role === ROLES.ADMIN ? 'danger' : selectedUser.role === ROLES.COMPANY ? 'primary' : 'success'}>
                {selectedUser.role}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Account Status</span>
                <span className="font-semibold text-slate-800">{selectedUser.status || 'ACTIVE'}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Registered Date</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>

            {selectedUser.profile && (
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Attached Profile</span>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedUser.profile.companyName || selectedUser.profile.committeeName || 'Organization Profile'}
                </p>
                {selectedUser.profile.collegeName && (
                  <p className="text-xs text-slate-600 mt-0.5">{selectedUser.profile.collegeName}</p>
                )}
                {selectedUser.profile.bio && (
                  <p className="text-xs text-slate-500 mt-2 italic">{selectedUser.profile.bio}</p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Change Status Modal */}
      <Dialog
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Modify User Status"
      >
        {selectedUser && (
          <div className="space-y-4 text-sm text-slate-700">
            <p className="text-slate-600">
              Update account status for <strong className="text-slate-900">{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-pitch-blue"
              >
                <option value={USER_STATUS.ACTIVE}>ACTIVE (Full platform access)</option>
                <option value={USER_STATUS.SUSPENDED}>SUSPENDED (Temporarily locked out)</option>
                <option value={USER_STATUS.DEACTIVATED}>DEACTIVATED (Account deactivated)</option>
                <option value={USER_STATUS.PENDING}>PENDING (Verification pending)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <strong>Notice:</strong> Suspending or deactivating a user prevents them from logging in, accepting deals, or chatting until restored.
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateStatus} loading={actionLoading}>
                Save Status
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default AdminUsers;
