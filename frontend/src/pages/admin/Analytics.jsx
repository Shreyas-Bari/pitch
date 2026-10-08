import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import StatsCard from '../../components/admin/StatsCard';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, Calendar, Handshake, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#64748B'];

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [dealStats, setDealStats] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovRes, evRes, dlRes, usRes] = await Promise.all([
        adminService.getAnalyticsOverview().catch((err) => {
          console.error('Failed to get overview stats:', err);
          return { data: null };
        }),
        adminService.getAnalyticsEvents().catch((err) => {
          console.error('Failed to get event stats:', err);
          return { data: null };
        }),
        adminService.getAnalyticsDeals().catch((err) => {
          console.error('Failed to get deal stats:', err);
          return { data: null };
        }),
        adminService.getAnalyticsUsers().catch((err) => {
          console.error('Failed to get user stats:', err);
          return { data: null };
        }),
      ]);

      setOverview(ovRes?.data || ovRes || {});
      setEventStats(evRes?.data || evRes || {});
      setDealStats(dlRes?.data || dlRes || {});
      setUserStats(usRes?.data || usRes || {});
    } catch (err) {
      console.error('Failed to load system analytics:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load analytics telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <PageLoading message="Compiling platform analytics and telemetry..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load analytics"
        message={error}
        onRetry={fetchAnalytics}
      />
    );
  }

  // Format chart datasets
  const usersByRole = Object.entries(userStats?.byRole || {}).map(([role, count]) => ({
    name: role,
    count: Number(count) || 0,
  }));

  const eventsByStatus = Object.entries(eventStats?.byStatus || {}).map(([status, count]) => ({
    name: status,
    count: Number(count) || 0,
  }));

  const eventsByCategory = Object.entries(eventStats?.byCategory || {})
    .filter(([cat]) => cat !== 'UNCATEGORIZED')
    .slice(0, 6)
    .map(([cat, count]) => ({
      name: cat,
      count: Number(count) || 0,
    }));

  const dealsByStatus = Object.entries(dealStats?.dealsByStatus || {}).map(([status, count]) => ({
    name: status,
    count: Number(count) || 0,
  }));

  const fulfillmentsByStatus = Object.entries(dealStats?.fulfillmentsByStatus || {}).map(
    ([status, count]) => ({
      name: status,
      count: Number(count) || 0,
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          System Analytics & Telemetry
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform-wide distribution metrics calculated directly from authoritative database records.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={overview?.users?.total || 0}
          subtitle={`${overview?.users?.companies || 0} Brands • ${overview?.users?.committees || 0} Campus Committees`}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Cataloged Events"
          value={overview?.events?.total || 0}
          subtitle="All platform listings"
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Deals Closed"
          value={overview?.deals?.completed || 0}
          subtitle={`${overview?.deals?.completionRate || 0}% overall completion rate`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Fulfillments"
          value={overview?.fulfillment?.total || 0}
          subtitle="Obligation records logged"
          icon={Handshake}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Users by Account Role</h3>
              <p className="text-xs text-slate-500">Distribution between Brands, Committees, and Admins</p>
            </div>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-64 w-full">
            {usersByRole.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No user distribution data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersByRole} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deals by Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Deals by Lifecycle Status</h3>
              <p className="text-xs text-slate-500">Distribution across active state machine stages</p>
            </div>
            <Handshake className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            {dealsByStatus.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No active deals in system yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Events by Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Events by Publication Status</h3>
              <p className="text-xs text-slate-500">Listing moderation and execution breakdown</p>
            </div>
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>

          <div className="h-64 w-full">
            {eventsByStatus.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No event listings cataloged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fulfillment Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Fulfillment Obligations State</h3>
              <p className="text-xs text-slate-500">Status of agreed commercial deliverables</p>
            </div>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>

          <div className="h-64 w-full">
            {fulfillmentsByStatus.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No fulfillment records logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fulfillmentsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
