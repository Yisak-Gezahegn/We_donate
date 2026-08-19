import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, FileText, ArrowRight, Plus, Target, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function DashboardHome() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const isAdmin = user && ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'].includes(user.role);

  const { data: myDonations } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => api.get('/donations/my').then(r => r.data.data),
  });

  const { data: myRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => api.get('/support-requests/my').then(r => r.data.data),
  });

  const { data: myCampaigns } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaigns/my').then(r => r.data.data),
  });

  const { data: adminStats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    enabled: !!isAdmin,
  });

  const statCards = [
    {
      label: 'My Donations',
      value: myDonations?.length ?? 0,
      sub: formatCurrency(myDonations?.reduce((s: number, d: any) => s + (d.amount || 0), 0) ?? 0),
      icon: Heart, color: 'text-green-500', bg: isDark ? 'bg-green-900/30' : 'bg-green-50',
      to: '/dashboard/donations',
    },
    {
      label: 'My Requests',
      value: myRequests?.length ?? 0,
      sub: `${myRequests?.filter((r: any) => r.status === 'PENDING').length ?? 0} pending`,
      icon: FileText, color: 'text-blue-500', bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      to: '/dashboard/requests',
    },
    {
      label: 'My Campaigns',
      value: myCampaigns?.length ?? 0,
      sub: `${myCampaigns?.filter((c: any) => c.status === 'ACTIVE').length ?? 0} active`,
      icon: Target, color: 'text-amber-500', bg: isDark ? 'bg-amber-900/30' : 'bg-amber-50',
      to: '/dashboard/campaigns',
    },
  ];

  const h2 = cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-gray-900');

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-hero rounded-3xl p-7 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('/Adama-City.jpg')" }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">{t('dashboard.welcome')}</p>
          <h1 className="text-2xl font-extrabold mb-1">{user?.firstName} {user?.lastName} 👋</h1>
          <p className="text-white/60 text-sm mb-5 capitalize">{user?.role?.toLowerCase().replace(/_/g,' ')}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/donate">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Donate Now
              </Button>
            </Link>
            <Link to="/dashboard/requests">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                variant="outline" leftIcon={<Plus className="w-4 h-4" />}>
                Post Request
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Admin alert */}
      {isAdmin && adminStats && (adminStats.pendingRequests > 0 || adminStats.pendingCampaigns > 0) && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className={cn('flex items-center gap-4 p-4 rounded-2xl border',
            isDark ? 'bg-amber-900/20 border-amber-700/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800')}>
          <Bell className="w-5 h-5 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Pending approvals: </span>
            {adminStats.pendingRequests > 0 && `${adminStats.pendingRequests} support request${adminStats.pendingRequests > 1 ? 's' : ''}`}
            {adminStats.pendingRequests > 0 && adminStats.pendingCampaigns > 0 && ' · '}
            {adminStats.pendingCampaigns > 0 && `${adminStats.pendingCampaigns} campaign${adminStats.pendingCampaigns > 1 ? 's' : ''}`}
          </div>
          <Link to="/admin/requests">
            <Button size="sm" variant="secondary">Review</Button>
          </Link>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}>
            <Link to={s.to}>
              <Card hover className="flex items-center gap-4 p-5">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                  <s.icon className={cn('w-6 h-6', s.color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-gray-500')}>{s.label}</p>
                  <p className={cn('text-xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{s.value}</p>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>{s.sub}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Two-column: recent donations + recent requests */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Donations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={h2}>Recent Donations</h2>
            <Link to="/dashboard/donations" className="text-xs text-green-500 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {myDonations?.slice(0, 4).map((d: any) => (
              <Card key={d.id} className="flex items-center gap-3 p-4">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  isDark ? 'bg-green-900/40' : 'bg-green-50')}>
                  <Heart className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-800')}>
                    {d.supportRequest?.title || d.campaign?.title || d.donationType}
                  </p>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>{formatDate(d.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-500">{d.amount ? formatCurrency(d.amount) : '—'}</p>
                  <Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge>
                </div>
              </Card>
            )) ?? (
              <Card className="text-center py-10">
                <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-gray-400')}>No donations yet</p>
                <Link to="/donate"><Button size="sm" className="mt-3">Donate Now</Button></Link>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={h2}>My Requests</h2>
            <Link to="/dashboard/requests" className="text-xs text-green-500 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {myRequests?.slice(0, 4).map((req: any) => (
              <Card key={req.id} className="flex items-center gap-3 p-4">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  isDark ? 'bg-blue-900/40' : 'bg-blue-50')}>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-800')}>{req.title}</p>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>{formatDate(req.createdAt)}</p>
                </div>
                <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
              </Card>
            )) ?? (
              <Card className="text-center py-10">
                <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-gray-400')}>No requests yet</p>
                <Link to="/dashboard/requests"><Button size="sm" className="mt-3">Post Request</Button></Link>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* My Campaigns */}
      {myCampaigns && myCampaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={h2}>My Campaigns</h2>
            <Link to="/dashboard/campaigns" className="text-xs text-green-500 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {myCampaigns.slice(0, 2).map((camp: any) => {
              const pct = Math.min((camp.raisedAmount / camp.goalAmount) * 100, 100);
              return (
                <Card key={camp.id} className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className={cn('text-sm font-bold flex-1', isDark ? 'text-white' : 'text-gray-900')}>{camp.title}</p>
                    <Badge variant={statusVariant(camp.status)}>{camp.status}</Badge>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-500 font-medium">{formatCurrency(camp.raisedAmount)}</span>
                      <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{Math.round(pct)}%</span>
                    </div>
                    <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>
                    Goal: {formatCurrency(camp.goalAmount)}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
