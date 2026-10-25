import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { isDark } = useTheme();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const token           = searchParams.get('token');
  const email           = searchParams.get('email');

  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Invalid link guard
  if (!token || !email) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center px-4',
        isDark ? 'bg-slate-900' : 'bg-gray-50')}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className={cn('text-xl font-bold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
            Invalid Reset Link
          </h2>
          <p className={cn('text-sm mb-6', isDark ? 'text-slate-400' : 'text-gray-500')}>
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
          <Link to="/forgot-password"
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password: data.password,
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-300',
      isDark ? 'bg-slate-900' : 'bg-gray-50')}>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className={cn('rounded-2xl shadow-xl p-8 transition-colors duration-300',
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100')}>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-green-300 shadow">
              <img src="/adama_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={cn('font-extrabold text-xl', isDark ? 'text-green-400' : 'text-green-800')}>
              We<span className="text-amber-500">Donate</span>
            </span>
          </Link>

          {!success ? (
            <>
              <h1 className={cn('text-2xl font-extrabold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                Set new password
              </h1>
              <p className={cn('text-sm mb-8', isDark ? 'text-slate-400' : 'text-gray-500')}>
                Enter your new password below. Make sure it's at least 6 characters.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password */}
                <div className="relative">
                  <Input
                    label="New password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className={cn('absolute right-3 top-9',
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    label="Confirm new password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className={cn('absolute right-3 top-9',
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className={cn('text-xl font-bold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                Password reset!
              </h2>
              <p className={cn('text-sm mb-6', isDark ? 'text-slate-400' : 'text-gray-500')}>
                Your password has been changed successfully.
                You'll be redirected to the login page in a moment.
              </p>
              <Link to="/login"
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                Go to Login
              </Link>
            </motion.div>
          )}

          {!success && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
              <Link to="/forgot-password"
                className={cn('text-sm font-medium transition-colors',
                  isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-700')}>
                Request a new reset link
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
