import { useQuery } from '@tanstack/react-query';
import { Users, Heart, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

export default function StatsBar() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  const { data } = useQuery({
    queryKey: ['donation-stats'],
    queryFn: () => api.get('/donations/stats').then(r => r.data.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // Only render for logged-in users
  if (!isAuthenticated || !data) return null;

  const stats = [
    { icon: Heart,       label: 'Donations',       value: data.totalDonations   ?? 0,  format: (v: number) => v.toLocaleString() },
    { icon: TrendingUp,  label: 'Total Raised',    value: data.totalAmount      ?? 0,  format: (v: number) => formatCurrency(v) },
    { icon: CheckCircle, label: 'Requests Helped', value: data.fulfilledRequests ?? 0, format: (v: number) => v.toLocaleString() },
  ];

  return (
    <div className={cn(
      'w-full border-b transition-colors duration-300',
      isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-green-700 border-green-800',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center sm:justify-between flex-wrap gap-x-6 gap-y-1 py-1.5">
          {stats.map(({ icon: Icon, label, value, format }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className={cn('w-3.5 h-3.5', isDark ? 'text-green-400' : 'text-green-200')} />
              <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-green-100')}>
                {label}:
              </span>
              <span className={cn('text-xs font-bold', isDark ? 'text-white' : 'text-white')}>
                {format(value)}
              </span>
            </div>
          ))}

          <div className={cn('text-xs', isDark ? 'text-slate-500' : 'text-green-200')}>
            Live statistics · Adama City
          </div>
        </div>
      </div>
    </div>
  );
}
