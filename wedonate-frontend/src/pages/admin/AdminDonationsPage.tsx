import { useQuery } from '@tanstack/react-query';
import { Heart, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function AdminDonationsPage() {
  const { data: donations, isLoading } = useQuery({
    queryKey: ['all-donations'],
    queryFn: () => api.get('/donations', { params: { limit: 50 } }).then(r => r.data.data),
  });

  const total = donations?.reduce((s: number, d: any) => s + (d.amount || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">All Donations</h1>
          <p className="text-sm text-gray-500 mt-1">{donations?.length ?? 0} successful donations</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-2xl px-5 py-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Total Raised</p>
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
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No donations yet</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Donor</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {donations.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {d.isAnonymous ? (
                        <span className="text-gray-400 italic">Anonymous</span>
                      ) : (
                        `${d.donor?.firstName ?? ''} ${d.donor?.lastName ?? ''}`
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-green-700">
                      {d.amount ? formatCurrency(d.amount) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{d.donationType}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(d.createdAt)}</td>
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
