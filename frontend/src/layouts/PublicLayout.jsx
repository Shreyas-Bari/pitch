import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../utils/permissions';
import { APP_NAME, APP_TAGLINE } from '../utils/constants';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Dropdown from '../components/ui/Dropdown';
import Drawer from '../components/ui/Drawer';
import {
  Menu,
  X,
  Compass,
  Building2,
  GraduationCap,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  Bell,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Explore Events', path: '/events', icon: <Compass className="w-4 h-4" /> },
    { label: 'Companies', path: '/companies', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Campus Committees', path: '/committees', icon: <GraduationCap className="w-4 h-4" /> },
    { label: 'How It Works', path: '/how-it-works', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'About', path: '/about', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-pitch-canvas text-pitch-text">
      {/* ================= Header ================= */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-pitch-navy text-white flex items-center justify-center font-display font-extrabold text-lg shadow-sm group-hover:bg-pitch-blue transition-colors">
              P
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-pitch-navy">
                {APP_NAME}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-pitch-surface-1 text-pitch-blue border border-pitch-surface-2">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-pitch-blue bg-blue-50/60 font-semibold'
                      : 'text-pitch-muted hover:text-pitch-text hover:bg-slate-100/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/messages"
                  title="Messages"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                <Link
                  to="/notifications"
                  title="Notifications"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                </Link>

                <Link to={getDashboardPath(user?.role)}>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<LayoutDashboard className="w-4 h-4" />}
                  >
                    Dashboard
                  </Button>
                </Link>

                {/* User Dropdown */}
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-slate-200 transition-all">
                      <Avatar
                        name={user?.name}
                        src={user?.avatar}
                        size="sm"
                        role={user?.role}
                      />
                    </div>
                  }
                  items={[
                    {
                      label: `${user?.name || 'User'} (${user?.role})`,
                      disabled: true,
                    },
                    { divider: true },
                    {
                      label: 'Go to Portal',
                      icon: <LayoutDashboard className="w-4 h-4" />,
                      onClick: () => navigate(getDashboardPath(user?.role)),
                    },
                    {
                      label: user?.role === 'COMPANY' ? 'Company Profile' : 'Committee Profile',
                      icon: <Building2 className="w-4 h-4" />,
                      onClick: () =>
                        navigate(
                          user?.role === 'COMPANY' ? '/company/profile' : '/committee/profile'
                        ),
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
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Join PITCH
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Navigation"
        position="right"
        size="sm"
      >
        <div className="flex flex-col gap-6">
          {isAuthenticated && (
            <div className="p-4 rounded-xl bg-pitch-surface-1 border border-pitch-surface-2 flex items-center gap-3">
              <Avatar name={user?.name} src={user?.avatar} size="md" role={user?.role} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-pitch-text truncate">{user?.name}</p>
                <p className="text-xs text-pitch-blue font-semibold">{user?.role}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-pitch-text hover:bg-slate-100 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath(user?.role)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="primary" size="md" className="w-full">
                    Go to Portal Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-pitch-error hover:bg-red-50"
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">
                    Join PITCH
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </Drawer>

      {/* ================= Main Content ================= */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ================= Public Footer ================= */}
      <footer className="border-t border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Platform Brand & Info */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pitch-navy text-white flex items-center justify-center font-display font-extrabold text-sm">
                  P
                </div>
                <span className="font-display font-extrabold text-lg text-pitch-navy">
                  {APP_NAME}
                </span>
              </div>
              <p className="text-xs text-pitch-muted leading-relaxed">
                {APP_TAGLINE}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Academic Demo Environment
                </span>
              </div>
            </div>

            {/* Column 2: Marketplace */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pitch-text">
                Marketplace
              </h4>
              <ul className="space-y-2 text-sm text-pitch-muted">
                <li>
                  <Link to="/events" className="hover:text-pitch-blue transition-colors">
                    Explore Events
                  </Link>
                </li>
                <li>
                  <Link to="/companies" className="hover:text-pitch-blue transition-colors">
                    Participating Brands
                  </Link>
                </li>
                <li>
                  <Link to="/committees" className="hover:text-pitch-blue transition-colors">
                    College Committees
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Rules */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pitch-text">
                Platform Rules
              </h4>
              <ul className="space-y-2 text-sm text-pitch-muted">
                <li>
                  <Link to="/how-it-works" className="hover:text-pitch-blue transition-colors">
                    How PITCH Works
                  </Link>
                </li>
                <li>
                  <span className="text-slate-400">MoU Closing (PITCH_MOU_V1)</span>
                </li>
                <li>
                  <span className="text-slate-400">Direct Sponsorship (No Escrow)</span>
                </li>
                <li>
                  <span className="text-slate-400">Post-Deal Fulfillment</span>
                </li>
              </ul>
            </div>

            {/* Column 4: About & Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pitch-text">
                Trust & Verification
              </h4>
              <ul className="space-y-2 text-sm text-pitch-muted">
                <li>
                  <Link to="/about" className="hover:text-pitch-blue transition-colors">
                    About PITCH
                  </Link>
                </li>
                <li>
                  <span className="text-slate-400">Academic Demo Signing</span>
                </li>
                <li>
                  <span className="text-slate-400">Self-Reported History Notice</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} PITCH Sponsorship Marketplace. Academic & Demo Project.</p>
            <p>Packages are proposals, not contracts. PITCH does not process payments.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
