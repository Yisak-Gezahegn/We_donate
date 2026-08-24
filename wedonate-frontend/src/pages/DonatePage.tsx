import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import CampaignUpdates from '../components/CampaignUpdates';
import ImpactGallery from '../components/ImpactGallery';
import {
  Heart, Target, Users, ArrowRight, Lock, Plus,
  Search, Calendar, ChevronRight, X, Copy, Check,
  Smartphone, Building2, Package, CreditCard, Eye, BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ImageUpload from '../components/ui/ImageUpload';

type DonateTab = 'campaigns' | 'requests' | 'create-campaign';

const CAMPAIGN_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'INFRASTRUCTURE', label: '🏗️ Infrastructure' },
  { value: 'EDUCATION', label: '📚 Education' },
  { value: 'HEALTH', label: '🏥 Health & Medical' },
  { value: 'EMERGENCY', label: '🆘 Emergency Relief' },
  { value: 'OTHER', label: '🤝 Other' },
];

const REQUEST_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'FOOD', label: '🍞 Food' },
  { value: 'MEDICINE', label: '💊 Medicine' },
  { value: 'CLOTHES', label: '👕 Clothes' },
  { value: 'MONEY', label: '💰 Money' },
  { value: 'OTHER', label: '🤲 Other' },
];

function ProgressBar({ raised, goal, deadline, isDark, className }: { raised: number; goal: number; deadline?: string | null; isDark?: boolean; className?: string }) {
  const pct = Math.min((raised / goal) * 100, 100);
  const goalMet = raised >= goal;
  const daysLeft = deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span className="text-green-500">{formatCurrency(raised)} raised</span>
        <span className={cn(goalMet ? 'text-green-600 font-bold' : 'opacity-60')}>{Math.round(pct)}%</span>
      </div>
      <div className={cn('h-2.5 rounded-full overflow-hidden', isDark ? 'bg-slate-600' : 'bg-gray-200')}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', goalMet
            ? 'bg-gradient-to-r from-green-400 to-emerald-300'
            : 'bg-gradient-to-r from-green-500 to-emerald-400')}
        />
      </div>
      <div className="flex justify-between text-xs mt-1.5">
        <span className={cn('opacity-60')}>Goal: {formatCurrency(goal)}</span>
        {goalMet ? (
          <span className="text-green-600 font-bold">✓ Goal Reached!</span>
        ) : daysLeft !== null ? (
          <span className={cn(daysLeft <= 3 ? 'text-red-500 font-semibold' : 'opacity-60')}>
            {daysLeft === 0 ? '⏰ Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ShareButton({ platform, label, color, url, title, isDark }: {
  platform: string; label: string; color: string; url: string; title: string; isDark: boolean;
}) {
  const shareUrls: Record<string, string> = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Check this out: ${title}`)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check this out: ${title}\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
  return (
    <a href={shareUrls[platform]} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-80"
      style={{ backgroundColor: color }}>
      {platform === 'telegram' && <span>✈</span>}
      {platform === 'whatsapp' && <span>💬</span>}
      {platform === 'facebook' && <span>f</span>}
      {label}
    </a>
  );
}

function CampaignCard({ camp, onDonate, onDetail, isDark }: { camp: any; onDonate: (id: string, title: string, data: any) => void; onDetail: (data: any) => void; isDark: boolean }) {
  const catColors: Record<string, string> = {
    INFRASTRUCTURE: 'bg-blue-100 text-blue-700', EDUCATION: 'bg-purple-100 text-purple-700',
    HEALTH: 'bg-red-100 text-red-700', EMERGENCY: 'bg-orange-100 text-orange-700', OTHER: 'bg-gray-100 text-gray-700',
  };
  const daysLeft = camp.deadline
    ? Math.max(0, Math.ceil((new Date(camp.deadline).getTime() - Date.now()) / 86400000))
    : null;
  const goalReached = camp.raisedAmount >= camp.goalAmount;
  const isCompleted = camp.status === 'COMPLETED';

  return (
    <Card className="overflow-hidden flex flex-col h-full" padding="none">
      <div className="h-40 gradient-hero relative overflow-hidden">
        {camp.imageUrl
          ? <img src={camp.imageUrl} alt={camp.title} className="w-full h-full object-cover opacity-80" />
          : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">🏗️</div>
        }
        <div className="absolute top-3 left-3">
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', catColors[camp.category] || catColors.OTHER)}>
            {camp.category.replace('_', ' ')}
          </span>
        </div>
        {isCompleted && (
          <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
            <span className="text-white font-extrabold text-lg tracking-wide">✓ COMPLETED</span>
          </div>
        )}
        {!isCompleted && daysLeft !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            <Calendar className="w-3 h-3" />
            {daysLeft}d left
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-2">
          <h3 className={cn('font-bold text-sm flex-1 line-clamp-2', isDark ? 'text-white' : 'text-gray-900')}>
            {camp.title}
          </h3>
        </div>
        <p className={cn('text-xs leading-relaxed mb-4 line-clamp-2 flex-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          {camp.description}
        </p>

        <ProgressBar raised={camp.raisedAmount} goal={camp.goalAmount} deadline={camp.deadline} isDark={isDark} className="mb-4" />

        <div className="flex items-center justify-between mb-4 text-xs">
          <span className={cn('flex items-center gap-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            <Users className="w-3.5 h-3.5" />
            {camp._count?.donations ?? 0} donors
          </span>
          <span className={cn(isDark ? 'text-slate-400' : 'text-gray-500')}>
            by {camp.user?.firstName} {camp.user?.lastName} {camp.user?.isVerified && <span className="inline-flex items-center gap-0.5 text-blue-500"><BadgeCheck className="w-3 h-3" /></span>}
          </span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onDetail(camp)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Show Detail
          </Button>
          {isCompleted || goalReached ? (
            <Button size="sm" className="flex-1" disabled
              rightIcon={<Check className="w-3.5 h-3.5" />}>
              Goal Reached
            </Button>
          ) : (
            <Button size="sm" className="flex-1" onClick={() => onDonate(camp.id, camp.title, camp)}
              rightIcon={<ChevronRight className="w-4 h-4" />}>
              Donate
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function RequestCard({ req, onDonate, onDetail, isDark }: { req: any; onDonate: (id: string, title: string, data: any) => void; onDetail: (data: any) => void; isDark: boolean }) {
  const urgencyMap: Record<number, { label: string; color: string }> = {
    5: { label: '🚨 Emergency', color: 'bg-red-100 text-red-700 border border-red-200' },
    4: { label: '🔴 Critical', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
    3: { label: '🟠 High', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
    2: { label: '🟡 Medium', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    1: { label: '🟢 Standard', color: 'bg-green-100 text-green-700 border border-green-200' },
  };
  const urgency = urgencyMap[req.urgencyLevel] || urgencyMap[1];
  const goalReached = req.goalAmount && req.raisedAmount >= req.goalAmount;
  const isFulfilled = req.status === 'FULFILLED';

  return (
    <Card className="overflow-hidden flex flex-col h-full" padding="none">
      <div className="h-36 gradient-hero relative overflow-hidden">
        {req.imageUrl
          ? <img src={req.imageUrl} alt={req.title} className="w-full h-full object-cover opacity-80" />
          : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">🤲</div>
        }
        <div className="absolute top-3 left-3">
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', urgency.color)}>
            {urgency.label}
          </span>
        </div>
        {isFulfilled && (
          <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
            <span className="text-white font-extrabold text-lg tracking-wide">✓ FULFILLED</span>
          </div>
        )}
        {!isFulfilled && (
          <div className="absolute top-3 right-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white">
              {req.category}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className={cn('font-bold text-sm flex-1 line-clamp-2 mb-2', isDark ? 'text-white' : 'text-gray-900')}>
          {req.title}
        </h3>

        <p className={cn('text-xs leading-relaxed mb-4 line-clamp-2 flex-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          {req.description}
        </p>

        {req.goalAmount && (
          <ProgressBar raised={req.raisedAmount} goal={req.goalAmount} isDark={isDark} className="mb-4" />
        )}

        <div className="flex items-center justify-between mb-4 text-xs">
          <div className={cn('flex items-center gap-2', isDark ? 'text-slate-400' : 'text-gray-500')}>
            {req.user?.profileImage ? (
              <img src={req.user.profileImage} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-[10px]">
                {req.user?.firstName?.[0]}
              </div>
            )}
            <span>{req.user?.firstName} {req.user?.lastName} {req.user?.isVerified && <BadgeCheck className="w-3 h-3 inline text-blue-500" />}</span>
          </div>
          <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{formatDate(req.createdAt)}</span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onDetail(req)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Show Detail
          </Button>
          {isFulfilled || goalReached ? (
            <Button size="sm" className="flex-1" disabled
              rightIcon={<Check className="w-3.5 h-3.5" />}>
              Goal Reached
            </Button>
          ) : (
            <Button size="sm" className="flex-1" onClick={() => onDonate(req.id, req.title, req)}
              rightIcon={<Heart className="w-3.5 h-3.5" />}>
              Donate
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ── Account Row (copy-to-clipboard) ──────────────────────── */
function AccountRow({ label, value, isDark }: { label: string; value?: string | null; isDark: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl',
      isDark ? 'bg-slate-700' : 'bg-gray-50')}>
      <div>
        <p className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-gray-500')}>{label}</p>
        <p className={cn('text-sm font-mono font-bold', isDark ? 'text-white' : 'text-gray-900')}>{value}</p>
      </div>
      <button onClick={copy} className={cn('p-1.5 rounded-lg transition-colors',
        isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200')}>
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className={cn('w-4 h-4', isDark ? 'text-slate-400' : 'text-gray-400')} />}
      </button>
    </div>
  );
}

/* ── Detail Progress Modal ────────────────────────────────── */
function DetailModal({ data, type, onClose, isDark }: { data: any; type: 'campaign' | 'request'; onClose: () => void; isDark: boolean }) {
  const { data: detailData } = useQuery({
    queryKey: ['detail', type, data?.id],
    queryFn: () => api.get(type === 'campaign' ? `/campaigns/${data.id}` : `/support-requests/${data.id}`).then(r => r.data.data),
    enabled: !!data?.id,
    staleTime: 30000,
  });
  const display = detailData || data;
  if (!display) return null;
  const pct = display.goalAmount ? Math.min((display.raisedAmount / display.goalAmount) * 100, 100) : 0;
  const donorCount = display._count?.donations ?? display.donations?.length ?? 0;
  const catColors: Record<string, string> = {
    INFRASTRUCTURE: 'bg-blue-100 text-blue-700', EDUCATION: 'bg-purple-100 text-purple-700',
    HEALTH: 'bg-red-100 text-red-700', EMERGENCY: 'bg-orange-100 text-orange-700',
    FOOD: 'bg-yellow-100 text-yellow-700', MEDICINE: 'bg-pink-100 text-pink-700',
    CLOTHES: 'bg-indigo-100 text-indigo-700', MONEY: 'bg-green-100 text-green-700',
    OTHER: 'bg-gray-100 text-gray-700',
  };
  const daysLeft = display.deadline
    ? Math.max(0, Math.ceil((new Date(display.deadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className={cn('w-full max-w-2xl my-8 rounded-3xl shadow-2xl overflow-hidden',
          isDark ? 'bg-slate-800' : 'bg-white')}>

        {/* ── Cover Image Hero ── */}
        <div className="relative h-72 overflow-hidden">
          {display.imageUrl ? (
            <img src={display.imageUrl} alt={display.title} className="w-full h-full object-cover" />
          ) : (
            <div className={cn('w-full h-full flex items-center justify-center text-8xl',
              isDark ? 'bg-slate-700' : 'bg-gray-200')}>
              {type === 'campaign' ? '🏗️' : '🤲'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <X className="w-4 h-4" />
          </button>

          {/* Status badge on image */}
          <div className="absolute top-4 left-4">
            <Badge variant={display.status === 'ACTIVE' || display.status === 'APPROVED' ? 'success' : display.status === 'PENDING' ? 'warning' : 'danger'}>
              {display.status}
            </Badge>
          </div>

          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {display.category && (
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', catColors[display.category] || catColors.OTHER)}>
                  {display.category.replace('_', ' ')}
                </span>
              )}
              {display.urgencyLevel && (
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm')}>
                  {display.urgencyLevel === 5 ? '🚨 Emergency' : display.urgencyLevel === 4 ? '🔴 Critical' : display.urgencyLevel === 3 ? '🟠 High' : display.urgencyLevel === 2 ? '🟡 Medium' : '🟢 Standard'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight drop-shadow-lg">{display.title}</h2>
          </div>
        </div>

        <div className="p-6">

          {/* ── Overview / Progress Section ── */}
          {display.goalAmount && (
            <div className={cn('rounded-2xl p-5 mb-6 border',
              isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100')}>

              <div className="flex items-center gap-2 mb-4">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center',
                  isDark ? 'bg-green-900/50' : 'bg-green-100')}>
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <h3 className={cn('text-sm font-bold uppercase tracking-wide', isDark ? 'text-green-400' : 'text-green-700')}>
                  Overview
                </h3>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className={cn('text-center p-3 rounded-xl', isDark ? 'bg-slate-600/50' : 'bg-white')}>
                  <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
                    {formatCurrency(display.raisedAmount)}
                  </p>
                  <p className={cn('text-xs font-medium mt-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Raised</p>
                </div>
                <div className={cn('text-center p-3 rounded-xl', isDark ? 'bg-slate-600/50' : 'bg-white')}>
                  <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
                    {formatCurrency(display.goalAmount)}
                  </p>
                  <p className={cn('text-xs font-medium mt-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Goal</p>
                </div>
                <div className={cn('text-center p-3 rounded-xl', isDark ? 'bg-slate-600/50' : 'bg-white')}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className={cn('w-4 h-4', isDark ? 'text-green-400' : 'text-green-600')} />
                    <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
                      {donorCount}
                    </p>
                  </div>
                  <p className={cn('text-xs font-medium mt-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Donors</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2 font-semibold">
                  <span className="text-green-500">{Math.round(pct)}% funded</span>
                  {pct >= 100 ? (
                    <span className="text-green-600 font-bold">✓ Goal Reached!</span>
                  ) : daysLeft !== null ? (
                    <span className={cn(daysLeft <= 3 ? 'text-red-500 font-semibold' : (isDark ? 'text-slate-400' : 'text-gray-500'))}>
                      {daysLeft === 0 ? '⏰ Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                    </span>
                  ) : null}
                </div>
                <div className={cn('h-3 rounded-full overflow-hidden', isDark ? 'bg-slate-600' : 'bg-gray-200')}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', pct >= 100
                      ? 'bg-gradient-to-r from-green-400 to-emerald-300'
                      : 'bg-gradient-to-r from-green-500 to-emerald-400')} />
                </div>
              </div>

              {/* Recent donors */}
              {display.donations && display.donations.length > 0 && (
                <div className={cn('pt-3 border-t', isDark ? 'border-slate-600' : 'border-green-100')}>
                  <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Recent Contributors</p>
                  <div className="flex flex-wrap gap-2">
                    {display.donations.slice(0, 6).map((d: any, i: number) => (
                      <div key={d.id || i} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
                        isDark ? 'bg-slate-600 text-slate-300' : 'bg-green-100 text-green-700')}>
                        <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white',
                          d.donor?.firstName ? 'bg-green-600' : 'bg-gray-400')}>
                          {d.isAnonymous ? '?' : (d.donor?.firstName?.[0] || 'A')}
                        </div>
                        {d.isAnonymous ? 'Anonymous' : `${d.donor?.firstName || ''}`}
                        {d.amount && <span className="opacity-70">· {formatCurrency(d.amount)}</span>}
                      </div>
                    ))}
                    {display._count?.donations > 6 && (
                      <span className={cn('px-2.5 py-1.5 rounded-full text-xs font-medium',
                        isDark ? 'bg-slate-600 text-slate-400' : 'bg-gray-100 text-gray-500')}>
                        +{display._count.donations - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-5">
            <h3 className={cn('text-sm font-bold uppercase tracking-wide mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>
              {type === 'campaign' ? 'About this Campaign' : 'About this Request'}
            </h3>
            <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-300' : 'text-gray-600')}>{display.description}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {display.location && (
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-slate-700/30' : 'bg-gray-50')}>
                <p className={cn('text-xs font-semibold mb-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Location</p>
                <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{display.location}</p>
              </div>
            )}
            {display.familySize && (
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-slate-700/30' : 'bg-gray-50')}>
                <p className={cn('text-xs font-semibold mb-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Family Size</p>
                <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{display.familySize} people</p>
              </div>
            )}
            {display.deadline && (
              <div className={cn('p-3 rounded-xl', isDark ? 'bg-slate-700/30' : 'bg-gray-50')}>
                <p className={cn('text-xs font-semibold mb-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Deadline</p>
                <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{formatDate(display.deadline)}</p>
              </div>
            )}
            <div className={cn('p-3 rounded-xl', isDark ? 'bg-slate-700/30' : 'bg-gray-50')}>
              <p className={cn('text-xs font-semibold mb-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Posted</p>
              <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{formatDate(display.createdAt)}</p>
            </div>
          </div>

          {/* Beneficiary info */}
          {display.user && (
            <div className={cn('flex items-center gap-3 p-4 rounded-2xl mb-5',
              isDark ? 'bg-slate-700/30' : 'bg-gray-50')}>
              {display.user.profileImage ? (
                <img src={display.user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                  {display.user.firstName?.[0]}{display.user.lastName?.[0]}
                </div>
              )}
              <div>
                <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{display.user.firstName} {display.user.lastName}</p>
                <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{type === 'campaign' ? 'Campaign Creator' : 'Requester'}</p>
              </div>
            </div>
          )}

          {/* Impact Gallery */}
          {type === 'campaign' && <ImpactGallery campaign={display} />}

          {/* Campaign Updates Timeline */}
          {type === 'campaign' && <CampaignUpdates campaignId={display.id} />}

          {/* Social Share */}
          <div className={cn('p-4 rounded-2xl mb-5', isDark ? 'bg-slate-700/50' : 'bg-gray-50')}>
            <p className={cn('text-xs font-semibold mb-3', isDark ? 'text-slate-400' : 'text-gray-500')}>Share this cause</p>
            <div className="flex gap-2">
              <ShareButton platform="telegram" label="Telegram" color="#229ED9"
                url={`${window.location.origin}/donate/${type}/${display.id}`}
                title={display.title} isDark={isDark} />
              <ShareButton platform="whatsapp" label="WhatsApp" color="#25D366"
                url={`${window.location.origin}/donate/${type}/${display.id}`}
                title={display.title} isDark={isDark} />
              <ShareButton platform="facebook" label="Facebook" color="#1877F2"
                url={`${window.location.origin}/donate/${type}/${display.id}`}
                title={display.title} isDark={isDark} />
            </div>
          </div>

          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Donation Modal — Item/Money first, then beneficiary accounts ─── */
function DonationModal({
  target, type, targetData, onClose, isAuthenticated, navigate, isDark,
}: {
  target: { id: string; title: string } | null;
  type: 'campaign' | 'request';
  targetData: any;
  onClose: () => void;
  isAuthenticated: boolean;
  navigate: (p: string) => void;
  isDark: boolean;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [donateType, setDonateType] = useState<'ITEM' | 'MONEY' | ''>('');
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [custom, setCustom] = useState('');
  const [anon, setAnon] = useState(false);
  const [note, setNote] = useState('');
  const [refCode, setRefCode] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCategory, setItemCategory] = useState('OTHER');
  const [itemImgUrl, setItemImgUrl] = useState('');
  const [delivery, setDelivery] = useState('BRING_TO_OFFICE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 2 && donateType === 'ITEM') setStep(3);
  }, [step, donateType]);

  const AMOUNTS = [50, 100, 200, 500, 1000, 2000];
  const finalAmount = parseFloat(amount || custom) || 0;
  const inp = cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900');

  const PAYMENT_METHODS = [
    { id: 'TELEBIRR', icon: Smartphone, label: 'TeleBirr', desc: 'Transfer to TeleBirr account', account: targetData?.telebirrAccount },
    { id: 'CBE', icon: Building2, label: 'CBE', desc: 'Commercial Bank of Ethiopia', account: targetData?.cbeAccount },
    { id: 'BOA', icon: Building2, label: 'BOA', desc: 'Bank of Abyssinia', account: targetData?.boaAccount },
    { id: 'AWASH', icon: Building2, label: 'Awash Bank', desc: 'Awash International Bank', account: targetData?.awashAccount },
    { id: 'OTHER_BANK', icon: Building2, label: targetData?.otherBankName || 'Other Bank', desc: 'Any other bank transfer', account: targetData?.otherBankAccount },
  ].filter(m => m.account);

  const stepLabels = donateType === 'MONEY'
    ? ['Choose Type', 'Payment Method', 'Donation Details', 'Done']
    : ['Choose Type', 'Item Details', 'Done'];

  const handleSubmit = async () => {
    if (!isAuthenticated) { toast.error('Please login to donate'); navigate('/login'); return; }
    if (donateType === 'MONEY') {
      if (finalAmount < 1) { toast.error('Enter a valid amount (min 1 ETB)'); return; }
      if (!refCode.trim()) { toast.error('Please enter the transaction reference code'); return; }
      if (!proofUrl.trim()) { toast.error('Please upload a payment proof screenshot'); return; }
    }
    if (donateType === 'ITEM') {
      if (!itemDesc.trim()) { toast.error('Please describe the items you are donating'); return; }
      if (!itemImgUrl.trim()) { toast.error('Please upload a photo of the items'); return; }
    }

    setLoading(true);
    try {
      const payload: any = {
        donationType: donateType === 'ITEM' ? itemCategory : 'MONEY',
        description: note || itemDesc,
        isAnonymous: anon,
        paymentMethod: donateType === 'ITEM' ? 'ITEM' : method,
        referenceCode: refCode || null,
        paymentProofUrl: proofUrl || null,
        itemDescription: itemDesc || null,
        itemImageUrl: itemImgUrl || null,
        deliveryMethod: donateType === 'ITEM' ? delivery : null,
      };
      if (donateType === 'MONEY') payload.amount = finalAmount;
      if (type === 'campaign') payload.campaignId = target!.id;
      else payload.supportRequestId = target!.id;

      await api.post('/donations', payload);
      setStep(donateType === 'MONEY' ? 4 : 3);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  if (!target) return null;

  const moneyDone = step === 4;
  const itemDone = step === 3 && donateType === 'ITEM';
  const isDone = moneyDone || itemDone;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={cn('w-full max-w-lg my-8 rounded-3xl shadow-2xl overflow-hidden',
          isDark ? 'bg-slate-800' : 'bg-white')}>

        {/* Header */}
        <div className="gradient-hero px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-white fill-white" />
              <span className="text-white font-bold text-sm">
                {type === 'campaign' ? 'Support Campaign' : 'Support Request'}
              </span>
            </div>
            <p className="text-white/80 text-sm line-clamp-1">{target.title}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className={cn('flex items-center gap-2 px-6 py-3 text-xs border-b overflow-x-auto',
          isDark ? 'border-slate-700 bg-slate-700/50' : 'border-gray-100 bg-gray-50')}>
          {stepLabels.map((s, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-green-700 text-white' : (isDark ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-500'))}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={step === i + 1 ? 'text-green-500 font-semibold' : (isDark ? 'text-slate-500' : 'text-gray-400')}>{s}</span>
              {i < stepLabels.length - 1 && <ChevronRight className="w-3 h-3 opacity-30" />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* ════ STEP 1: Choose Type ════ */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <p className={cn('text-sm font-semibold mb-2', isDark ? 'text-slate-300' : 'text-gray-700')}>
                How would you like to help?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setDonateType('MONEY'); setMethod(''); setStep(2); }}
                  className={cn('group relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all cursor-pointer',
                    isDark ? 'border-slate-600 hover:border-green-500 hover:bg-slate-700/50' : 'border-gray-200 hover:border-green-400 hover:bg-green-50')}>
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                    isDark ? 'bg-green-900/40 group-hover:bg-green-800/50' : 'bg-green-100 group-hover:bg-green-200')}>
                    <CreditCard className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Money</p>
                    <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Send funds directly</p>
                  </div>
                  <ChevronRight className={cn('absolute top-3 right-3 w-4 h-4 transition-colors',
                    isDark ? 'text-slate-600 group-hover:text-green-400' : 'text-gray-300 group-hover:text-green-500')} />
                </motion.button>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setDonateType('ITEM'); setMethod('ITEM'); setStep(2); }}
                  className={cn('group relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all cursor-pointer',
                    isDark ? 'border-slate-600 hover:border-amber-500 hover:bg-slate-700/50' : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50')}>
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                    isDark ? 'bg-amber-900/40 group-hover:bg-amber-800/50' : 'bg-amber-100 group-hover:bg-amber-200')}>
                    <Package className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="text-center">
                    <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Item</p>
                    <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>Food, clothes, medicine...</p>
                  </div>
                  <ChevronRight className={cn('absolute top-3 right-3 w-4 h-4 transition-colors',
                    isDark ? 'text-slate-600 group-hover:text-amber-400' : 'text-gray-300 group-hover:text-amber-500')} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ════ STEP 2A: Money → Choose Payment Method ════ */}
          {step === 2 && donateType === 'MONEY' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <button onClick={() => { setStep(1); setDonateType(''); }}
                className={cn('flex items-center gap-1 text-xs font-medium mb-1',
                  isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800')}>
                ← Back
              </button>
              <p className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-gray-700')}>Select payment method</p>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
                Choose where to send your money — the beneficiary's account details will be shown
              </p>

              {PAYMENT_METHODS.length === 0 ? (
                <div className={cn('text-center py-8 rounded-2xl border', isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200')}>
                  <Building2 className={cn('w-10 h-10 mx-auto mb-2', isDark ? 'text-slate-600' : 'text-gray-300')} />
                  <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-gray-500')}>No payment accounts available</p>
                  <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-gray-400')}>This beneficiary hasn't added payment accounts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((m, idx) => (
                    <motion.button key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => { setMethod(m.id); setStep(3); }}
                      className={cn('w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all',
                        isDark ? 'border-slate-700 hover:border-green-500 hover:bg-slate-700' : 'border-gray-200 hover:border-green-400 hover:bg-green-50')}>
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        isDark ? 'bg-slate-700' : 'bg-green-100')}>
                        <m.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{m.label}</p>
                        <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{m.desc}</p>
                      </div>
                      <div className={cn('text-xs font-mono font-bold', isDark ? 'text-green-400' : 'text-green-600')}>
                        {m.account?.length > 8 ? m.account.slice(0, 8) + '...' : m.account}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════ STEP 3: Money details ════ */}
          {step === 3 && donateType === 'MONEY' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <button onClick={() => setStep(2)}
                className={cn('flex items-center gap-1 text-xs font-medium mb-1',
                  isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800')}>
                ← Back
              </button>

              <div className={cn('p-4 rounded-2xl border space-y-2',
                isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-amber-50 border-amber-200')}>
                <p className={cn('text-xs font-bold mb-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  📋 Transfer directly then upload proof below
                </p>
                {method === 'TELEBIRR' && <AccountRow label="TeleBirr" value={targetData.telebirrAccount} isDark={isDark} />}
                {method === 'CBE' && <AccountRow label="CBE Account" value={targetData.cbeAccount} isDark={isDark} />}
                {method === 'BOA' && <AccountRow label="BOA Account" value={targetData.boaAccount} isDark={isDark} />}
                {method === 'AWASH' && <AccountRow label="Awash Account" value={targetData.awashAccount} isDark={isDark} />}
                {method === 'OTHER_BANK' && (
                  <>
                    {targetData.otherBankName && <AccountRow label="Bank Name" value={targetData.otherBankName} isDark={isDark} />}
                    <AccountRow label="Account Number" value={targetData.otherBankAccount} isDark={isDark} />
                  </>
                )}
              </div>

              <div>
                <label className={cn('block text-sm font-semibold mb-3', isDark ? 'text-slate-300' : 'text-gray-700')}>Amount (ETB) *</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {AMOUNTS.map(a => (
                    <button key={a} onClick={() => { setAmount(String(a)); setCustom(''); }}
                      className={cn('py-2.5 rounded-xl border-2 text-sm font-bold transition-all',
                        amount === String(a) ? 'border-green-600 bg-green-600 text-white' : (isDark ? 'border-slate-600 hover:border-green-500 text-slate-300' : 'border-gray-200 hover:border-green-300 text-gray-700'))}>
                      {formatCurrency(a)}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Custom amount..." value={custom}
                  onChange={e => { setCustom(e.target.value); setAmount(''); }}
                  className={inp} min="1" />
              </div>

              <div>
                <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                  Transaction Reference Code *
                </label>
                <input className={inp} placeholder="Enter the reference/transaction ID from your bank"
                  value={refCode} onChange={e => setRefCode(e.target.value)} />
              </div>

              <ImageUpload label="Payment Proof Screenshot *" value={proofUrl} onChange={setProofUrl}
                hint="Upload a screenshot of your transfer receipt" />

              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Add a message of support... (optional)"
                className={cn(inp, 'resize-none')} />

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setAnon(!anon)}
                  className={cn('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                    anon ? 'bg-green-600 border-green-600' : (isDark ? 'border-slate-500' : 'border-gray-300'))}>
                  {anon && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-gray-700')}>Donate anonymously</span>
              </label>

              {/* Fee Breakdown */}
              <div className={cn('p-3 rounded-xl text-xs space-y-1', isDark ? 'bg-slate-700/50' : 'bg-gray-50')}>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Donation amount</span>
                  <span className="font-medium">{formatCurrency(finalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Platform fee</span>
                  <span className="text-green-600 font-semibold">0% (Free)</span>
                </div>
                <div className={cn('flex justify-between pt-1 border-t font-semibold', isDark ? 'border-slate-600' : 'border-gray-200')}>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>Amount to beneficiary</span>
                  <span className="text-green-600">{formatCurrency(finalAmount)}</span>
                </div>
                <p className={cn('pt-1', isDark ? 'text-slate-500' : 'text-gray-400')}>
                  100% of your donation goes directly to the cause. We charge 0% platform fees.
                </p>
              </div>

              <Button className="w-full" size="lg" isLoading={loading} onClick={handleSubmit}>
                Confirm Donation {finalAmount > 0 ? `- ${formatCurrency(finalAmount)}` : ''}
              </Button>
            </motion.div>
          )}

          {/* ════ STEP 3: Item details ════ */}
          {step === 3 && donateType === 'ITEM' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <button onClick={() => { setStep(1); setDonateType(''); }}
                className={cn('flex items-center gap-1 text-xs font-medium mb-1',
                  isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800')}>
                ← Back
              </button>

              {/* Requester Contact Info */}
              {targetData?.requesterPhone && (
                <div className={cn('p-4 rounded-2xl border space-y-2',
                  isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200')}>
                  <p className={cn('text-xs font-bold mb-2 flex items-center gap-2', isDark ? 'text-blue-400' : 'text-blue-700')}>
                    📞 Contact Information
                  </p>
                  <div className={cn('text-sm', isDark ? 'text-blue-300' : 'text-blue-900')}>
                    <span className="font-medium">Requester's Phone:</span>{' '}
                    <a href={`tel:${targetData.requesterPhone}`}
                      className={cn('font-semibold hover:underline', isDark ? 'text-blue-200' : 'text-blue-700')}>
                      {targetData.requesterPhone}
                    </a>
                  </div>
                  <p className={cn('text-xs', isDark ? 'text-blue-400' : 'text-blue-600')}>
                    You can call this number to coordinate item delivery or pickup
                  </p>
                </div>
              )}

              <div>
                <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                  Item Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'FOOD', l: '🍚 Food & Groceries' },
                    { v: 'CLOTHES', l: '👕 Clothes & Shoes' },
                    { v: 'MEDICINE', l: '💊 Medicine & Health' },
                    { v: 'OTHER', l: '📦 Other Items' },
                  ].map(c => (
                    <button key={c.v} onClick={() => setItemCategory(c.v)}
                      className={cn('p-2 rounded-xl text-xs font-medium text-left transition-all border',
                        itemCategory === c.v
                          ? 'bg-green-600 text-white border-green-600'
                          : (isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-green-500' : 'bg-white border-gray-200 text-gray-700 hover:border-green-500'))}>
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                  What are you donating? *
                </label>
                <textarea rows={3} placeholder="Describe the items (e.g. 20kg rice, 5 shirts, medicines...)"
                  className={cn(inp, 'resize-none')}
                  value={itemDesc} onChange={e => setItemDesc(e.target.value)} />
              </div>

              <ImageUpload label="Photo of Items *" value={itemImgUrl} onChange={setItemImgUrl}
                hint="Take a clear photo of the items you're donating" />

              <div>
                <label className={cn('block text-sm font-semibold mb-2', isDark ? 'text-slate-300' : 'text-gray-700')}>
                  Delivery Method *
                </label>
                {[
                  { v: 'BRING_TO_OFFICE', l: 'I will bring to WeDonate office' },
                  { v: 'DELIVER_TO_ADDRESS', l: 'I will deliver to beneficiary address' },
                  { v: 'COORDINATE', l: 'Please coordinate with me' },
                ].map(d => (
                  <label key={d.v} className="flex items-center gap-3 cursor-pointer mb-2">
                    <div onClick={() => setDelivery(d.v)}
                      className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        delivery === d.v ? 'border-green-600' : (isDark ? 'border-slate-500' : 'border-gray-300'))}>
                      {delivery === d.v && <div className="w-2 h-2 rounded-full bg-green-600" />}
                    </div>
                    <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-gray-700')}>{d.l}</span>
                  </label>
                ))}
              </div>

              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Add a message of support... (optional)"
                className={cn(inp, 'resize-none')} />

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setAnon(!anon)}
                  className={cn('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                    anon ? 'bg-green-600 border-green-600' : (isDark ? 'border-slate-500' : 'border-gray-300'))}>
                  {anon && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-gray-700')}>Donate anonymously</span>
              </label>

              <Button className="w-full" size="lg" isLoading={loading} onClick={handleSubmit}>
                Submit Item Donation
              </Button>
            </motion.div>
          )}

          {/* ════ STEP 3/4: Success ════ */}
          {isDone && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <h3 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                {donateType === 'ITEM' ? 'Item Donation Submitted!' : 'Donation Submitted!'}
              </h3>
              <p className={cn('text-sm mb-6', isDark ? 'text-slate-400' : 'text-gray-500')}>
                {donateType === 'ITEM'
                  ? 'Thank you! The beneficiary and admin have been notified about your item donation.'
                  : 'Your donation has been recorded. The admin will verify your payment shortly.'}
              </p>
              <Button className="w-full" onClick={onClose}>Done</Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Create Campaign Form ───────────────────────────────────── */
function CreateCampaignForm({ isDark, onSuccess }: { isDark: boolean; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'OTHER', goalAmount: '', deadline: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Payment accounts
  const [telebirrAccount, setTelebirrAccount] = useState('');
  const [cbeAccount, setCbeAccount] = useState('');
  const [boaAccount, setBoaAccount] = useState('');
  const [awashAccount, setAwashAccount] = useState('');
  const [otherBankName, setOtherBankName] = useState('');
  const [otherBankAccount, setOtherBankAccount] = useState('');

  // Contact for item donations
  const [requesterPhone, setRequesterPhone] = useState('');

  // Admin-only documents
  const [supportLetterUrl, setSupportLetterUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [nationalIdFrontUrl, setNationalIdFrontUrl] = useState('');
  const [nationalIdBackUrl, setNationalIdBackUrl] = useState('');
  const [fanNumber, setFanNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const isAdmin = user && ['KEBELE_ADMIN', 'WOREDA_ADMIN', 'CITY_ADMIN', 'SUPER_ADMIN'].includes(user.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; }
    if (!form.title || !form.description || !form.goalAmount)
      return toast.error('Please fill all required fields');

    if (isAdmin && (!supportLetterUrl || !nationalIdFrontUrl || !nationalIdBackUrl || !fanNumber)) {
      toast.error('Admin users must upload support letter, national ID (front & back), and provide FAN number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/campaigns', {
        ...form,
        telebirrAccount, cbeAccount, boaAccount, awashAccount,
        otherBankName, otherBankAccount,
        requesterPhone,
        supportLetterUrl, registrationUrl,
        nationalIdFrontUrl, nationalIdBackUrl, fanNumber,
        additionalNotes,
      });
      toast.success('Campaign submitted for admin approval!');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    } finally { setLoading(false); }
  };

  const input = cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors',
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900');
  const label = cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700');

  return (
    <Card className="max-w-2xl mx-auto" padding="lg">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
          isDark ? 'bg-green-900/40' : 'bg-green-100')}>
          <Target className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Create a Campaign</h2>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Campaigns need admin approval before going live
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={label}>Campaign Title *</label>
          <input className={input} placeholder="e.g. Build a Community Library"
            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        <div>
          <label className={label}>Description *</label>
          <textarea rows={4} className={cn(input, 'resize-none')}
            placeholder="Describe your campaign — why it's important, how funds will be used, and the expected impact..."
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Category *</label>
            <select className={input} value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CAMPAIGN_CATEGORIES.filter(c => c.value).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Goal Amount (ETB) *</label>
            <input type="number" className={input} placeholder="e.g. 50000"
              value={form.goalAmount} onChange={e => setForm(p => ({ ...p, goalAmount: e.target.value }))} min="1" />
          </div>
        </div>

        <div>
          <label className={label}>Deadline (optional)</label>
          <input type="date" className={input}
            value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
        </div>

        <ImageUpload label="Campaign Cover Photo (optional)" value={form.imageUrl}
          onChange={url => setForm(p => ({ ...p, imageUrl: url }))}
          hint="A compelling photo makes your campaign more trustworthy" />

        {/* Payment Accounts Section */}
        <div className={cn('rounded-2xl border p-4 space-y-3',
          isDark ? 'border-slate-600 bg-slate-700/30' : 'border-green-100 bg-green-50')}>
          <p className={cn('text-sm font-bold', isDark ? 'text-green-400' : 'text-green-700')}>
            💳 Your Payment Accounts
          </p>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Donors will use these to send money directly to you. Add at least one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>TeleBirr Account</label>
              <input className={input} placeholder="+251 9XX XXX XXX"
                value={telebirrAccount} onChange={e => setTelebirrAccount(e.target.value)} />
            </div>
            <div>
              <label className={label}>CBE Account</label>
              <input className={input} placeholder="Account number"
                value={cbeAccount} onChange={e => setCbeAccount(e.target.value)} />
            </div>
            <div>
              <label className={label}>BOA Account</label>
              <input className={input} placeholder="Account number"
                value={boaAccount} onChange={e => setBoaAccount(e.target.value)} />
            </div>
            <div>
              <label className={label}>Awash Bank Account</label>
              <input className={input} placeholder="Account number"
                value={awashAccount} onChange={e => setAwashAccount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Other Bank Name</label>
              <input className={input} placeholder="e.g. Abyssinia Bank"
                value={otherBankName} onChange={e => setOtherBankName(e.target.value)} />
            </div>
            <div>
              <label className={label}>Other Bank Account</label>
              <input className={input} placeholder="Account number"
                value={otherBankAccount} onChange={e => setOtherBankAccount(e.target.value)} />
            </div>
          </div>

          <div className={cn('mt-4 pt-4 border-t', isDark ? 'border-slate-600' : 'border-green-200')}>
            <p className={cn('text-sm font-bold mb-2', isDark ? 'text-blue-400' : 'text-blue-700')}>
              📞 Contact for Item Donations
            </p>
            <p className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-gray-500')}>
              If people want to donate items (food, clothes, etc.) instead of money, they can call you to coordinate delivery.
            </p>
            <div>
              <label className={label}>Your Phone Number</label>
              <input className={input} placeholder="+251 9XX XXX XXX"
                value={requesterPhone} onChange={e => setRequesterPhone(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Admin-only documents */}
        <div className={cn('rounded-2xl border p-4 space-y-4',
          isDark ? 'border-slate-600 bg-slate-700/30' : 'border-amber-100 bg-amber-50')}>
          <div>
            <p className={cn('text-sm font-bold', isDark ? 'text-amber-400' : 'text-amber-700')}>
              🔒 Documents for Admin Review Only
            </p>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
              These documents are only visible to admins — not shown to the public.
              {isAdmin && <span className="block mt-1 text-amber-500 font-semibold">Required for admin users.</span>}
            </p>
          </div>
          <ImageUpload
            label={isAdmin ? "Support Letter (official letter or ID) *" : "Support Letter (official letter or ID)"}
            value={supportLetterUrl}
            onChange={setSupportLetterUrl}
            hint="Upload a kebele support letter, hospital letter, or official document"
          />
          <ImageUpload
            label={isAdmin ? "Registration Document *" : "Registration Document"}
            value={registrationUrl}
            onChange={setRegistrationUrl}
            hint="Organization registration document (if applicable)"
          />
          <ImageUpload
            label={isAdmin ? "National ID - Front Side *" : "National ID - Front Side"}
            value={nationalIdFrontUrl}
            onChange={setNationalIdFrontUrl}
            hint="Upload the front side of your national ID"
          />
          <ImageUpload
            label={isAdmin ? "National ID - Back Side *" : "National ID - Back Side"}
            value={nationalIdBackUrl}
            onChange={setNationalIdBackUrl}
            hint="Upload the back side of your national ID"
          />
          <div>
            <label className={label}>{isAdmin ? "FAN Number (Federal Admin Number) *" : "FAN Number (Federal Admin Number)"}</label>
            <input className={input} placeholder="e.g. 1234567890"
              value={fanNumber} onChange={e => setFanNumber(e.target.value)} />
          </div>
          <div>
            <label className={label}>Additional Notes for Admin</label>
            <textarea rows={3}
              placeholder="Any additional information you want to share with the admin only..."
              value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
              className={cn(input, 'resize-none')} />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}>
          Submit for Approval
        </Button>
      </form>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DonatePage
═══════════════════════════════════════════════════════════════ */
export default function DonatePage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const canCreateCampaign = user && ['NGO', 'ORGANIZATION', 'GOVERNMENTAL_ORG', 'KEBELE_ADMIN', 'WOREDA_ADMIN', 'CITY_ADMIN', 'SUPER_ADMIN'].includes(user.role);

  const [tab, setTab] = useState<DonateTab>('campaigns');
  const [campCat, setCampCat] = useState('');
  const [reqCat, setReqCat] = useState('');
  const [search, setSearch] = useState('');
  const [donateTarget, setDonateTarget] = useState<{ id: string; title: string; type: 'campaign' | 'request'; data: any } | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ data: any; type: 'campaign' | 'request' } | null>(null);

  const requireAuth = (callback: () => void) => {
    if (!isAuthenticated) {
      toast.error(t('auth.login_required'));
      navigate('/login?from=' + encodeURIComponent('/donate'));
      return;
    }
    callback();
  };

  const urlTab = searchParams.get('tab');
  const activeTab = (urlTab === 'requests' || urlTab === 'campaigns') ? urlTab : tab;

  const { data: campaigns, isLoading: loadingCamps } = useQuery({
    queryKey: ['campaigns', campCat],
    queryFn: () => api.get('/campaigns', { params: { category: campCat || undefined } }).then(r => r.data.data),
  });

  const { data: requests, isLoading: loadingReqs } = useQuery({
    queryKey: ['approved-requests', reqCat],
    queryFn: () => api.get('/support-requests', { params: { category: reqCat || undefined } }).then(r => r.data.data),
  });

  const filteredCamps = (campaigns || []).filter((c: any) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  );
  const filteredReqs = (requests || []).filter((r: any) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { id: 'campaigns', label: '🏗️ Campaigns', count: campaigns?.length },
    { id: 'requests', label: '🤲 Direct Support', count: requests?.length },
    ...(canCreateCampaign ? [{ id: 'create-campaign', label: '+ Create Campaign', count: null }] : []),
  ];

  return (
    <div className={cn('min-h-screen transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-gray-50')}>
      <div className="relative min-h-[58vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/Adama_city3.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-green-950/95 via-green-900/85 to-green-800/70" />
        </div>
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center pt-28 pb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3">{t('donate.title')}</h1>
            <p className="text-white/80 text-lg">{t('donate.subtitle')}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={cn('flex flex-wrap gap-2 p-1.5 rounded-2xl mb-8 w-fit',
          isDark ? 'bg-slate-800' : 'bg-gray-100')}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as DonateTab)}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                (tab === t.id || (t.id !== 'create-campaign' && urlTab === t.id))
                  ? 'bg-green-700 text-white shadow-md'
                  : (isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'))}>
              {t.label}
              {t.count != null && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold',
                  tab === t.id ? 'bg-white/20 text-white' : (isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'))}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {(tab === 'campaigns') && (
            <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex flex-wrap gap-3 mb-7 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                  <input placeholder="Search campaigns..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={cn('w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                      isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900')} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {CAMPAIGN_CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setCampCat(c.value)}
                      className={cn('px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
                        campCat === c.value
                          ? 'bg-green-700 text-white border-green-700'
                          : (isDark ? 'border-slate-700 text-slate-300 hover:border-green-500' : 'border-gray-200 text-gray-600 hover:border-green-400'))}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingCamps ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={cn('h-80 rounded-2xl animate-pulse', isDark ? 'bg-slate-700' : 'bg-gray-200')} />
                  ))}
                </div>
              ) : filteredCamps.length === 0 ? (
                <div className="text-center py-20">
                  <Target className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-300')} />
                  <p className={cn('font-medium', isDark ? 'text-slate-400' : 'text-gray-400')}>No campaigns found</p>
                  <Button size="sm" className="mt-4" onClick={() => setTab('create-campaign')}>
                    <Plus className="w-4 h-4 mr-2" /> Create One
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCamps.map((camp: any) => (
                    <motion.div key={camp.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                      <CampaignCard camp={camp} isDark={isDark}
                        onDonate={(id, title, data) => requireAuth(() => setDonateTarget({ id, title, type: 'campaign', data }))}
                        onDetail={(data) => setDetailTarget({ data, type: 'campaign' })} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {(tab === 'requests') && (
            <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex flex-wrap gap-3 mb-7 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                  <input placeholder="Search requests..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={cn('w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                      isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900')} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {REQUEST_CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setReqCat(c.value)}
                      className={cn('px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
                        reqCat === c.value
                          ? 'bg-green-700 text-white border-green-700'
                          : (isDark ? 'border-slate-700 text-slate-300 hover:border-green-500' : 'border-gray-200 text-gray-600 hover:border-green-400'))}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingReqs ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={cn('h-64 rounded-2xl animate-pulse', isDark ? 'bg-slate-700' : 'bg-gray-200')} />
                  ))}
                </div>
              ) : filteredReqs.length === 0 ? (
                <div className="text-center py-20">
                  <Heart className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-300')} />
                  <p className={cn('font-medium', isDark ? 'text-slate-400' : 'text-gray-400')}>No approved requests yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReqs.map((req: any) => (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                      <RequestCard req={req} isDark={isDark}
                        onDonate={(id, title, data) => requireAuth(() => setDonateTarget({ id, title, type: 'request', data }))}
                        onDetail={(data) => setDetailTarget({ data, type: 'request' })} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'create-campaign' && (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CreateCampaignForm isDark={isDark} onSuccess={() => setTab('campaigns')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {donateTarget && (
        <DonationModal
          target={donateTarget}
          type={donateTarget.type}
          targetData={donateTarget.data}
          onClose={() => setDonateTarget(null)}
          isAuthenticated={isAuthenticated}
          navigate={navigate}
          isDark={isDark}
        />
      )}

      {detailTarget && (
        <DetailModal
          data={detailTarget.data}
          type={detailTarget.type}
          onClose={() => setDetailTarget(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
