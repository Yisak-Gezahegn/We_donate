import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Heart, Users, TrendingUp, Shield, ArrowRight,
  Star, Quote, ChevronLeft, ChevronRight, Target, Clock, Share2,
} from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

/* ── Hero images (fallback — replaced by API data) ─────────── */
const FALLBACK_HERO_IMAGES = [
  { src: '/Adama-City.jpg',   caption: 'Adama City — Heart of Oromia' },
  { src: '/Adama_city2.jpg',  caption: 'Building a Stronger Community' },
  { src: '/Adama_city3.jpg',  caption: 'Together We Make a Difference' },
  { src: '/Adama_City1.jfif', caption: 'Support · Connect · Donate' },
  { src: '/Adama_city.jfif',  caption: 'Empowering Adama Families' },
];

const SLIDE_DURATION = 5000; // ms per slide

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function HomePage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  /* ── Slideshow state ───────────────────────────────────────── */
  const [slide, setSlide]     = useState(0);
  const [paused, setPaused]   = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setSlide(prev => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [paused]);

  const goTo = (idx: number) => {
    setDirection(idx > slide ? 1 : -1);
    setSlide(idx);
  };
  const prev = () => { setDirection(-1); setSlide(s => (s - 1 + HERO_IMAGES.length) % HERO_IMAGES.length); };
  const next = () => { setDirection(1);  setSlide(s => (s + 1) % HERO_IMAGES.length); };

  /* ── Data ──────────────────────────────────────────────────── */
  const { data: statsData } = useQuery({
    queryKey: ['donation-stats'],
    queryFn: () => api.get('/donations/stats').then(r => r.data.data),
  });

  const { data: apiHeroImages } = useQuery({
    queryKey: ['hero-images'],
    queryFn: () => api.get('/hero-images').then(r => r.data.data),
  });

  const { data: apiTestimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => api.get('/testimonials').then(r => r.data.data),
  });

  // Fetch 3 approved requests for home page
  const { data: featuredRequests } = useQuery({
    queryKey: ['featured-requests'],
    queryFn: () => api.get('/support-requests', { params: { limit: 3 } }).then(r => r.data.data),
  });

  const HERO_IMAGES = apiHeroImages?.length
    ? apiHeroImages.map((img: any) => ({ src: img.imageUrl, caption: img.caption }))
    : FALLBACK_HERO_IMAGES;

  const stats = [
    { label: t('hero.stats_donors'),        value: statsData?.totalUsers ?? '1,200+',           icon: Users,    color: 'text-blue-500',   bg: 'bg-blue-50   dark:bg-blue-900/30' },
    { label: t('hero.stats_beneficiaries'), value: statsData?.fulfilledRequests ?? '500+',       icon: Heart,    color: 'text-green-500',  bg: 'bg-green-50  dark:bg-green-900/30' },
    { label: t('hero.stats_raised'),        value: statsData?.totalAmount ? formatCurrency(statsData.totalAmount) : 'ETB 2.5M+', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: t('hero.stats_ngos'),          value: statsData?.totalDonations ?? '5,000+',        icon: Shield,   color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  ];

  const steps = [
    { icon: '📝', title: t('home.step1_title'), desc: t('home.step1_desc') },
    { icon: '🤝', title: t('home.step2_title'), desc: t('home.step2_desc') },
    { icon: '💳', title: t('home.step3_title'), desc: t('home.step3_desc') },
    { icon: '📊', title: t('home.step4_title'), desc: t('home.step4_desc') },
  ];

  const categories = [
    { icon: '💰', key: 'category_money',    color: 'from-green-400  to-green-600' },
    { icon: '🍞', key: 'category_food',     color: 'from-amber-400  to-amber-600' },
    { icon: '👕', key: 'category_clothes',  color: 'from-blue-400   to-blue-600' },
    { icon: '💊', key: 'category_medicine', color: 'from-red-400    to-red-600' },
    { icon: '🤲', key: 'category_other',    color: 'from-purple-400 to-purple-600' },
  ];

  const testimonials = apiTestimonials?.length
    ? apiTestimonials.map((t: any) => ({
        name: t.name,
        role: t.role,
        text: t.text,
        avatar: t.avatar || t.name.split(' ').map((n: string) => n[0]).join(''),
      }))
    : [
        { name: 'Liya Tadesse',   role: 'Donor',       text: 'WeDonate made it incredibly easy to help families in Adama. I can see exactly where my money goes.', avatar: 'LT' },
        { name: 'Gemechu Alemu',  role: 'Beneficiary', text: 'Through this platform my family received food support during a very difficult time. We are grateful.', avatar: 'GA' },
        { name: 'Amina Ibrahim',  role: 'NGO Partner', text: 'Coordination between our NGO and city admin has never been more streamlined. Outstanding platform.',   avatar: 'AI' },
      ];

  const slideVariants = {
    enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  /* ── dark-aware section classes ───────────────────────────── */
  const sectionLight = cn('py-20 transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-white');
  const sectionMuted = cn('py-20 transition-colors duration-300', isDark ? 'bg-slate-800' : 'bg-gray-50');
  const h2Class      = cn('text-4xl font-extrabold mb-4', isDark ? 'text-white' : 'text-gray-900');
  const subClass     = cn('text-lg max-w-2xl mx-auto', isDark ? 'text-slate-400' : 'text-gray-500');

  return (
    <div className="overflow-x-hidden">

      {/* ════════════════════════════════════════════════
          HERO — dynamic slideshow
      ════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slides */}
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={slide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={HERO_IMAGES[slide].src}
              alt={HERO_IMAGES[slide].caption}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlay (always dark-green regardless of theme) */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-green-900/75 to-green-800/50 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />

        {/* Animated blur circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse z-10" />
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-green-300/10 rounded-full blur-3xl animate-pulse delay-1000 z-10" />

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — text */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <img src="/adama_logo.png" alt="" className="w-5 h-5 rounded-full object-cover" />
                <span className="text-white/90 text-sm font-medium">Adama City Administration</span>
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                {t('hero.title')}{' '}
                <span className="text-amber-400 block mt-1">{t('hero.titleHighlight')}</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-xl">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/donate">
                  <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    {t('hero.cta_donate')}
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline"
                    className="border-white/60 text-white hover:bg-white/10 hover:text-white hover:border-white">
                    {t('hero.cta_learn')}
                  </Button>
                </Link>
              </div>

              {/* Slide caption */}
              <p className="mt-8 text-white/50 text-sm italic">
                {HERO_IMAGES[slide].caption}
              </p>
            </motion.div>

            {/* Right — stats glass cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}>
                  <div className="glass rounded-2xl p-5 text-center hover:scale-105 transition-transform cursor-default">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', s.bg)}>
                      <s.icon className={cn('w-6 h-6', s.color)} />
                    </div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-white/70 mt-1">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── Slideshow controls ─────────────────────── */}
        {/* Prev / Next arrows */}
        <button onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {HERO_IMAGES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === slide ? 'w-6 h-2.5 bg-amber-400' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 animate-bounce">
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          IMPACT STATS
      ════════════════════════════════════════════════ */}
      <section className={sectionLight}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-14">
            <h2 className={h2Class}>{t('home.impact_title')}</h2>
            <p className={subClass}>{t('home.impact_subtitle')}</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card hover className="text-center p-8">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', s.bg)}>
                    <s.icon className={cn('w-7 h-7', s.color)} />
                  </div>
                  <p className={cn('text-3xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{s.value}</p>
                  <p className={cn('text-sm mt-1 font-medium', isDark ? 'text-slate-400' : 'text-gray-500')}>{s.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <section className={sectionMuted}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} className="text-center mb-14">
            <h2 className={h2Class}>{t('home.how_title')}</h2>
            <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-gray-500')}>{t('home.how_subtitle')}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="relative">
                  {i < steps.length - 1 && (
                    <div className={cn('hidden lg:block absolute top-10 left-full w-full h-0.5 z-0 -translate-y-1/2',
                      isDark ? 'bg-slate-600' : 'bg-green-200')} />
                  )}
                  <Card className="relative z-10 text-center p-7 h-full">
                    <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm',
                      isDark ? 'bg-slate-700' : 'bg-gradient-to-br from-green-50 to-green-100')}>
                      {step.icon}
                    </div>
                    <div className="w-7 h-7 bg-green-700 text-white rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-3">
                      {i + 1}
                    </div>
                    <h3 className={cn('text-base font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>{step.title}</h3>
                    <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-400' : 'text-gray-500')}>{step.desc}</p>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.5 }} className="text-center mt-10">
            <Link to="/donate">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                {t('hero.cta_donate')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          DONATION CATEGORIES
      ════════════════════════════════════════════════ */}
      <section className={sectionLight}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} className="text-center mb-14">
            <h2 className={h2Class}>{t('home.categories_title')}</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {categories.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link to="/donate">
                  <div className={cn(
                    'group text-center p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:border-green-500'
                      : 'bg-white border-gray-100 hover:border-green-200',
                  )}>
                    <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-110 transition-transform shadow-md', cat.color)}>
                      {cat.icon}
                    </div>
                    <p className={cn('text-sm font-semibold transition-colors group-hover:text-green-500',
                      isDark ? 'text-slate-300' : 'text-gray-700')}>
                      {t(`home.${cat.key}`)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          RECENT DONATIONS
      ════════════════════════════════════════════════ */}
      {statsData?.recentDonations?.length > 0 && (
        <section className={sectionMuted}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className={cn('text-3xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
                {t('home.recent_donations')}
              </h2>
              <Link to="/donate"
                className="text-green-500 font-semibold text-sm hover:underline flex items-center gap-1">
                {t('home.view_all')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {statsData.recentDonations.slice(0, 6).map((d: any, i: number) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Card hover>
                    <div className="flex items-center gap-4">
                      <div className={cn('w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                        isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                        {d.isAnonymous ? '?' : `${d.donor?.firstName?.[0]}${d.donor?.lastName?.[0]}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-800')}>
                          {d.isAnonymous ? 'Anonymous Donor' : `${d.donor?.firstName} ${d.donor?.lastName}`}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>
                          {formatDate(d.createdAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-green-500">{formatCurrency(d.amount || 0)}</p>
                        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>{d.donationType}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════ */}
      <section className={sectionLight}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} className="text-center mb-14">
            <h2 className={h2Class}>What People Say</h2>
            <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-gray-500')}>Voices from our community</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <Card className="h-full flex flex-col p-7">
                  <Quote className={cn('w-8 h-8 mb-4', isDark ? 'text-green-800' : 'text-green-200')} />
                  <p className={cn('text-sm leading-relaxed flex-1 italic', isDark ? 'text-slate-300' : 'text-gray-600')}>
                    "{item.text}"
                  </p>
                  <div className={cn('flex items-center gap-3 mt-5 pt-5 border-t', isDark ? 'border-slate-700' : 'border-gray-100')}>
                    <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {item.avatar}
                    </div>
                    <div>
                      <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-800')}>{item.name}</p>
                      <p className="text-xs text-green-500">{item.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURED SUPPORT REQUESTS
      ════════════════════════════════════════════════ */}
      {featuredRequests && featuredRequests.length > 0 && (
        <section className={sectionMuted}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} className="text-center mb-10">
              <h2 className={h2Class}>People Who Need Your Help</h2>
              <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-gray-500')}>
                These community members have verified support requests waiting
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {featuredRequests.map((req: any, i: number) => {
                const pct = req.goalAmount ? Math.min((req.raisedAmount / req.goalAmount) * 100, 100) : 0;
                const urgencyMap: Record<number, { label: string; color: string }> = {
                  5: { label: '🚨 Emergency', color: 'text-red-600' },
                  4: { label: '🔴 Critical', color: 'text-orange-600' },
                  3: { label: '🟠 High', color: 'text-amber-600' },
                  2: { label: '🟡 Medium', color: 'text-yellow-600' },
                  1: { label: '🟢 Standard', color: 'text-green-600' },
                };
                const urgency = urgencyMap[req.urgencyLevel] || urgencyMap[1];
                return (
                  <motion.div key={req.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <Card className="flex flex-col h-full" padding="none">
                      {/* Category bar */}
                      <div className="gradient-hero h-2 rounded-t-2xl" />
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className={cn('font-bold text-sm flex-1', isDark ? 'text-white' : 'text-gray-900')}>
                            {req.title}
                          </h3>
                          <span className={cn('text-xs font-semibold shrink-0', urgency.color)}>
                            {urgency.label}
                          </span>
                        </div>
                        <p className={cn('text-xs leading-relaxed line-clamp-3 flex-1 mb-4', isDark ? 'text-slate-400' : 'text-gray-500')}>
                          {req.description}
                        </p>
                        {req.goalAmount && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                              <span className="text-green-500">{formatCurrency(req.raisedAmount)} raised</span>
                              <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{Math.round(pct)}% of {formatCurrency(req.goalAmount)}</span>
                            </div>
                            <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }}
                                viewport={{ once: true }} transition={{ duration: 0.8 }}
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                            </div>
                          </div>
                        )}
                        <div className={cn('flex items-center gap-2 text-xs mb-4', isDark ? 'text-slate-500' : 'text-gray-400')}>
                          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-[10px]">
                            {req.user?.firstName?.[0]}
                          </div>
                          {req.user?.firstName} {req.user?.lastName}
                          <span className="ml-auto">{req.category}</span>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/donate?tab=requests`} className="flex-1">
                            <Button size="sm" className="w-full" rightIcon={<Heart className="w-3.5 h-3.5" />}>
                              Support Now
                            </Button>
                          </Link>
                          <a href={`https://t.me/share/url?url=${encodeURIComponent(`https://wedonate.et/donate/request/${req.id}`)}&text=${encodeURIComponent(`Help: ${req.title}`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-blue-500 text-white hover:opacity-80 transition-opacity">
                            <Share2 className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            <div className="text-center">
              <Link to="/donate?tab=requests">
                <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All Requests
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════ */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGES[(slide + 1) % HERO_IMAGES.length].src}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/70 to-green-800/50" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6">
              Ready to Make a <span className="text-amber-400">Difference?</span>
            </h2>
            <p className="text-xl text-white/80 mb-10">
              Join thousands of donors already transforming lives in Adama City.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/donate">
                <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  {t('hero.cta_donate')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline"
                  className="border-white/60 text-white hover:bg-white/10 hover:text-white hover:border-white">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
