import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function MyDonationsPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { data: donations, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => api.get('/donations/my').then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>My Donations</h1>
        <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>{donations?.length ?? 0} total</span>
      </div>

      {!donations?.length ? (
        <Card className="text-center py-16">
          <Heart className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className={cn('font-medium', isDark ? 'text-slate-400' : 'text-gray-400')}>No donations yet</p>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-500' : 'text-gray-300')}>Your donation history will appear here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((d: any) => (
            <Card key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
              <div className="shrink-0">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                    isDark ? 'bg-green-900/40' : 'bg-green-50')}>
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-800')}>{d.donationType} Donation</p>
                  {d.isAnonymous && <span className={cn('text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500')}>Anonymous</span>}
                </div>
                {d.description && <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-gray-500')}>{d.description}</p>}
                <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-gray-400')}>{formatDate(d.createdAt)}</p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                <p className="text-base font-bold text-green-700">
                  {d.amount ? formatCurrency(d.amount) : 'In-kind'}
                </p>
                <Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge>
              </div>
              {d.chapaRef && (
                <p className={cn('text-xs font-mono hidden xl:block', isDark ? 'text-slate-600' : 'text-gray-300')}>{d.chapaRef.slice(0,16)}…</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
