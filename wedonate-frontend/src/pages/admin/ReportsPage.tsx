import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, BarChart3 } from 'lucide-react';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

type Period = 'month' | 'quarter' | 'year' | 'all';
type Category = 'ALL' | 'MONEY' | 'FOOD' | 'CLOTHES' | 'MEDICINE' | 'OTHER';

export default function ReportsPage() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<Period>('all');
  const [category, setCategory] = useState<Category>('ALL');

  const { data: donations, isLoading } = useQuery({
    queryKey: ['admin-donations', 'ALL'],
    queryFn: () => api.get('/admin/donations', { params: { limit: 500 } }).then(r => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
  });

  const filtered = useMemo(() => {
    if (!donations) return [];
    let items = donations.filter((d: any) => d.paymentStatus === 'SUCCESS');
    const now = new Date();
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      items = items.filter((d: any) => new Date(d.createdAt) >= start);
    } else if (period === 'quarter') {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      items = items.filter((d: any) => new Date(d.createdAt) >= start);
    } else if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      items = items.filter((d: any) => new Date(d.createdAt) >= start);
    }
    if (category !== 'ALL') items = items.filter((d: any) => d.donationType === category);
    return items;
  }, [donations, period, category]);

  const totalAmount = filtered.reduce((s: number, d: any) => s + (d.amount || 0), 0);
  const totalCount = filtered.length;

  const donorMap = new Map<string, { name: string; total: number; count: number }>();
  filtered.forEach((d: any) => {
    if (d.isAnonymous || !d.donor) return;
    const key = d.donorId;
    const existing = donorMap.get(key) || { name: `${d.donor.firstName} ${d.donor.lastName}`, total: 0, count: 0 };
    existing.total += d.amount || 0;
    existing.count += 1;
    donorMap.set(key, existing);
  });
  const topDonors = Array.from(donorMap.values()).sort((a, b) => b.total - a.total).slice(0, 10);

  const categoryBreakdown = new Map<string, { count: number; total: number }>();
  filtered.forEach((d: any) => {
    const existing = categoryBreakdown.get(d.donationType) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += d.amount || 0;
    categoryBreakdown.set(d.donationType, existing);
  });

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Donor', 'Amount', 'Currency', 'Type', 'Method', 'Status', 'Date'];
    const rows = filtered.map((d: any) => [
      d.isAnonymous ? 'Anonymous' : `${d.donor?.firstName} ${d.donor?.lastName}`,
      d.amount || 0, d.currency, d.donationType, d.paymentMethod || 'N/A', d.paymentStatus, new Date(d.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report-${period}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Reports</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Donation reports by period, category, and donor.</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800">
          {(['month','quarter','year','all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                period === p ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
              {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : p === 'quarter' ? 'Last 3 Months' : 'This Year'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800">
          {(['ALL','MONEY','FOOD','CLOTHES','MEDICINE','OTHER'] as Category[]).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                category === c ? 'bg-amber-500 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className={cn('text-xs mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Total Donations</p>
          <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{totalCount}</p>
        </Card>
        <Card className="p-5">
          <p className={cn('text-xs mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Total Amount</p>
          <p className="text-2xl font-extrabold text-green-700">{formatCurrency(totalAmount)}</p>
        </Card>
        <Card className="p-5">
          <p className={cn('text-xs mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Average Donation</p>
          <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
            {totalCount > 0 ? formatCurrency(totalAmount / totalCount) : '—'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card className="p-5">
          <h3 className={cn('font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>By Category</h3>
          <div className="space-y-3">
            {Array.from(categoryBreakdown.entries()).map(([cat, data]) => (
              <div key={cat} className="flex items-center gap-3">
                <Badge variant="info">{cat}</Badge>
                <div className="flex-1">
                  <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${(data.total / Math.max(totalAmount, 1)) * 100}%` }} />
                  </div>
                </div>
                <span className={cn('text-xs font-bold w-24 text-right', isDark ? 'text-slate-300' : 'text-gray-700')}>
                  {formatCurrency(data.total)}
                </span>
              </div>
            ))}
            {categoryBreakdown.size === 0 && (
              <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-gray-400')}>No data</p>
            )}
          </div>
        </Card>

        {/* Top Donors */}
        <Card className="p-5">
          <h3 className={cn('font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Top Donors</h3>
          <div className="space-y-3">
            {topDonors.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={cn('text-xs font-bold w-6', isDark ? 'text-slate-500' : 'text-gray-400')}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-800')}>{d.name}</p>
                  <p className={cn('text-[10px]', isDark ? 'text-slate-500' : 'text-gray-400')}>{d.count} donations</p>
                </div>
                <span className="text-sm font-bold text-green-700">{formatCurrency(d.total)}</span>
              </div>
            ))}
            {topDonors.length === 0 && (
              <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-gray-400')}>No donor data</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
