import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Shield, Eye, Target, Users, Heart, ArrowRight, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../lib/api';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

/* ── Lightbox ── */
function Lightbox({ photos, index, onClose, onPrev, onNext }: {
  photos: any[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const photo = photos[index];
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
          className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
          <img src={photo.imageUrl} alt={photo.title}
            className="w-full max-h-[75vh] object-contain rounded-2xl" />
          <div className="mt-4 text-center">
            <p className="text-white font-bold text-lg">{photo.title}</p>
            {photo.description && <p className="text-white/70 text-sm mt-1">{photo.description}</p>}
          </div>
          <button onClick={onClose}
            className="absolute -top-4 -right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          {index > 0 && (
            <button onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {index < photos.length - 1 && (
            <button onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          <p className="text-white/50 text-xs text-center mt-3">{index + 1} / {photos.length}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AboutPage() {
  const { isDark } = useTheme();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  /* Fetch gallery from backend; fallback to local images */
  const { data: galleryData } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.get('/gallery').then(r => r.data.data),
  });

  const defaultPhotos = [
    { imageUrl: '/Adama-City.jpg',   title: 'Adama City Skyline',       description: 'The vibrant heart of Oromia, Ethiopia' },
    { imageUrl: '/Adama_city2.jpg',  title: 'City Streets',             description: 'Daily life and community in Adama' },
    { imageUrl: '/Adama_city3.jpg',  title: 'Adama at Dusk',            description: 'The city comes alive in the evening' },
    { imageUrl: '/Adama_City1.jfif', title: 'Central Adama',            description: 'A city of opportunity and growth' },
    { imageUrl: '/Adama_city.jfif',  title: 'Community Gathering',      description: 'Together we build a stronger Adama' },
    { imageUrl: '/adama_logo.png',   title: 'Adama City Administration', description: 'Official seal of Adama City' },
  ];

  const photos = (galleryData && galleryData.length > 0) ? galleryData : defaultPhotos;

  const values = [
    { icon: Shield, title: 'Transparency', desc: 'Every donation is tracked end-to-end. Donors see exactly where their money goes.' },
    { icon: Eye,    title: 'Accountability', desc: 'Multi-level admin oversight from Kebele to City level ensures responsible distribution.' },
    { icon: Target, title: 'Impact',     desc: 'We measure real outcomes — families fed, medical bills paid, lives improved.' },
    { icon: Heart,  title: 'Community',  desc: 'Built by and for the people of Adama. We celebrate every generous act.' },
  ];

  const sectionLight = cn('py-20 transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-white');
  const sectionMuted = cn('py-20 transition-colors duration-300', isDark ? 'bg-slate-800' : 'bg-gray-50');
  const h2 = cn('text-4xl font-extrabold mb-4', isDark ? 'text-white' : 'text-gray-900');
  const body = cn('text-lg leading-relaxed', isDark ? 'text-slate-400' : 'text-gray-600');

  return (
    <div className={cn('transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-white')}>

      {/* ── Hero ── full overlay so navbar text is always visible ── */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <img src="/Adama_City1.jfif" alt="Adama City"
          className="absolute inset-0 w-full h-full object-cover" />
        {/* Strong gradient so text is always readable regardless of theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/95 via-green-900/85 to-green-800/70" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-24 pb-16">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <img src="/adama_logo.png" alt="" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-white/90 text-sm font-medium">Adama City Administration</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-6">
              About <span className="text-amber-400">WeDonate</span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
              Adama City Administration's official digital platform connecting generous donors
              with families and individuals in need across Adama, Oromia, Ethiopia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className={sectionLight}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className={h2}>Our Mission</h2>
              <p className={cn(body, 'mb-6')}>
                To eliminate the inefficiencies of manual charity management by creating a transparent,
                digital bridge between donors and those in need in Adama City — ensuring every birr
                reaches those who truly need it.
              </p>
              <p className={cn(body, 'mb-8')}>
                We work directly with Kebele, Woreda, and City-level administrators to verify requests,
                manage distributions, and report outcomes with full accountability.
              </p>
              <Link to="/register">
                <Button rightIcon={<ArrowRight className="w-4 h-4" />}>Join the Movement</Button>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-80">
                <img src="/Adama_city2.jpg" alt="Adama City" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-2xl font-bold">Adama City</p>
                  <p className="text-sm text-white/80">Oromia, Ethiopia</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className={sectionMuted}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-14">
            <h2 className={h2}>Our Values</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card hover className="text-center p-7 h-full">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4',
                    isDark ? 'bg-green-900/40' : 'bg-green-100')}>
                    <v.icon className="w-7 h-7 text-green-500" />
                  </div>
                  <h3 className={cn('text-base font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>{v.title}</h3>
                  <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-400' : 'text-gray-500')}>{v.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ── admin-managed, lightbox support ── */}
      <section className={sectionLight}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-12">
            <h2 className={h2}>Our City, Our Community</h2>
            <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-gray-500')}>
              A glimpse of life in Adama — curated by our city administrators
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo: any, i: number) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group relative rounded-2xl overflow-hidden shadow-md cursor-pointer"
                style={{ height: i % 5 === 0 ? '280px' : '200px' }}
                onClick={() => setLightboxIdx(i)}>
                <img src={photo.imageUrl} alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white font-bold text-sm">{photo.title}</p>
                  {photo.description && (
                    <p className="text-white/70 text-xs mt-1 line-clamp-2">{photo.description}</p>
                  )}
                </div>
                {/* Zoom icon */}
                <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full
                  flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          photos={photos} index={lightboxIdx} onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIdx(i => Math.min(photos.length - 1, (i ?? 0) + 1))}
        />
      )}

      {/* ── CTA ── */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: "url('/Adama_city3.jpg')" }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl font-extrabold text-white mb-6">Be Part of the Change</h2>
            <p className="text-xl text-white/80 mb-10">
              Post a request, donate to someone in need, or join a community campaign.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Started Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
