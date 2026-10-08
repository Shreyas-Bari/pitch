import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/permissions';
import Button from '../../components/ui/Button';
import { ShieldAlert, Home, LayoutDashboard } from 'lucide-react';

export function Unauthorized() {
  const { user } = useAuth();
  const userRole = user?.role;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-pitch-text font-display">
          Unauthorized Access
        </h1>
        <p className="text-sm text-pitch-muted leading-relaxed">
          You do not have the required permissions to access this portal or resource.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {userRole && (
            <Link to={getDashboardPath(userRole)}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<LayoutDashboard className="w-4 h-4" />}
              >
                Go to {userRole} Dashboard
              </Button>
            </Link>
          )}
          <Link to="/">
            <Button variant="outline" size="sm" leftIcon={<Home className="w-4 h-4" />}>
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
