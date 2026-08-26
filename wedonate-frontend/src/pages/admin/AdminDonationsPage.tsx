import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, TrendingUp, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

type StatusTab = 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED';

export default function AdminDonationsPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();

  const { data: donations, isLoading } = useQuery({
    queryKey: ['admin-donations', statusTab],
    queryFn: () => api.get('/admin/donations', { params: { status: statusTab === 'ALL' ? undefined : statusTab, limit: 100 } }).then(r => r.data.data),
  });

  const verifyDonation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/donations/${id}/verify`),
    onSuccess: () => { toast.success('Donation verified'); qc.invalidateQueries({ queryKey: ['admin-donations'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const rejectDonation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/admin/donations/${id}/reject`, { reason }),
    onSuccess: () => { toast.success('Donation rejected'); qc.invalidateQueries({ queryKey: ['admin-donations'] }); setRejectId(null); setRejectReason(''); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const total = donations?.reduce((s: number, d: any) => s + (d.amount || 0), 0) ?? 0;

  const exportCSV = () => {
    if (!donations?.length) return;
    const headers = ['Donor', 'Target', 'Amount', 'Currency', 'Type', 'Payment Method', 'Reference Code', 'Status', 'Date'];
    const rows = donations.map((d: any) => [
      d.isAnonymous ? 'Anonymous' : `${d.donor?.firstName} ${d.donor?.lastName}`,
      d.campaign ? `Campaign: ${d.campaign.title}` : (d.supportRequest ? `Support Request: ${d.supportRequest.title}` : 'General'),
      d.amount || 0, d.currency, d.donationType, d.paymentMethod || 'N/A',
      d.referenceCode || d.chapaRef || 'N/A', d.paymentStatus,
      new Date(d.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `donations-${statusTab}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('admin.all_donations')}</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{donations?.length ?? 0} {t('admin.successful_donations')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 rounded-2xl px-5 py-3',
            isDark ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-100')}>
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{t('admin.total_raised_label')}</p>
              <p className="text-lg font-extrabold text-green-700">{formatCurrency(total)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {(['ALL','PENDING','SUCCESS','FAILED'] as StatusTab[]).map(s => (
          <button key={s} onClick={() => setStatusTab(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusTab === s
                ? 'bg-green-700 text-white'
                : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'))}>
            {s}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectId(null)} />
          <Card className="relative z-10 w-full max-w-md p-6">
            <h3 className={cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Reject Donation</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Reason for rejection..."
              className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 mb-4',
                isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => rejectDonation.mutate({ id: rejectId, reason: rejectReason })}
                isLoading={rejectDonation.isPending} disabled={!rejectReason.trim()}>
                Confirm Reject
              </Button>
              <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason(''); }}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !donations?.length ? (
        <Card className="text-center py-16">
          <Heart className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className={cn('font-medium', isDark ? 'text-slate-400' : 'text-gray-400')}>{t('admin.no_donations')}</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={cn('border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100')}>
                <tr>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.donor')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Target</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.amount')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.type')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Method</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Ref Code</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.date')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.status')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Actions</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-50')}>
                {donations.map((d: any) => (
                  <tr key={d.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50')}>
                    <td className={cn('px-5 py-3.5 font-medium', isDark ? 'text-white' : 'text-gray-800')}>
                      {d.isAnonymous ? (
                        <span className={cn('italic', isDark ? 'text-slate-500' : 'text-gray-400')}>{t('admin.anonymous')}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold',
                            isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                            {d.donor?.firstName?.[0]}
                          </div>
                          {d.donor?.firstName ?? ''} {d.donor?.lastName ?? ''}
                        </div>
                      )}
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                      {d.campaign ? (
                        <div className="flex flex-col">
                          <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-indigo-400' : 'text-indigo-600')}>Campaign</span>
                          <span className="font-medium truncate max-w-[150px]" title={d.campaign.title}>{d.campaign.title}</span>
                        </div>
                      ) : d.supportRequest ? (
                        <div className="flex flex-col">
                          <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-blue-400' : 'text-blue-600')}>Support Request</span>
                          <span className="font-medium truncate max-w-[150px]" title={d.supportRequest.title}>{d.supportRequest.title}</span>
                        </div>
                      ) : (
                        <span className={cn('text-xs italic', isDark ? 'text-slate-500' : 'text-gray-400')}>General</span>
                      )}
                    </td>
                    <td className={cn('px-5 py-3.5 font-bold text-green-700')}>{d.amount ? formatCurrency(d.amount) : '—'}</td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-300' : 'text-gray-600')}>{d.donationType}</td>
                    <td className={cn('px-5 py-3.5 text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{d.paymentMethod || 'N/A'}</td>
                    <td className={cn('px-5 py-3.5 font-mono text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{d.referenceCode || d.chapaRef || '—'}</td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3.5"><Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {d.paymentStatus !== 'SUCCESS' && (
                          <button onClick={() => verifyDonation.mutate(d.id)}
                            className={cn('flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                              isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100')}
                            title="Approve">
                            <span className="text-lg font-bold">✓</span>
                          </button>
                        )}
                        {d.paymentStatus !== 'FAILED' && (
                          <button onClick={() => setRejectId(d.id)}
                            className={cn('flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                              isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100')}
                            title="Reject">
                            <span className="text-lg font-bold">✕</span>
                          </button>
                        )}
                      </div>
                      {d.paymentStatus === 'FAILED' && d.rejectionReason && (
                        <p className={cn('text-[10px] mt-1', isDark ? 'text-red-400' : 'text-red-500')}>{d.rejectionReason}</p>
                      )}
                      {d.paymentStatus === 'SUCCESS' && d.verifiedAt && (
                        <p className={cn('text-[10px] mt-1', isDark ? 'text-green-400' : 'text-green-600')}>Verified {formatDate(d.verifiedAt)}</p>
                      )}
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
