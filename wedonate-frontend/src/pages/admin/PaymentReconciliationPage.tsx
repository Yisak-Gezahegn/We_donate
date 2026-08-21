import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function PaymentReconciliationPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pending-donations'],
    queryFn: () => api.get('/admin/donations/pending').then(r => r.data.data),
  });

  const verifyDonation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/donations/${id}/verify`),
    onSuccess: () => { toast.success('Payment verified and confirmed'); qc.invalidateQueries({ queryKey: ['pending-donations'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const rejectDonation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/admin/donations/${id}/reject`, { reason }),
    onSuccess: () => { toast.success('Payment rejected'); qc.invalidateQueries({ queryKey: ['pending-donations'] }); setRejectId(null); setRejectReason(''); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const filtered = pending?.filter((d: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (d.donor?.firstName?.toLowerCase().includes(s) || d.donor?.lastName?.toLowerCase().includes(s) ||
      d.donor?.email?.toLowerCase().includes(s) || d.referenceCode?.toLowerCase().includes(s) || d.chapaRef?.toLowerCase().includes(s));
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Payment Reconciliation</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          Verify or reject pending donations against bank statements. {filtered.length} pending.
        </p>
      </div>

      <Input placeholder="Search by donor name, email, or reference code..." leftIcon={<Search className="w-4 h-4" />}
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectId(null)} />
          <Card className="relative z-10 w-full max-w-md p-6">
            <h3 className={cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Reject Payment</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="Enter reason for rejection (e.g., no matching bank transaction)..."
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
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !filtered.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <CheckCircle className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-green-600' : 'text-green-400')} />
          <p className="font-medium">All payments are reconciled</p>
          <p className="text-xs mt-1">No pending donations to verify.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((d: any) => (
            <Card key={d.id} className="overflow-hidden">
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Donor info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                      isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                      {d.donor?.firstName?.[0]}{d.donor?.lastName?.[0]}
                    </div>
                    <div>
                      <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                        {d.donor?.firstName} {d.donor?.lastName}
                      </p>
                      <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{d.donor?.email} · {d.donor?.phone}</p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-green-700">{formatCurrency(d.amount || 0)}</p>
                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{d.paymentMethod || 'N/A'} · {formatDate(d.createdAt)}</p>
                  </div>
                </div>

                {/* Reference info */}
                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className={cn('rounded-lg p-3', isDark ? 'bg-slate-700' : 'bg-gray-50')}>
                    <p className={cn('text-[10px] font-semibold mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Transaction Ref</p>
                    <p className={cn('text-xs font-mono font-bold', isDark ? 'text-white' : 'text-gray-900')}>{d.chapaRef || '—'}</p>
                  </div>
                  <div className={cn('rounded-lg p-3', isDark ? 'bg-slate-700' : 'bg-gray-50')}>
                    <p className={cn('text-[10px] font-semibold mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Bank Reference</p>
                    <p className={cn('text-xs font-mono font-bold', isDark ? 'text-white' : 'text-gray-900')}>{d.referenceCode || '—'}</p>
                  </div>
                  <div className={cn('rounded-lg p-3', isDark ? 'bg-slate-700' : 'bg-gray-50')}>
                    <p className={cn('text-[10px] font-semibold mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Target</p>
                    <p className={cn('text-xs font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {d.supportRequest?.title || d.campaign?.title || '—'}
                    </p>
                  </div>
                  <div className={cn('rounded-lg p-3', isDark ? 'bg-slate-700' : 'bg-gray-50')}>
                    <p className={cn('text-[10px] font-semibold mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Type</p>
                    <p className={cn('text-xs font-bold', isDark ? 'text-white' : 'text-gray-900')}>{d.donationType}</p>
                  </div>
                </div>

                {/* Payment proof */}
                {d.paymentProofUrl && (
                  <div className="mt-3">
                    <a href={d.paymentProofUrl} target="_blank" rel="noopener noreferrer"
                      className={cn('inline-flex items-center gap-1 text-xs font-semibold', isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700')}>
                      <ExternalLink className="w-3 h-3" /> View Payment Proof
                    </a>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                  <Button size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}
                    isLoading={verifyDonation.isPending}
                    onClick={() => verifyDonation.mutate(d.id)}>
                    Verify & Confirm
                  </Button>
                  <Button size="sm" variant="danger" leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => setRejectId(d.id)}>
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
