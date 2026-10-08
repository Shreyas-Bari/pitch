import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Home, Compass } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-4">
        <div className="text-7xl font-extrabold text-slate-200 font-display select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-pitch-text font-display">
          Page Not Found
        </h1>
        <p className="text-sm text-pitch-muted leading-relaxed">
          The page you are looking for doesn't exist or has been moved to a different address.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
              Return Home
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
              Explore Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
