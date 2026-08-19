import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Heart, TrendingUp, AlertCircle, BarChart3, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
  });
  const { isDark } = useTheme();

  const statCards = stats ? [
    { label: 'Total Users',       value: stats.totalUsers,              icon: Users,       color: 'text-blue-500',   bg: 'bg-blue-50',   trend: '' },
    { label: 'Total Donations',   value: stats.totalDonations,          icon: Heart,       color: 'text-green-500',  bg: 'bg-green-50',  trend: '' },
    { label: 'Total Raised',      value: formatCurrency(stats.totalAmount), icon: TrendingUp, color: 'text-amber-500',  bg: 'bg-amber-50',  trend: '' },
    { label: 'Total Campaigns',   value: stats.totalCampaigns,          icon: BarChart3,   color: 'text-indigo-500', bg: 'bg-indigo-50', trend: '' },
    { label: 'Pending Requests',  value: stats.pendingRequests,         icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50', trend: '' },
    { label: 'Pending Campaigns', value: stats.pendingCampaigns,        icon: Clock,       color: 'text-red-500',    bg: 'bg-red-50',    trend: '' },
  ] : [];

  const th = cn('text-left px-5 py-3.5 font-semibold text-sm', isDark ? 'text-slate-400' : 'text-gray-600');
  const td = cn('px-5 py-3.5 text-sm', isDark ? 'text-slate-300' : 'text-gray-700');

  return (
    <div className="space-y-8">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Admin Dashboard</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Overview of WeDonate platform activity</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={cn('h-28 rounded-2xl animate-pulse', isDark ? 'bg-slate-700' : 'bg-gray-100')} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                    isDark ? `${s.bg}/20` : s.bg)}>
                    <s.icon className={cn('w-5 h-5', s.color)} />
                  </div>
                  {s.trend && (
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                      isDark ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-50')}>
                      {s.trend}
                    </span>
                  )}
                </div>
                <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{s.value}</p>
                <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div>
        <h2 className={cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Recent Donations</h2>
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={cn('border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100')}>
                <tr>
                  <th className={th}>Donor</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Type</th>
                  <th className={th}>Date</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-50')}>
                {stats?.recentDonations?.map((d: any) => (
                  <tr key={d.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50')}>
                    <td className={cn(td, 'font-medium')}>
                      {d.isAnonymous ? <span className="italic opacity-50">Anonymous</span> : `${d.donor?.firstName} ${d.donor?.lastName}`}
                    </td>
                    <td className={cn(td, 'font-bold text-green-500')}>{d.amount ? formatCurrency(d.amount) : '—'}</td>
                    <td className={td}>{d.donationType}</td>
                    <td className={cn(td, 'opacity-70')}>{formatDate(d.createdAt)}</td>
                    <td className={td}><Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge></td>
                  </tr>
                )) ?? (
                  <tr><td colSpan={5} className={cn('text-center py-10', isDark ? 'text-slate-500' : 'text-gray-400')}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
