import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BadgeCheck, Search, FileText, Building2, MapPin, User, Phone, ExternalLink, X, Calendar, Shield, Hash, Mail, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Tab = 'pending' | 'approved' | 'rejected';

const ORG_TYPE_LABELS: Record<string, string> = {
  NGO: 'NGO', GOVERNMENTAL: 'Governmental', RELIGIOUS: 'Religious', PRIVATE_CHARITY: 'Private Charity',
};

function InfoRow({ icon: Icon, label, value, isDark, href }: { icon: any; label: string; value?: string | null; isDark: boolean; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        isDark ? 'bg-slate-700' : 'bg-gray-100')}>
        <Icon className={cn('w-4 h-4', isDark ? 'text-slate-400' : 'text-gray-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-0.5', isDark ? 'text-slate-500' : 'text-gray-400')}>{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className={cn('text-sm font-medium flex items-center gap-1 hover:underline break-all', isDark ? 'text-blue-400' : 'text-blue-600')}>
            {value} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : (
          <p className={cn('text-sm font-medium break-words', isDark ? 'text-white' : 'text-gray-900')}>{value}</p>
        )}
      </div>
    </div>
  );
}

function OrgDetailModal({ org, status, onClose, onApprove, onReject, isApproving, isDark }: {
  org: any;
  status: 'pending' | 'approved' | 'rejected';
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  if (!org) return null;

  const statusBadge = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={cn('sticky top-0 z-10 px-6 py-5 border-b',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100')}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                status === 'approved' && (isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'),
                status === 'rejected' && (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'),
                status === 'pending' && (isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'))}>
                <Building2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className={cn('text-lg font-extrabold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {org.orgName || `${org.firstName} ${org.lastName}`}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={statusBadge}>
                    {status === 'approved' ? t('common.status.APPROVED') : status === 'rejected' ? t('common.status.REJECTED') : t('common.status.PENDING')}
                  </Badge>
                  {org.orgType && <Badge variant="info">{ORG_TYPE_LABELS[org.orgType] || org.orgType}</Badge>}
                  {org.verificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className={cn('p-2 rounded-xl transition-colors shrink-0',
                isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Organization Information */}
          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
              <Building2 className="w-3.5 h-3.5" /> Organization Details
            </h3>
            <div className={cn('rounded-xl px-4 divide-y', isDark ? 'bg-slate-700/30 border border-slate-600 divide-slate-600' : 'bg-gray-50 border border-gray-200 divide-gray-200')}>
              <InfoRow icon={Building2} label="Organization Name" value={org.orgName} isDark={isDark} />
              <InfoRow icon={Shield} label="Organization Type" value={org.orgType ? (ORG_TYPE_LABELS[org.orgType] || org.orgType) : null} isDark={isDark} />
              <InfoRow icon={User} label="Representative Name" value={org.representativeName} isDark={isDark} />
              <InfoRow icon={Hash} label="License Number" value={org.licenseNumber} isDark={isDark} />
              <InfoRow icon={MapPin} label="Office Address" value={org.officeAddress} isDark={isDark} />
              <InfoRow icon={FileText} label="Registration Document" value={org.registrationDocUrl ? 'View Document' : null} isDark={isDark} href={org.registrationDocUrl} />
            </div>
          </div>

          {/* Document Expiry */}
          {(org.registrationExpiry || org.licenseExpiry) && (
            <div>
              <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
                <Calendar className="w-3.5 h-3.5" /> Document Expiry
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {org.registrationExpiry && (
                  <div className={cn('rounded-xl p-3', isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-gray-50 border border-gray-200')}>
                    <p className={cn('text-[10px] font-semibold uppercase mb-1', isDark ? 'text-slate-500' : 'text-gray-400')}>Registration Expiry</p>
                    <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{formatDate(org.registrationExpiry)}</p>
                  </div>
                )}
                {org.licenseExpiry && (
                  <div className={cn('rounded-xl p-3', isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-gray-50 border border-gray-200')}>
                    <p className={cn('text-[10px] font-semibold uppercase mb-1', isDark ? 'text-slate-500' : 'text-gray-400')}>License Expiry</p>
                    <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{formatDate(org.licenseExpiry)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact & Account */}
          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
              <User className="w-3.5 h-3.5" /> Account Holder
            </h3>
            <div className={cn('rounded-xl px-4 divide-y', isDark ? 'bg-slate-700/30 border border-slate-600 divide-slate-600' : 'bg-gray-50 border border-gray-200 divide-gray-200')}>
              <InfoRow icon={User} label="Contact Person" value={org.firstName || org.lastName ? `${org.firstName} ${org.lastName}` : null} isDark={isDark} />
              <InfoRow icon={Mail} label="Email Address" value={org.email} isDark={isDark} />
              <InfoRow icon={Phone} label="Phone Number" value={org.phone} isDark={isDark} />
              <InfoRow icon={Calendar} label="Registered On" value={org.createdAt ? formatDate(org.createdAt) : null} isDark={isDark} />
            </div>
          </div>

          {/* Rejection Reason */}
          {status === 'rejected' && org.rejectionReason && (
            <div className={cn('rounded-xl p-4', isDark ? 'bg-red-900/20 border border-red-700/40' : 'bg-red-50 border border-red-200')}>
              <p className={cn('text-xs font-bold mb-1', isDark ? 'text-red-400' : 'text-red-700')}>Rejection Reason</p>
              <p className={cn('text-sm whitespace-pre-wrap', isDark ? 'text-red-300' : 'text-red-600')}>{org.rejectionReason}</p>
            </div>
          )}

          {/* Verification Status explanation */}
          <div className={cn('rounded-xl p-4', isDark ? 'bg-blue-900/20 border border-blue-700/40' : 'bg-blue-50 border border-blue-200')}>
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-600')} />
              <p className={cn('text-xs font-bold', isDark ? 'text-blue-400' : 'text-blue-700')}>Verification Status</p>
            </div>
            <p className={cn('text-sm', isDark ? 'text-blue-300' : 'text-blue-600')}>
              {org.verificationStatus === 'VERIFIED'
                ? t('org.verification.verified')
                : org.verificationStatus === 'PENDING'
                ? t('org.verification.pending')
                : org.verificationStatus === 'REJECTED'
                ? t('org.verification.rejected')
                : t('org.verification.none')}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className={cn('sticky bottom-0 px-6 py-4 border-t flex gap-3 justify-end',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100')}>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {status === 'pending' && (
            <>
              <Button variant="danger" onClick={onReject}>Reject</Button>
              <Button leftIcon={<BadgeCheck className="w-4 h-4" />} onClick={onApprove} isLoading={isApproving}>
                Approve
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function VerificationPage() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ userId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingOrg, setViewingOrg] = useState<any>(null);
  const qc = useQueryClient();

  const { data: pendingOrgs, isLoading } = useQuery({
    queryKey: ['admin-pending-orgs'],
    queryFn: () => api.get('/admin/organizations/pending').then(r => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users', 'ORGANIZATION'],
    queryFn: () => api.get('/admin/users?role=ORGANIZATION').then(r => r.data.data),
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

  const allOrgs = users || [];
  const approvedOrgs = allOrgs.filter((u: any) => u.verificationStatus === 'VERIFIED');
  const rejectedOrgs = allOrgs.filter((u: any) => u.verificationStatus === 'REJECTED');
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
            {t('common.status.PENDING')} ({pendingCount})
          </button>
          <button onClick={() => setTab('approved')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'approved' ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            {t('common.status.APPROVED')} ({approvedOrgs.length})
          </button>
          <button onClick={() => setTab('rejected')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'rejected' ? 'bg-red-600 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            {t('common.status.REJECTED')} ({rejectedOrgs.length})
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
                      {tab === 'approved' ? t('common.status.APPROVED') : tab === 'rejected' ? t('common.status.REJECTED') : t('common.status.PENDING')}
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

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button onClick={() => setViewingOrg(org)}
                      className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                        isDark ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50' : 'text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100')}>
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    {tab === 'pending' && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Organization Detail Modal ── */}
      <OrgDetailModal
        org={viewingOrg}
        status={tab}
        onClose={() => setViewingOrg(null)}
        isApproving={approveOrg.isPending}
        onApprove={() => { approveOrg.mutate(viewingOrg.id); setViewingOrg(null); }}
        onReject={() => {
          setRejectModal({ userId: viewingOrg.id, name: viewingOrg.orgName || viewingOrg.firstName });
          setRejectReason('');
          setViewingOrg(null);
        }}
        isDark={isDark}
      />

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
