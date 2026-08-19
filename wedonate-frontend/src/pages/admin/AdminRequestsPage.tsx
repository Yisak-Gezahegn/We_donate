import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Eye, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

type ViewMode = 'requests' | 'campaigns';

function DetailRow({ label, value, isDark }: { label: string; value?: string | null; isDark: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className={cn('text-xs font-semibold w-32 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>{label}</span>
      <span className={cn('text-xs flex-1', isDark ? 'text-slate-200' : 'text-gray-800')}>{value}</span>
    </div>
  );
}

function AccountInfo({ data, isDark }: { data: any; isDark: boolean }) {
  const accounts = [
    { label: 'TeleBirr', value: data.telebirrAccount },
    { label: 'CBE', value: data.cbeAccount },
    { label: 'BOA', value: data.boaAccount },
    { label: 'Awash', value: data.awashAccount },
    { label: data.otherBankName || 'Other Bank', value: data.otherBankAccount },
  ].filter(a => a.value);
  if (!accounts.length) return <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>None provided</span>;
  return (
    <div className="space-y-1">
      {accounts.map(a => (
        <div key={a.label} className={cn('text-xs px-2 py-1 rounded-lg flex justify-between',
          isDark ? 'bg-slate-700' : 'bg-gray-100')}>
          <span className="font-semibold">{a.label}:</span>
          <span className="font-mono">{a.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminRequestsPage() {
  const qc = useQueryClient();
  const { isDark } = useTheme();
  const [view, setView] = useState<ViewMode>('requests');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: requests, isLoading: loadingReqs } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => api.get('/support-requests/all').then(r => r.data.data),
  });
  const { data: campaigns, isLoading: loadingCamps } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => api.get('/campaigns/all').then(r => r.data.data),
  });

  const updateReq = useMutation({
    mutationFn: ({ id, status, adminNote }: any) => api.patch(`/support-requests/${id}/status`, { status, adminNote }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-requests'] }); },
    onError: () => toast.error('Failed'),
  });
  const updateCamp = useMutation({
    mutationFn: ({ id, status, adminNote }: any) => api.patch(`/campaigns/${id}/status`, { status, adminNote }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-campaigns'] }); },
    onError: () => toast.error('Failed'),
  });

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id);

  const ItemCard = ({ item, type }: { item: any; type: 'requests' | 'campaigns' }) => {
    const isOpen = expanded === item.id;
    const mutate = type === 'requests' ? updateReq : updateCamp;

    return (
      <Card key={item.id} className="overflow-hidden">
        {/* Main row */}
        <div className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{item.title}</h3>
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                {item.category && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600')}>
                    {item.category}
                  </span>
                )}
                {item.urgencyLevel && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                    Urgency {item.urgencyLevel}/5
                  </span>
                )}
              </div>

              <p className={cn('text-xs line-clamp-2 mb-2', isDark ? 'text-slate-400' : 'text-gray-600')}>{item.description}</p>

              <div className="flex items-center gap-3 text-xs">
                {item.user?.profileImage ? (
                  <img src={item.user.profileImage} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-[9px]">
                    {item.user?.firstName?.[0]}
                  </div>
                )}
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                  {item.user?.firstName} {item.user?.lastName} · {item.user?.email}
                </span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>·</span>
                <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{formatDate(item.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleExpand(item.id)}
                className={cn('flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <Eye className="w-3.5 h-3.5" />
                {isOpen ? 'Hide' : 'View Details'}
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Admin note + actions */}
          {item.status === 'PENDING' && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <textarea placeholder="Admin note (optional)..." value={notes[item.id] || ''} rows={2}
                  onChange={e => setNotes(p => ({ ...p, [item.id]: e.target.value }))}
                  className={cn('flex-1 rounded-xl border px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200')} />
                <div className="flex gap-2">
                  <Button size="sm" leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    isLoading={mutate.isPending}
                    onClick={() => mutate.mutate({ id: item.id, status: 'APPROVED', adminNote: notes[item.id] })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => mutate.mutate({ id: item.id, status: 'REJECTED', adminNote: notes[item.id] })}>
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}

          {item.adminNote && (
            <div className={cn('mt-3 text-xs px-3 py-2 rounded-lg',
              isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
              <span className="font-semibold">Admin note: </span>{item.adminNote}
            </div>
          )}
        </div>

        {/* Expanded details */}
        {isOpen && (
          <div className={cn('px-5 pb-5 border-t space-y-4', isDark ? 'border-slate-700 bg-slate-700/30' : 'border-gray-100 bg-gray-50/50')}>
            <p className={cn('text-xs font-bold pt-4 mb-3', isDark ? 'text-slate-300' : 'text-gray-600')}>
              FULL DETAILS (Admin Only)
            </p>

            {/* Request image */}
            {item.imageUrl && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Request Photo</p>
                <img src={item.imageUrl} alt="Request" className="rounded-xl max-h-48 object-cover w-full" />
              </div>
            )}

            {/* Support letter */}
            {item.supportLetterUrl && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Support Letter</p>
                <a href={item.supportLetterUrl} target="_blank" rel="noopener noreferrer">
                  <img src={item.supportLetterUrl} alt="Support Letter"
                    className="rounded-xl max-h-64 object-contain w-full border cursor-pointer hover:opacity-90 transition-opacity"
                    onError={e => (e.currentTarget.style.display='none')} />
                  <span className={cn('flex items-center gap-1 text-xs mt-1', isDark ? 'text-blue-400' : 'text-blue-600')}>
                    <ExternalLink className="w-3 h-3" /> Open full image
                  </span>
                </a>
              </div>
            )}

            {/* National ID */}
            {item.nationalIdUrl && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>National ID</p>
                <img src={item.nationalIdUrl} alt="National ID"
                  className="rounded-xl max-h-40 object-contain w-full border" />
              </div>
            )}

            {/* Registration doc (campaigns) */}
            {item.registrationUrl && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Organization Registration</p>
                <img src={item.registrationUrl} alt="Registration"
                  className="rounded-xl max-h-40 object-contain w-full border" />
              </div>
            )}

            {/* Info fields */}
            <div className={cn('rounded-xl p-4 space-y-2', isDark ? 'bg-slate-800' : 'bg-white border')}>
              <DetailRow label="Location" value={item.location} isDark={isDark} />
              <DetailRow label="Family Size" value={item.familySize ? `${item.familySize} people` : null} isDark={isDark} />
              <DetailRow label="Goal Amount" value={item.goalAmount ? formatCurrency(item.goalAmount) : null} isDark={isDark} />
              <DetailRow label="Additional Notes" value={item.additionalNotes} isDark={isDark} />
              <DetailRow label="Phone" value={item.user?.phone} isDark={isDark} />
            </div>

            {/* Payment accounts */}
            <div>
              <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Payment Accounts</p>
              <AccountInfo data={item} isDark={isDark} />
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Approvals</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Review and approve support requests and campaigns
          </p>
        </div>
        <div className={cn('flex gap-1 p-1 rounded-xl', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
          {(['requests','campaigns'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize',
                view === v ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
              {v} ({v === 'requests'
                ? requests?.filter((r: any) => r.status === 'PENDING').length ?? 0
                : campaigns?.filter((c: any) => c.status === 'PENDING').length ?? 0})
            </button>
          ))}
        </div>
      </div>

      {view === 'requests' && (
        loadingReqs ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !requests?.length ? (
          <Card className="text-center py-16 text-gray-400">No support requests found</Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req: any) => <ItemCard key={req.id} item={req} type="requests" />)}
          </div>
        )
      )}

      {view === 'campaigns' && (
        loadingCamps ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !campaigns?.length ? (
          <Card className="text-center py-16 text-gray-400">No campaigns found</Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((camp: any) => <ItemCard key={camp.id} item={camp} type="campaigns" />)}
          </div>
        )
      )}
    </div>
  );
}
