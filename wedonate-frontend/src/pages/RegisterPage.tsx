import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const schema = z.object({
  firstName:       z.string().min(2, 'At least 2 characters'),
  lastName:        z.string().min(2, 'At least 2 characters'),
  email:           z.string().email('Valid email required'),
  phone:           z.string().optional(),
  password:        z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: '💝', title: 'Donate to Anyone',   desc: 'Support any approved request or campaign' },
  { icon: '🤲', title: 'Post a Request',     desc: 'Submit your own support request for approval' },
  { icon: '🏗️', title: 'Join Campaigns',    desc: 'Support community fundraising campaigns' },
  { icon: '📊', title: 'Track Your Impact', desc: 'See exactly where your support goes' },
];

/* Animated charity words floating across the hero */
const WORDS = ['Hope','Love','Give','Help','Care','Share','Together','Empower','Support','Change'];

function FloatingWord({ word, delay }: { word: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 80, x: Math.random() * 200 - 100 }}
      animate={{ opacity: [0, 0.4, 0.4, 0], y: -100, x: Math.random() * 200 - 100 }}
      transition={{ duration: 6, delay, repeat: Infinity, repeatDelay: Math.random() * 4 }}
      className="absolute bottom-0 text-white/30 font-bold text-lg pointer-events-none select-none"
      style={{ left: `${10 + Math.random() * 80}%` }}>
      {word}
    </motion.span>
  );
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(0); // animated step indicator

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success('Account created! Welcome to WeDonate 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className={cn('min-h-screen flex transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-white')}>

      {/* ── Animated Hero Side ─────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col">
        <img src="/Adama_city2.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/92 via-green-900/85 to-green-700/70" />

        {/* Floating words */}
        <div className="absolute inset-0 overflow-hidden">
          {WORDS.map((w, i) => <FloatingWord key={w} word={w} delay={i * 0.7} />)}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12 gap-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }} className="text-center">
            <img src="/adama_logo.png" alt="Logo"
              className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-2xl border-4 border-white/30 object-cover" />
            <h2 className="text-3xl font-extrabold text-white">Join WeDonate</h2>
            <p className="text-white/70 mt-2">One account. Endless ways to help.</p>
          </motion.div>

          {/* Feature list */}
          <div className="w-full max-w-xs space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3">
                <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-lg shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-white/60 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form Side ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }} className="w-full max-w-md">

          {/* Back to Home */}
          <Link to="/" className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors group',
            isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-700',
          )}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Logo (mobile) */}
          <Link to="/" className="flex items-center gap-3 mb-5 lg:hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-green-300 shadow">
              <img src="/adama_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={cn('font-extrabold text-xl', isDark ? 'text-green-400' : 'text-green-800')}>
              We<span className="text-amber-500">Donate</span>
            </span>
          </Link>

          <h1 className={cn('text-3xl font-extrabold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
            Create your account
          </h1>
          <p className={cn('mb-6 text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Free to join. Post requests, donate, and make a difference.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('auth.first_name')} placeholder="Abebe"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.firstName?.message} {...register('firstName')} />
              <Input label={t('auth.last_name')} placeholder="Kebede"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.lastName?.message} {...register('lastName')} />
            </div>

            <Input label={t('auth.email')} type="email" placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message} {...register('email')} />

            <Input label={t('auth.phone')} placeholder="+251 911 234 567"
              leftIcon={<Phone className="w-4 h-4" />} {...register('phone')} />

            <div className="relative">
              <Input label={t('auth.password')} type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className={cn('absolute right-3 top-9',
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input label="Confirm Password" type={showPw ? 'text' : 'password'} placeholder="Repeat password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
              Create Free Account
            </Button>
          </form>

          <p className={cn('text-center text-sm mt-5', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Already have an account?{' '}
            <Link to="/login" className="text-green-500 font-semibold hover:underline">
              {t('nav.login')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
