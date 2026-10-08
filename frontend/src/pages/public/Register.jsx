import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getDashboardPath } from '../../utils/permissions';
import { ROLES, APP_NAME } from '../../utils/constants';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardFooter } from '../../components/ui/Card';
import { Lock, Mail, User, Building2, GraduationCap, ArrowRight } from 'lucide-react';

const registerSchema = z
  .object({
    role: z.enum([ROLES.COMPANY, ROLES.COMMITTEE]),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    // Optional organization name
    organizationName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function Register() {
  const { register: registerAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: ROLES.COMPANY,
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      setServerError(null);

      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      };

      if (values.role === ROLES.COMPANY && values.organizationName) {
        payload.companyName = values.organizationName;
      } else if (values.role === ROLES.COMMITTEE && values.organizationName) {
        payload.committeeName = values.organizationName;
      }

      const res = await registerAuth(payload);
      toast.success(`Account created successfully! Welcome to PITCH.`);
      navigate(getDashboardPath(res.user.role), { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check the details provided.');
    } finally {
      setSubmitting(false);
    }
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
            Join PITCH Marketplace
          </h2>
          <p className="text-sm text-pitch-muted mt-1">
            Choose your account role to get started
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

            {/* Role Selection Buttons */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-pitch-muted mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', ROLES.COMPANY)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                    selectedRole === ROLES.COMPANY
                      ? 'border-pitch-blue bg-pitch-surface-1 text-pitch-blue shadow-sm ring-1 ring-pitch-blue'
                      : 'border-slate-200 hover:border-slate-300 text-pitch-muted'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-bold">Brand / Company</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', ROLES.COMMITTEE)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                    selectedRole === ROLES.COMMITTEE
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 text-pitch-muted'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-xs font-bold">Campus Committee</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name / Representative"
                type="text"
                placeholder="Jane Doe"
                required
                leftIcon={<User className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label={selectedRole === ROLES.COMPANY ? 'Company Name' : 'Committee Name'}
                type="text"
                placeholder={selectedRole === ROLES.COMPANY ? 'Red Bull India' : 'Mood Indigo Committee'}
                leftIcon={
                  selectedRole === ROLES.COMPANY ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )
                }
                error={errors.organizationName?.message}
                {...register('organizationName')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder={selectedRole === ROLES.COMMITTEE ? 'committee@college.ac.in' : 'name@company.com'}
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
                helperText="Must be at least 8 characters"
                {...register('password')}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
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
                  Create {selectedRole === ROLES.COMPANY ? 'Company' : 'Committee'} Account
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-xs text-slate-500">
            <span>Already have an account?</span>
            <Link to="/login" className="font-semibold text-pitch-blue hover:underline">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Register;
