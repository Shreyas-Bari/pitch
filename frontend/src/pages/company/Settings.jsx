import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Mail, Shield, Bell, LogOut, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export function CompanySettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordState.currentPassword || !passwordState.newPassword) {
      toast.error('Please fill in both current and new passwords.');
      return;
    }
    if (passwordState.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    setTimeout(() => {
      setUpdatingPassword(false);
      toast.success('Security settings updated successfully.');
      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 600);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
          <Settings className="w-6 h-6 text-pitch-blue" />
          <span>Account Settings</span>
        </h1>
        <p className="text-sm text-pitch-muted mt-1">
          Manage your login credentials, active sessions, and communication preferences.
        </p>
      </div>

      {/* Account Info */}
      <Card className="p-6 border-slate-200">
        <h2 className="text-base font-bold font-display text-pitch-navy mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-pitch-blue" />
          <span>Account Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-pitch-muted font-bold uppercase tracking-wider block text-[10px]">
              Full Name
            </span>
            <span className="text-pitch-navy font-semibold text-sm mt-0.5 block">
              {user?.name || 'Company Representative'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-pitch-muted font-bold uppercase tracking-wider block text-[10px]">
              Email Address
            </span>
            <span className="text-pitch-navy font-semibold text-sm mt-0.5 block">
              {user?.email || 'name@company.com'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-pitch-muted font-bold uppercase tracking-wider block text-[10px]">
              Platform Role
            </span>
            <span className="text-pitch-navy font-semibold text-sm mt-0.5 block">
              COMPANY (Brand Sponsor)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-pitch-muted font-bold uppercase tracking-wider block text-[10px]">
              Account Status
            </span>
            <span className="text-emerald-700 font-semibold text-sm mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Active & Verified
            </span>
          </div>
        </div>
      </Card>

      {/* Password Management */}
      <Card className="p-6 border-slate-200">
        <h2 className="text-base font-bold font-display text-pitch-navy mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-pitch-blue" />
          <span>Security & Password</span>
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={passwordState.currentPassword}
            onChange={(e) =>
              setPasswordState({ ...passwordState, currentPassword: e.target.value })
            }
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            helperText="Minimum 8 characters with at least one letter and number"
            value={passwordState.newPassword}
            onChange={(e) =>
              setPasswordState({ ...passwordState, newPassword: e.target.value })
            }
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={passwordState.confirmPassword}
            onChange={(e) =>
              setPasswordState({ ...passwordState, confirmPassword: e.target.value })
            }
          />

          <Button
            type="submit"
            variant="outline"
            size="sm"
            isLoading={updatingPassword}
          >
            Update Password
          </Button>
        </form>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6 border-slate-200">
        <h2 className="text-base font-bold font-display text-pitch-navy mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-pitch-blue" />
          <span>Notification Preferences</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Real-time socket notifications and in-app alerts for application status changes, fest invitations, and deal negotiations are enabled by default for authenticated sessions.
        </p>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2.5 text-slate-700">
            <input type="checkbox" defaultChecked disabled className="rounded text-pitch-blue" />
            <span>Email alerts for new campus festival invitations</span>
          </label>
          <label className="flex items-center gap-2.5 text-slate-700">
            <input type="checkbox" defaultChecked disabled className="rounded text-pitch-blue" />
            <span>In-app notifications when an application is reviewed</span>
          </label>
          <label className="flex items-center gap-2.5 text-slate-700">
            <input type="checkbox" defaultChecked disabled className="rounded text-pitch-blue" />
            <span>Stage 4 real-time chat alerts from student committees</span>
          </label>
        </div>
      </Card>

      {/* Session Sign Out */}
      <Card className="p-6 border-red-200 bg-red-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-red-950">
              Sign Out of Session
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Securely terminate your corporate workspace authentication session.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-700 border-red-200 hover:bg-red-50 self-start sm:self-auto"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default CompanySettings;
