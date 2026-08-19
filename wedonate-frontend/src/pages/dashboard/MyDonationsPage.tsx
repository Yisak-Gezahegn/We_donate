import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function MyDonationsPage() {
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
        <h1 className="text-2xl font-extrabold text-gray-900">My Donations</h1>
        <span className="text-sm text-gray-500">{donations?.length ?? 0} total</span>
      </div>

      {!donations?.length ? (
        <Card className="text-center py-16">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No donations yet</p>
          <p className="text-sm text-gray-300 mt-1">Your donation history will appear here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((d: any) => (
            <Card key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{d.donationType} Donation</p>
                  {d.isAnonymous && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Anonymous</span>}
                </div>
                {d.description && <p className="text-xs text-gray-500 truncate">{d.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatDate(d.createdAt)}</p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                <p className="text-base font-bold text-green-700">
                  {d.amount ? formatCurrency(d.amount) : 'In-kind'}
                </p>
                <Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge>
              </div>
              {d.chapaRef && (
                <p className="text-xs text-gray-300 font-mono hidden xl:block">{d.chapaRef.slice(0,16)}…</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
