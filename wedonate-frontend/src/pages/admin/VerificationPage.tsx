import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgeCheck, Search, FileText, Building2, MapPin, User, Phone, ExternalLink, X, Calendar, Shield, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Tab = 'pending' | 'approved' | 'rejected';

export default function VerificationPage() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ userId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();

  const { data: pendingOrgs, isLoading } = useQuery({
    queryKey: ['admin-pending-orgs'],
    queryFn: () => api.get('/admin/organizations/pending').then(r => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users', ''],
    queryFn: () => api.get('/admin/users').then(r => r.data.data),
  });

  const approveOrg = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/organizations/${userId}/approve`),
    onSuccess: (data) => {
      toast.success(data.data.message || 'Organization approved');
      qc.invalidateQueries({ queryKey: ['admin-pending-orgs'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const rejectOrg = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.patch(`/admin/organizations/${userId}/reject`, { reason }),
    onSuccess: (data) => {
      toast.success(data.data.message || 'Organization rejected');
      qc.invalidateQueries({ queryKey: ['admin-pending-orgs'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setRejectModal(null);
      setRejectReason('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const allOrgs = (users || []).filter((u: any) => ['NGO', 'ORGANIZATION', 'GOVERNMENTAL_ORG'].includes(u.role) && u.orgStatus);
  const approvedOrgs = allOrgs.filter((u: any) => u.orgStatus === 'APPROVED');
  const rejectedOrgs = allOrgs.filter((u: any) => u.orgStatus === 'REJECTED');
  const pendingCount = pendingOrgs?.length || 0;

  const getDisplayList = () => {
    if (tab === 'pending') return pendingOrgs || [];
    if (tab === 'approved') return approvedOrgs;
    return rejectedOrgs;
  };

  const displayList = getDisplayList().filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = u.orgName || `${u.firstName} ${u.lastName}`;
    return name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  const orgTypeLabel: Record<string, string> = {
    NGO: 'NGO', GOVERNMENTAL: 'Governmental', RELIGIOUS: 'Religious', PRIVATE_CHARITY: 'Private Charity',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Organization Verification</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          Review and verify organization registration requests.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className={cn('flex gap-1 p-1 rounded-xl', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
          <button onClick={() => setTab('pending')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'pending' ? 'bg-amber-500 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Pending ({pendingCount})
          </button>
          <button onClick={() => setTab('approved')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'approved' ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Approved ({approvedOrgs.length})
          </button>
          <button onClick={() => setTab('rejected')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'rejected' ? 'bg-red-600 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Rejected ({rejectedOrgs.length})
          </button>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search organizations..." leftIcon={<Search className="w-4 h-4" />}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !displayList.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <Building2 className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className="font-medium">
            {tab === 'pending' ? 'No pending organizations' : tab === 'approved' ? 'No approved organizations yet' : 'No rejected organizations'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayList.map((org: any) => (
            <Card key={org.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
                  tab === 'approved' && (isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'),
                  tab === 'rejected' && (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'),
                  tab === 'pending' && (isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'),
                )}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {org.orgName || `${org.firstName} ${org.lastName}`}
                    </h3>
                    <Badge variant={tab === 'approved' ? 'success' : tab === 'rejected' ? 'danger' : 'warning'}>
                      {tab === 'approved' ? 'Approved' : tab === 'rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                    {org.orgType && <Badge variant="info">{orgTypeLabel[org.orgType] || org.orgType}</Badge>}
                  </div>

                  {/* Org Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {org.orgName && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{org.orgName}</span>
                      </div>
                    )}
                    {org.firstName && org.lastName && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <User className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{org.firstName} {org.lastName}</span>
                      </div>
                    )}
                    {org.representativeName && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Shield className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Rep: {org.representativeName}</span>
                      </div>
                    )}
                    {org.email && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={cn('font-mono', isDark ? 'text-slate-400' : 'text-gray-500')}>{org.email}</span>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{org.phone}</span>
                      </div>
                    )}
                    {org.officeAddress && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{org.officeAddress}</span>
                      </div>
                    )}
                    {org.licenseNumber && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Hash className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>License: {org.licenseNumber}</span>
                      </div>
                    )}
                    {org.registrationExpiry && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Reg. Expiry: {formatDate(org.registrationExpiry)}</span>
                      </div>
                    )}
                    {org.licenseExpiry && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>License Expiry: {formatDate(org.licenseExpiry)}</span>
                      </div>
                    )}
                  </div>

                  {/* Document Link */}
                  {org.registrationDocUrl && (
                    <div className="mt-3">
                      <a href={org.registrationDocUrl} target="_blank" rel="noopener noreferrer"
                        className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                          isDark ? 'bg-slate-700 text-green-400 hover:bg-slate-600' : 'bg-green-50 text-green-700 hover:bg-green-100')}>
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Registration Document
                      </a>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {tab === 'rejected' && org.rejectionReason && (
                    <div className={cn('mt-3 p-2 rounded-lg text-xs', isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600')}>
                      Rejection reason: {org.rejectionReason}
                    </div>
                  )}

                  <p className={cn('text-[10px] mt-2', isDark ? 'text-slate-600' : 'text-gray-400')}>
                    Registered {formatDate(org.createdAt)}
                  </p>

                  {/* Action Buttons (pending only) */}
                  {tab === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm"
                        leftIcon={<BadgeCheck className="w-3.5 h-3.5" />}
                        onClick={() => approveOrg.mutate(org.id)}
                        isLoading={approveOrg.isPending}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger"
                        onClick={() => { setRejectModal({ userId: org.id, name: org.orgName || org.firstName }); setRejectReason(''); }}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className={cn('w-full max-w-md rounded-2xl shadow-2xl p-6',
              isDark ? 'bg-slate-800' : 'bg-white')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Reject Organization</h3>
              <button onClick={() => setRejectModal(null)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={cn('text-sm mb-3', isDark ? 'text-slate-400' : 'text-gray-500')}>
              You are about to reject <strong>{rejectModal.name}</strong>. Please provide a reason:
            </p>
            <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500',
                isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1"
                onClick={() => {
                  if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
                  rejectOrg.mutate({ userId: rejectModal.userId, reason: rejectReason.trim() });
                }}
                isLoading={rejectOrg.isPending}>
                Reject Organization
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
