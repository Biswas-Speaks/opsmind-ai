'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../src/stores/auth.store';
import { apiClient } from '../../src/lib/axios';
import { Cpu, AlertTriangle, User, Mail, KeyRound, Briefcase } from 'lucide-react';

const signupFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleName: z.enum(['Super Admin', 'IT Manager', 'IT Engineer', 'Employee', 'Auditor'], {
    errorMap: () => ({ message: 'Please select a valid organizational role' }),
  }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      roleName: 'Employee',
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      await apiClient.post('/auth/register', values);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Username or email might be taken.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-sm">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center space-x-2">
            <Cpu className="h-8 w-8 text-blue-500 animate-pulse" />
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              OpsMind AI
            </span>
          </Link>
          <h2 className="mt-6 text-xl font-bold tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign up to get access to IT operations resources
          </p>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400 text-center">
            Registration successful! Redirecting to login...
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-start space-x-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Signup Form */}
        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                  Username
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    placeholder="john_doe"
                    {...register('username')}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@opsmind.local"
                    {...register('email')}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="roleName" className="block text-sm font-medium text-slate-300">
                  Select Role
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <select
                    id="roleName"
                    {...register('roleName')}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition appearance-none"
                  >
                    <option value="Employee">Employee (Submit Tickets)</option>
                    <option value="IT Engineer">IT Engineer (Troubleshoot)</option>
                    <option value="IT Manager">IT Manager (Assign & Escalate)</option>
                    <option value="Super Admin">Super Admin (Full Access)</option>
                    <option value="Auditor">Auditor (Read-Only Logs)</option>
                  </select>
                </div>
                {errors.roleName && (
                  <p className="mt-1 text-xs text-red-400">{errors.roleName.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Creating Account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Login Redirect */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400 hover:underline">
            Sign In here
          </Link>
        </p>

      </div>
    </div>
  );
}
