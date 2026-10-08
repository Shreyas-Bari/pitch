import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getDashboardPath } from '../../utils/permissions';
import { APP_NAME } from '../../utils/constants';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      setServerError(null);
      const res = await login(values);
      toast.success(`Welcome back, ${res.user.name}!`);

      const targetPath = from || getDashboardPath(res.user.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickDemo = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pitch-navy text-white flex items-center justify-center font-display font-extrabold text-xl shadow-sm">
              P
            </div>
            <span className="font-display font-extrabold text-2xl text-pitch-navy">
              {APP_NAME}
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-pitch-text font-display">
            Sign in to your account
          </h2>
          <p className="text-sm text-pitch-muted mt-1">
            Access your sponsorship opportunities, negotiations, and deals
          </p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-6 sm:p-8">
            {serverError && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-pitch-error font-medium leading-relaxed"
              >
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@organization.com"
                required
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={submitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </div>
            </form>

            {/* Quick Demo Credentials helper for Stage 1 QA */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Test Credentials (Academic Demo)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('sponsor@redbull.com', 'Password123!')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                >
                  <span className="font-semibold block text-pitch-text">Company</span>
                  <span className="text-[11px] text-slate-400">sponsor@redbull.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('fest@iitb.ac.in', 'Password123!')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                >
                  <span className="font-semibold block text-pitch-text">Committee</span>
                  <span className="text-[11px] text-slate-400">fest@iitb.ac.in</span>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-center text-xs text-slate-500">
            <span>Don't have an account?</span>
            <Link to="/register" className="font-semibold text-pitch-blue hover:underline">
              Create an account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Login;
