import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../utils/permissions';
import PageLoading from '../components/ui/PageLoading';
import Button from '../components/ui/Button';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

/**
 * Role-Based Route Guard.
 * Checks whether authenticated user has one of the allowedRoles (COMPANY, COMMITTEE, ADMIN).
 * Note: The backend is always the final authorization authority.
 */
export function RoleRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading message="Verifying role permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role;
  const isAuthorized = Array.isArray(allowedRoles) && allowedRoles.includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-pitch-canvas">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-pitch-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center mb-5">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold text-pitch-text font-display mb-2">
            Access Restricted
          </h1>

          <p className="text-sm text-pitch-muted mb-6 leading-relaxed">
            Your account role (<span className="font-semibold text-pitch-text">{userRole}</span>) is
            not authorized to access this portal. This section requires:{' '}
            <span className="font-semibold text-pitch-blue">{allowedRoles.join(' or ')}</span>.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link to={getDashboardPath(userRole)}>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                leftIcon={<LayoutDashboard className="w-4 h-4" />}
              >
                Go to Your {userRole} Dashboard
              </Button>
            </Link>

            <Link to="/">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Return to Public Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}

export default RoleRoute;
