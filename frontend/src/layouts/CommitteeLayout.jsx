import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME } from '../utils/constants';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Dropdown from '../components/ui/Dropdown';
import Drawer from '../components/ui/Drawer';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Building2,
  Inbox,
  MailCheck,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Settings,
  LogOut,
  Bell,
  Menu,
  ExternalLink,
} from 'lucide-react';

export function CommitteeLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/committee/dashboard', icon: LayoutDashboard },
    { label: 'My Events', path: '/committee/events', icon: Calendar },
    { label: 'Create Event', path: '/committee/events/create', icon: PlusCircle },
    { label: 'Explore Companies', path: '/committee/companies', icon: Building2 },
    { label: 'Applications', path: '/committee/applications', icon: Inbox },
    { label: 'Invitations', path: '/committee/invitations', icon: MailCheck },
    { label: 'Messages', path: '/committee/conversations', icon: MessageSquare },
    { label: 'Deals & MoU', path: '/committee/deals', icon: Briefcase },
    { label: 'Committee Profile', path: '/committee/profile', icon: GraduationCap },
    { label: 'Settings', path: '/committee/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link to="/committee/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pitch-navy text-white flex items-center justify-center font-display font-extrabold text-base shadow-sm">
            P
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-pitch-navy">
              {APP_NAME}
            </span>
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Committee
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Committee Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100'
                    : 'text-pitch-muted hover:text-pitch-text hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile / Logout Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          <Avatar
            name={profile?.committeeName || user?.name}
            src={profile?.logo || user?.avatar}
            size="sm"
            role="COMMITTEE"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-pitch-text truncate">
              {profile?.committeeName || user?.name || 'Campus Committee'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {profile?.collegeName || user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 text-slate-400 hover:text-pitch-error hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-pitch-canvas">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Committee Menu"
        position="left"
        size="sm"
      >
        <div className="-m-6 h-full">{sidebarContent}</div>
      </Drawer>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Campus Committee Portal
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/committee/events/create">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                Create Event
              </Button>
            </Link>

            <Link
              to="/events"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-pitch-blue hover:bg-blue-50 transition-colors"
            >
              <span>Marketplace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/notifications"
              title="Notifications"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5" />
            </Link>

            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-slate-200 transition-all">
                  <Avatar
                    name={profile?.committeeName || user?.name}
                    src={profile?.logo || user?.avatar}
                    size="sm"
                    role="COMMITTEE"
                  />
                </div>
              }
              items={[
                {
                  label: profile?.committeeName || user?.name || 'Committee Account',
                  disabled: true,
                },
                { divider: true },
                {
                  label: 'View Profile',
                  icon: <GraduationCap className="w-4 h-4" />,
                  onClick: () => navigate('/committee/profile'),
                },
                {
                  label: 'Portal Settings',
                  icon: <Settings className="w-4 h-4" />,
                  onClick: () => navigate('/committee/settings'),
                },
                { divider: true },
                {
                  label: 'Sign Out',
                  icon: <LogOut className="w-4 h-4" />,
                  variant: 'danger',
                  onClick: handleLogout,
                },
              ]}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default CommitteeLayout;
