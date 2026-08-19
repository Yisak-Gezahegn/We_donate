import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Heart, Users, TrendingUp, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(6, 'At least 6 characters'),
});
type FormData = z.infer<typeof schema>;

/* ── Floating stat bubbles on hero side ── */
const BUBBLES = [
  { icon: Heart,      label: 'Lives Touched',   value: '3,500+', color: 'bg-green-500',  delay: 0 },
  { icon: Users,      label: 'Community Members',value: '1,200+', color: 'bg-blue-500',   delay: 0.4 },
  { icon: TrendingUp, label: 'ETB Raised',       value: '2.5M+',  color: 'bg-amber-500',  delay: 0.8 },
  { icon: Shield,     label: 'Verified Requests',value: '500+',   color: 'bg-purple-500', delay: 1.2 },
];

/* Slide images */
const HERO_IMGS = ['/Adama_city3.jpg','/Adama_city2.jpg','/Adama-City.jpg'];

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate   = useNavigate();
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [heroImg, setHeroImg] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className={cn('min-h-screen flex transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-white')}>

      {/* ── Animated Hero Side ─────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col">
        {/* Cycling background */}
        <AnimatePresence mode="wait">
          <motion.img key={heroImg}
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 1 }}
            src={HERO_IMGS[heroImg]} alt=""
            className="absolute inset-0 w-full h-full object-cover" />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 via-green-900/80 to-green-800/70" />

        {/* Animated content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12 gap-8">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }} className="text-center">
            <img src="/adama_logo.png" alt="Logo"
              className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-2xl border-4 border-white/30 object-cover" />
            <h2 className="text-3xl font-extrabold text-white">Empowering Adama</h2>
            <p className="text-white/70 mt-2 text-sm">Sign in to make a difference</p>
          </motion.div>

          {/* Animated stat bubbles */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {BUBBLES.map((b, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: b.delay + 0.3 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2', b.color)}>
                  <b.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-white font-bold text-sm">{b.value}</p>
                <p className="text-white/60 text-xs">{b.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Image dots */}
          <div className="flex gap-2">
            {HERO_IMGS.map((_, i) => (
              <button key={i} onClick={() => setHeroImg(i)}
                className={cn('rounded-full transition-all duration-300',
                  i === heroImg ? 'w-6 h-2 bg-amber-400' : 'w-2 h-2 bg-white/40 hover:bg-white/60')} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Form Side ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }} className="w-full max-w-md">

          {/* Back to Home */}
          <Link to="/" className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors group',
            isDark ? 'text-slate-400 hover:text-green-400' : 'text-gray-500 hover:text-green-700',
          )}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Logo (mobile) */}
          <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-green-300 shadow">
              <img src="/adama_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={cn('font-extrabold text-xl', isDark ? 'text-green-400' : 'text-green-800')}>
              We<span className="text-amber-500">Donate</span>
            </span>
          </Link>

          <h1 className={cn('text-3xl font-extrabold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
            {t('auth.login_title')}
          </h1>
          <p className={cn('mb-8 text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>
            {t('auth.login_subtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label={t('auth.email')} type="email" placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message} {...register('email')} />

            <div className="relative">
              <Input label={t('auth.password')} type={showPw ? 'text' : 'password'} placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className={cn('absolute right-3 top-9',
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-green-500 hover:underline">{t('auth.forgot_password')}</a>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              {t('auth.login_btn')}
            </Button>
          </form>

          <p className={cn('text-center text-sm mt-6', isDark ? 'text-slate-400' : 'text-gray-500')}>
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-green-500 font-semibold hover:underline">
              Create free account
            </Link>
          </p>


        </motion.div>
      </div>
    </div>
  );
}
