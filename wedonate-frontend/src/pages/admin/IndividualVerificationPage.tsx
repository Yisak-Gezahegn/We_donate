import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgeCheck, Search, User, Phone, ExternalLink, X, Calendar, Hash, Mail, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Tab = 'pending' | 'approved' | 'rejected';

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

function UserDetailModal({ user, status, onClose, onApprove, onReject, isApproving, isDark }: {
  user: any;
  status: 'pending' | 'approved' | 'rejected';
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isDark: boolean;
}) {
  if (!user) return null;

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
                <User className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className={cn('text-lg font-extrabold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {user.firstName} {user.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={statusBadge}>
                    {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
                  </Badge>
                  {user.verificationStatus === 'VERIFIED' && (
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
          {/* User Information */}
          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
              <User className="w-3.5 h-3.5" /> Identity Details
            </h3>
            <div className={cn('rounded-xl px-4 divide-y', isDark ? 'bg-slate-700/30 border border-slate-600 divide-slate-600' : 'bg-gray-50 border border-gray-200 divide-gray-200')}>
              <InfoRow icon={User} label="Full Name" value={`${user.firstName} ${user.lastName}`} isDark={isDark} />
              <InfoRow icon={Mail} label="Email Address" value={user.email} isDark={isDark} />
              <InfoRow icon={Phone} label="Phone Number" value={user.phone} isDark={isDark} />
              <InfoRow icon={Hash} label="FAN Number" value={user.fanNumber} isDark={isDark} />
              <InfoRow icon={Calendar} label="Registered On" value={user.createdAt ? formatDate(user.createdAt) : null} isDark={isDark} />
            </div>
          </div>

          {/* ID Documents */}
          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
              <BadgeCheck className="w-3.5 h-3.5" /> ID Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.nationalIdFrontUrl && (
                <div>
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-2', isDark ? 'text-slate-500' : 'text-gray-400')}>ID Front</p>
                  <a href={user.nationalIdFrontUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border">
                    <img src={user.nationalIdFrontUrl} alt="ID Front" className="w-full h-40 object-cover" />
                  </a>
                </div>
              )}
              {user.nationalIdBackUrl && (
                <div>
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-2', isDark ? 'text-slate-500' : 'text-gray-400')}>ID Back</p>
                  <a href={user.nationalIdBackUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border">
                    <img src={user.nationalIdBackUrl} alt="ID Back" className="w-full h-40 object-cover" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {status === 'rejected' && user.rejectionReason && (
            <div className={cn('rounded-xl p-4', isDark ? 'bg-red-900/20 border border-red-700/40' : 'bg-red-50 border border-red-200')}>
              <p className={cn('text-xs font-bold mb-1', isDark ? 'text-red-400' : 'text-red-700')}>Rejection Reason</p>
              <p className={cn('text-sm whitespace-pre-wrap', isDark ? 'text-red-300' : 'text-red-600')}>{user.rejectionReason}</p>
            </div>
          )}
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

export default function IndividualVerificationPage() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ userId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingUser, setViewingUser] = useState<any>(null);
  const qc = useQueryClient();

  const { data: pendingUsers, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: () => api.get('/admin/user-verifications/pending').then(r => r.data.data),
  });

  const { data: users, isLoading: isLoadingAll } = useQuery({
    queryKey: ['admin-users', 'USER'],
    queryFn: () => api.get('/admin/users?role=USER').then(r => r.data.data),
  });

  const approveUserMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/approve`),
    onSuccess: (data) => {
      toast.success(data.data.message || 'User approved');
      qc.invalidateQueries({ queryKey: ['admin-pending-users'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const rejectUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.patch(`/admin/users/${userId}/reject`, { reason }),
    onSuccess: (data) => {
      toast.success(data.data.message || 'User rejected');
      qc.invalidateQueries({ queryKey: ['admin-pending-users'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRejectModal(null);
      setRejectReason('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const allUsersList = users || [];
  const approvedUsers = allUsersList.filter((u: any) => u.verificationStatus === 'VERIFIED');
  const rejectedUsers = allUsersList.filter((u: any) => u.verificationStatus === 'REJECTED');
  
  // Actually combine pendingUsers and from allUsersList if they're pending or changes requested
  // The pending api already gives us PENDING, CHANGES_REQUESTED, REJECTED 
  // Let's rely on that for pending
  const pendingDisplay = pendingUsers?.filter((u: any) => u.verificationStatus === 'PENDING' || u.verificationStatus === 'CHANGES_REQUESTED') || [];
  const rejectedDisplay = pendingUsers?.filter((u: any) => u.verificationStatus === 'REJECTED') || rejectedUsers;

  const getDisplayList = () => {
    if (tab === 'pending') return pendingDisplay;
    if (tab === 'approved') return approvedUsers;
    return rejectedDisplay;
  };

  const displayList = getDisplayList().filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${u.firstName} ${u.lastName}`;
    return name.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
  });

  const isLoading = isLoadingPending || isLoadingAll;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Individual Verification</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          Review and verify citizen identity requests before they can request support.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className={cn('flex gap-1 p-1 rounded-xl', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
          <button onClick={() => setTab('pending')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'pending' ? 'bg-amber-500 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Pending ({pendingDisplay.length})
          </button>
          <button onClick={() => setTab('approved')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'approved' ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Approved ({approvedUsers.length})
          </button>
          <button onClick={() => setTab('rejected')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'rejected' ? 'bg-red-600 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Rejected ({rejectedDisplay.length})
          </button>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search users..." leftIcon={<Search className="w-4 h-4" />}
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
          <User className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className="font-medium">
            {tab === 'pending' ? 'No pending verifications' : tab === 'approved' ? 'No approved verifications yet' : 'No rejected verifications'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayList.map((user: any) => (
            <Card key={user.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
                  tab === 'approved' && (isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'),
                  tab === 'rejected' && (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'),
                  tab === 'pending' && (isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'),
                )}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {user.firstName} {user.lastName}
                    </h3>
                    <Badge variant={tab === 'approved' ? 'success' : tab === 'rejected' ? 'danger' : 'warning'}>
                      {tab === 'approved' ? 'Approved' : tab === 'rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </div>

                  {/* User Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {user.email && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={cn('font-mono', isDark ? 'text-slate-400' : 'text-gray-500')}>{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{user.phone}</span>
                      </div>
                    )}
                    {user.fanNumber && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Hash className={cn('w-3.5 h-3.5', isDark ? 'text-slate-500' : 'text-gray-400')} />
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>FAN: {user.fanNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Rejection reason */}
                  {tab === 'rejected' && user.rejectionReason && (
                    <div className={cn('mt-3 p-2 rounded-lg text-xs', isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600')}>
                      Rejection reason: {user.rejectionReason}
                    </div>
                  )}

                  <p className={cn('text-[10px] mt-2', isDark ? 'text-slate-600' : 'text-gray-400')}>
                    Requested {formatDate(user.createdAt)}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button onClick={() => setViewingUser(user)}
                      className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                        isDark ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50' : 'text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100')}>
                      <Eye className="w-3.5 h-3.5" /> View Identity Docs
                    </button>
                    {tab === 'pending' && (
                      <>
                        <Button size="sm"
                          leftIcon={<BadgeCheck className="w-3.5 h-3.5" />}
                          onClick={() => approveUserMutation.mutate(user.id)}
                          isLoading={approveUserMutation.isPending}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger"
                          onClick={() => { setRejectModal({ userId: user.id, name: `${user.firstName} ${user.lastName}` }); setRejectReason(''); }}>
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

      {/* ── User Detail Modal ── */}
      <UserDetailModal
        user={viewingUser}
        status={tab}
        onClose={() => setViewingUser(null)}
        isApproving={approveUserMutation.isPending}
        onApprove={() => { approveUserMutation.mutate(viewingUser.id); setViewingUser(null); }}
        onReject={() => {
          setRejectModal({ userId: viewingUser.id, name: `${viewingUser.firstName} ${viewingUser.lastName}` });
          setRejectReason('');
          setViewingUser(null);
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
              <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Reject User Verification</h3>
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
                  rejectUserMutation.mutate({ userId: rejectModal.userId, reason: rejectReason.trim() });
                }}
                isLoading={rejectUserMutation.isPending}>
                Reject Verification
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
