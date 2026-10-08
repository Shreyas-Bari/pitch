import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-pitch-canvas text-pitch-text">
      <Outlet />
    </div>
  );
}

export default AuthenticatedLayout;
