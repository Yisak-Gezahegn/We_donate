import { useQuery } from '@tanstack/react-query';
import { Heart, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function AdminDonationsPage() {
  const { isDark } = useTheme();
  const { data: donations, isLoading } = useQuery({
    queryKey: ['all-donations'],
    queryFn: () => api.get('/donations', { params: { limit: 50 } }).then(r => r.data.data),
  });

  const total = donations?.reduce((s: number, d: any) => s + (d.amount || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>All Donations</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{donations?.length ?? 0} successful donations</p>
        </div>
        <div className={cn('flex items-center gap-2 rounded-2xl px-5 py-3',
          isDark ? 'bg-green-900/30 border border-green-800/40' : 'bg-green-50 border border-green-100')}>
          <TrendingUp className="w-5 h-5 text-green-600" />
          <div>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>Total Raised</p>
            <p className="text-lg font-extrabold text-green-700">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !donations?.length ? (
        <Card className="text-center py-16">
          <Heart className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className={cn('font-medium', isDark ? 'text-slate-400' : 'text-gray-400')}>No donations yet</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={cn('border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100')}>
                <tr>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Donor</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Amount</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Type</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Date</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Status</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-50')}>
                {donations.map((d: any) => (
                  <tr key={d.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50')}>
                    <td className={cn('px-5 py-3.5 font-medium', isDark ? 'text-slate-200' : 'text-gray-800')}>
                      {d.isAnonymous ? (
                        <span className={isDark ? 'text-slate-500 italic' : 'text-gray-400 italic'}>Anonymous</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {d.donor?.profileImage ? (
                            <img src={d.donor.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold',
                              isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                              {d.donor?.firstName?.[0]}
                            </div>
                          )}
                          {d.donor?.firstName ?? ''} {d.donor?.lastName ?? ''}
                        </div>
                      )}
                    </td>
                    <td className={cn('px-5 py-3.5 font-bold text-green-700')}>
                      {d.amount ? formatCurrency(d.amount) : '—'}
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-300' : 'text-gray-600')}>{d.donationType}</td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
