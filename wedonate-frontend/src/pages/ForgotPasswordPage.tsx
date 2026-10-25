import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { isDark } = useTheme();
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSentEmail(data.email);
      setSent(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
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
        {/* Card */}
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

          {!sent ? (
            <>
              <h1 className={cn('text-2xl font-extrabold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                Forgot your password?
              </h1>
              <p className={cn('text-sm mb-8', isDark ? 'text-slate-400' : 'text-gray-500')}>
                No worries. Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  Send Reset Link
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
                Check your inbox
              </h2>
              <p className={cn('text-sm mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>
                We sent a password reset link to:
              </p>
              <p className="text-green-600 font-semibold text-sm mb-6">{sentEmail}</p>
              <p className={cn('text-xs mb-8', isDark ? 'text-slate-500' : 'text-gray-400')}>
                The link expires in <strong>1 hour</strong>. 
                If you don't see the email, check your spam folder.
              </p>
              <button
                onClick={() => setSent(false)}
                className={cn('text-sm font-medium text-green-600 hover:underline')}
              >
                Didn't receive it? Send again
              </button>
            </motion.div>
          )}

          {/* Back to login */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
            <Link
              to="/login"
              className={cn('inline-flex items-center gap-1.5 text-sm font-medium transition-colors',
                isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-700')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
