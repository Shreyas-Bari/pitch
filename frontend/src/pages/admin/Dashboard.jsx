import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatsCard from '../../components/admin/StatsCard';
import AuditLogTable from '../../components/admin/AuditLogTable';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import {
  Users,
  Calendar,
  Handshake,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  Shield,
  Building,
  GraduationCap,
} from 'lucide-react';

export function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, logsRes] = await Promise.all([
        adminService.getAnalyticsOverview().catch((err) => {
          console.error('Failed to fetch analytics overview:', err);
          return { data: null };
        }),
        adminService.getAuditLogs({ limit: 6 }).catch((err) => {
          console.error('Failed to fetch audit logs:', err);
          return { data: { logs: [] } };
        }),
      ]);

      setOverview(overviewRes?.data || overviewRes || {});
      const logs = logsRes?.data?.logs || logsRes?.data || [];
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <PageLoading message="Loading platform admin metrics and audit logs..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Admin Dashboard Error"
        message={error}
        onRetry={fetchDashboardData}
      />
    );
  }

  const usersData = overview?.users || {};
  const eventsData = overview?.events || {};
  const dealsData = overview?.deals || {};
  const reportsData = overview?.reports || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            System Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform overview, moderation queues, and operational telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Open Reports: {reportsData.open || 0}</span>
          </Link>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Full Analytics</span>
          </Link>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={usersData.total || 0}
          subtitle={`${usersData.companies || 0} Brands • ${usersData.committees || 0} Colleges`}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Events in System"
          value={eventsData.total || 0}
          subtitle="Cataloged campus events"
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Platform Deals"
          value={dealsData.total || 0}
          subtitle={`${dealsData.completed || 0} completed (${dealsData.completionRate || 0}%)`}
          icon={Handshake}
          color="emerald"
        />
        <StatsCard
          title="Active Reports"
          value={reportsData.open || 0}
          subtitle={reportsData.open > 0 ? 'Requires moderation' : 'No open disputes'}
          icon={ShieldAlert}
          color={reportsData.open > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-pitch-blue hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-pitch-blue flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-pitch-blue transition-colors flex items-center justify-between">
            <span>Manage Users</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Inspect platform accounts, update status, and manage permissions.
          </p>
        </Link>

        <Link
          to="/admin/events"
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-purple-600 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center justify-between">
            <span>Event Moderation</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review event listings, verify details, and manage publication states.
          </p>
        </Link>

        <Link
          to="/admin/deals"
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-600 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Handshake className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
            <span>Deal Inspection</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Audit negotiations, agreements, MoUs, and fulfillment progress.
          </p>
        </Link>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-slate-900 text-base">
              Recent System Activity & Audit Trail
            </h2>
          </div>
          <span className="text-xs text-slate-400">Append-only log</span>
        </div>
        <AuditLogTable logs={auditLogs} />
      </div>
    </div>
  );
}

export default AdminDashboard;
