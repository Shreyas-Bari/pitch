import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from '../utils/constants';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import CompanyLayout from '../layouts/CompanyLayout';
import CommitteeLayout from '../layouts/CommitteeLayout';
import AdminLayout from '../layouts/AdminLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Public Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Events from '../pages/public/Events';
import EventDetails from '../pages/public/EventDetails';
import Companies from '../pages/public/Companies';
import CompanyDetails from '../pages/public/CompanyDetails';
import Committees from '../pages/public/Committees';
import CommitteeDetails from '../pages/public/CommitteeDetails';
import HowItWorks from '../pages/public/HowItWorks';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import NotFound from '../pages/public/NotFound';
import Unauthorized from '../pages/public/Unauthorized';

// Company Pages
import CompanyDashboard from '../pages/company/Dashboard';
import CompanyEvents from '../pages/company/Events';
import CompanyEventDetails from '../pages/company/EventDetails';
import CompanySavedEvents from '../pages/company/SavedEvents';
import CompanyApplications from '../pages/company/Applications';
import CompanyInvitations from '../pages/company/Invitations';
import CompanyConversations from '../pages/company/Conversations';
import CompanyDeals from '../pages/company/Deals';
import CompanyDealDetails from '../pages/company/DealDetails';
import CompanyProfile from '../pages/company/Profile';
import CompanySettings from '../pages/company/Settings';

// Committee Pages
import CommitteeDashboard from '../pages/committee/Dashboard';
import CommitteeEvents from '../pages/committee/Events';
import CommitteeCreateEvent from '../pages/committee/CreateEvent';
import CommitteeEditEvent from '../pages/committee/EditEvent';
import CommitteeEventDetails from '../pages/committee/EventDetails';
import CommitteeCompanies from '../pages/committee/Companies';
import CommitteeApplications from '../pages/committee/Applications';
import CommitteeInvitations from '../pages/committee/Invitations';
import CommitteeConversations from '../pages/committee/Conversations';
import CommitteeDeals from '../pages/committee/Deals';
import CommitteeDealDetails from '../pages/committee/DealDetails';
import CommitteeProfile from '../pages/committee/Profile';
import CommitteeSettings from '../pages/committee/Settings';

// Shared Pages
import Messages from '../pages/messages/Messages';
import DealDetailsShared from '../pages/deals/DealDetails';
import MouDetails from '../pages/mou/MouDetails';
import Notifications from '../pages/notifications/Notifications';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminCompanies from '../pages/admin/Companies';
import AdminCommittees from '../pages/admin/Committees';
import AdminEvents from '../pages/admin/Events';
import AdminDeals from '../pages/admin/Deals';
import AdminReports from '../pages/admin/Reports';
import AdminAnalytics from '../pages/admin/Analytics';

export function AppRoutes() {
  return (
    <Routes>
      {/* ================= Public Routes ================= */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetails />} />
        <Route path="/committees" element={<Committees />} />
        <Route path="/committees/:id" element={<CommitteeDetails />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Shared Authenticated Routes inside Public Header Shell */}
        <Route element={<ProtectedRoute />}>
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
          <Route path="/deals/:id" element={<DealDetailsShared />} />
          <Route path="/mou/:id" element={<MouDetails />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ================= Company Portal Routes ================= */}
      <Route
        element={
          <RoleRoute allowedRoles={[ROLES.COMPANY]}>
            <CompanyLayout />
          </RoleRoute>
        }
      >
        <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
        <Route path="/company/events" element={<CompanyEvents />} />
        <Route path="/company/events/:id" element={<CompanyEventDetails />} />
        <Route path="/company/saved" element={<CompanySavedEvents />} />
        <Route path="/company/applications" element={<CompanyApplications />} />
        <Route path="/company/invitations" element={<CompanyInvitations />} />
        <Route path="/company/conversations" element={<CompanyConversations />} />
        <Route path="/company/conversations/:conversationId" element={<CompanyConversations />} />
        <Route path="/company/deals" element={<CompanyDeals />} />
        <Route path="/company/deals/:id" element={<CompanyDealDetails />} />
        <Route path="/company/profile" element={<CompanyProfile />} />
        <Route path="/company/settings" element={<CompanySettings />} />
      </Route>

      {/* ================= Committee Portal Routes ================= */}
      <Route
        element={
          <RoleRoute allowedRoles={[ROLES.COMMITTEE]}>
            <CommitteeLayout />
          </RoleRoute>
        }
      >
        <Route path="/committee" element={<Navigate to="/committee/dashboard" replace />} />
        <Route path="/committee/dashboard" element={<CommitteeDashboard />} />
        <Route path="/committee/events" element={<CommitteeEvents />} />
        <Route path="/committee/events/create" element={<CommitteeCreateEvent />} />
        <Route path="/committee/events/:id/edit" element={<CommitteeEditEvent />} />
        <Route path="/committee/events/:id" element={<CommitteeEventDetails />} />
        <Route path="/committee/companies" element={<CommitteeCompanies />} />
        <Route path="/committee/applications" element={<CommitteeApplications />} />
        <Route path="/committee/invitations" element={<CommitteeInvitations />} />
        <Route path="/committee/conversations" element={<CommitteeConversations />} />
        <Route path="/committee/conversations/:conversationId" element={<CommitteeConversations />} />
        <Route path="/committee/deals" element={<CommitteeDeals />} />
        <Route path="/committee/deals/:id" element={<CommitteeDealDetails />} />
        <Route path="/committee/profile" element={<CommitteeProfile />} />
        <Route path="/committee/settings" element={<CommitteeSettings />} />
      </Route>

      {/* ================= Admin Console Routes ================= */}
      <Route
        element={
          <RoleRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/companies" element={<AdminCompanies />} />
        <Route path="/admin/committees" element={<AdminCommittees />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/deals" element={<AdminDeals />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
