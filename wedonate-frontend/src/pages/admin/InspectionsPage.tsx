import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function InspectionsPage() {
  const { isDark } = useTheme();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ supportRequestId: '', campaignId: '', findings: '', recommendation: '' });
  const qc = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['inspections', statusFilter],
    queryFn: () => api.get('/admin/inspections', { params: { status: statusFilter || undefined } }).then(r => r.data.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/inspections/${id}/resolve`),
    onSuccess: () => { toast.success('Inspection resolved'); qc.invalidateQueries({ queryKey: ['inspections'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/inspections', data),
    onSuccess: () => { toast.success('Inspection report created'); qc.invalidateQueries({ queryKey: ['inspections'] }); setShowCreate(false); setForm({ supportRequestId: '', campaignId: '', findings: '', recommendation: '' }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Inspection Reports</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{reports?.length ?? 0} reports</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Report</Button>
      </div>

      <div className="flex gap-2">
        {['', 'PENDING', 'RESOLVED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === s ? 'bg-green-700 text-white'
                : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'))}>
            {s || 'ALL'}
          </button>
        ))}
      </div>

      {showCreate && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>Create Inspection Report</h3>
            <button onClick={() => setShowCreate(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <Input label="Support Request ID (optional)" value={form.supportRequestId} onChange={e => setForm(p => ({ ...p, supportRequestId: e.target.value }))} />
            <Input label="Campaign ID (optional)" value={form.campaignId} onChange={e => setForm(p => ({ ...p, campaignId: e.target.value }))} />
            <div>
              <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Findings *</label>
              <textarea value={form.findings} onChange={e => setForm(p => ({ ...p, findings: e.target.value }))} rows={4}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
            </div>
            <Input label="Recommendation" value={form.recommendation} onChange={e => setForm(p => ({ ...p, recommendation: e.target.value }))} />
            <Button onClick={() => createMutation.mutate(form)} isLoading={createMutation.isPending}
              disabled={!form.findings.trim() || (!form.supportRequestId && !form.campaignId)}>
              Submit Report
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !reports?.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>No inspection reports</Card>
      ) : (
        <div className="space-y-4">
          {reports.map((r: any) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    {r.supportRequest && <Badge variant="info">Request: {r.supportRequest.title}</Badge>}
                    {r.campaign && <Badge variant="info">Campaign: {r.campaign.title}</Badge>}
                  </div>
                  <p className={cn('text-sm mb-2', isDark ? 'text-slate-300' : 'text-gray-700')}>{r.findings}</p>
                  {r.recommendation && (
                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
                      <span className="font-semibold">Recommendation:</span> {r.recommendation}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                      Inspector: {r.inspector?.firstName} {r.inspector?.lastName}
                    </span>
                    <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>·</span>
                    <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {r.status === 'PENDING' && (
                    <Button size="sm" leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      onClick={() => resolveMutation.mutate(r.id)} isLoading={resolveMutation.isPending}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
