import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, BadgeCheck, UserPlus, X, Eye, ExternalLink, MapPin, Phone, Mail, Building2, FileText, Calendar, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ALL_ROLES = ['USER', 'ORGANIZATION', 'KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  USER: 'Regular platform user who can donate and create support requests',
  ORGANIZATION: 'Organization — can create campaigns after verification',
  KEBELE_ADMIN: 'Kebele Administrator — manages users and creates requests for community members',
  CITY_ADMIN: 'City Administrator — full platform management',
  SYSTEM_ADMIN: 'System Administrator — unrestricted access to all features',
};

const ORG_STATUS_INFO: Record<string, { label: string; color: string }> = {
  NONE: { label: 'Not an Organization', color: 'bg-gray-100 text-gray-600' },
  PENDING: { label: 'Verification Pending', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Verified Organization', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Verification Rejected', color: 'bg-red-100 text-red-700' },
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
            className={cn('text-sm font-medium flex items-center gap-1 hover:underline', isDark ? 'text-blue-400' : 'text-blue-600')}>
            {value} <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>{value}</p>
        )}
      </div>
    </div>
  );
}

function UserDetailModal({ user, isOpen, onClose, isDark }: { user: any; isOpen: boolean; onClose: () => void; isDark: boolean }) {
  const { t } = useTranslation();
  if (!isOpen || !user) return null;

  const isOrg = ['ORGANIZATION'].includes(user.role);
  const orgStatus = ORG_STATUS_INFO[user.verificationStatus] || ORG_STATUS_INFO.NONE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={cn('sticky top-0 z-10 px-6 py-5 border-b',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-green-200" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
              <div>
                <h2 className={cn('text-lg font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
                  {user.firstName} {user.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusVariant(user.role === 'SYSTEM_ADMIN' || user.role === 'CITY_ADMIN' ? 'danger' : user.role === 'KEBELE_ADMIN' ? 'warning' : 'default')}>
                    {user.role.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                  {user.verificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className={cn('p-2 rounded-xl transition-colors',
                isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Role Description */}
          <div className={cn('rounded-xl p-4', isDark ? 'bg-slate-700/50' : 'bg-gray-50')}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className={cn('w-4 h-4', isDark ? 'text-green-400' : 'text-green-600')} />
              <p className={cn('text-xs font-bold', isDark ? 'text-slate-300' : 'text-gray-700')}>Role Description</p>
            </div>
            <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-gray-500')}>
              {ROLE_DESCRIPTIONS[user.role] || 'No description available'}
            </p>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3', isDark ? 'text-slate-500' : 'text-gray-400')}>Personal Information</h3>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              <InfoRow icon={Mail} label="Email Address" value={user.email} isDark={isDark} />
              <InfoRow icon={Phone} label="Phone Number" value={user.phone} isDark={isDark} />
              <InfoRow icon={Calendar} label="Member Since" value={user.createdAt ? formatDate(user.createdAt) : null} isDark={isDark} />
              <InfoRow icon={Calendar} label="Account Status" value={user.isActive ? 'Active' : 'Suspended / Inactive'} isDark={isDark} />
            </div>
          </div>

          {/* Organization Information (if org role) */}
          {isOrg && (
            <div>
              <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3', isDark ? 'text-slate-500' : 'text-gray-400')}>Organization Details</h3>
              <div className={cn('rounded-xl p-4 space-y-1', isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-gray-50 border border-gray-200')}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', orgStatus.color)}>
                    {orgStatus.label}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  <InfoRow icon={Building2} label="Organization Name" value={user.orgName} isDark={isDark} />
                  <InfoRow icon={FileText} label="Organization Type" value={user.orgType?.replace(/_/g, ' ')} isDark={isDark} />
                  <InfoRow icon={UserCog} label="Representative Name" value={user.representativeName} isDark={isDark} />
                  <InfoRow icon={FileText} label="License Number" value={user.licenseNumber} isDark={isDark} />
                  <InfoRow icon={MapPin} label="Office Address" value={user.officeAddress} isDark={isDark} />
                  {user.registrationDocUrl && (
                    <InfoRow icon={FileText} label="Registration Document" value="View Document" isDark={isDark} href={user.registrationDocUrl} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Document Expiry (for org roles) */}
          {isOrg && (user.registrationExpiry || user.licenseExpiry) && (
            <div>
              <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3', isDark ? 'text-slate-500' : 'text-gray-400')}>Document Expiry</h3>
              <div className="grid grid-cols-2 gap-3">
                {user.registrationExpiry && (
                  <div className={cn('rounded-xl p-3', isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-gray-50 border border-gray-200')}>
                    <p className={cn('text-[10px] font-semibold uppercase mb-1', isDark ? 'text-slate-500' : 'text-gray-400')}>Registration Expiry</p>
                    <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{formatDate(user.registrationExpiry)}</p>
                  </div>
                )}
                {user.licenseExpiry && (
                  <div className={cn('rounded-xl p-3', isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-gray-50 border border-gray-200')}>
                    <p className={cn('text-[10px] font-semibold uppercase mb-1', isDark ? 'text-slate-500' : 'text-gray-400')}>License Expiry</p>
                    <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{formatDate(user.licenseExpiry)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {user.rejectionReason && (
            <div className={cn('rounded-xl p-4', isDark ? 'bg-red-900/20 border border-red-700/40' : 'bg-red-50 border border-red-200')}>
              <p className={cn('text-xs font-bold mb-1', isDark ? 'text-red-400' : 'text-red-700')}>Rejection Reason</p>
              <p className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>{user.rejectionReason}</p>
            </div>
          )}

          {/* Verification Status */}
          {isOrg && (
            <div className={cn('rounded-xl p-4', isDark ? 'bg-blue-900/20 border border-blue-700/40' : 'bg-blue-50 border border-blue-200')}>
              <div className="flex items-center gap-2 mb-2">
                <BadgeCheck className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-600')} />
                <p className={cn('text-xs font-bold', isDark ? 'text-blue-400' : 'text-blue-700')}>Verification Status</p>
              </div>
              <p className={cn('text-sm', isDark ? 'text-blue-300' : 'text-blue-600')}>
                {user.verificationStatus === 'VERIFIED' && 'This organization has been verified and can create campaigns and support requests.'}
                {user.verificationStatus === 'PENDING' && 'This organization is awaiting verification. Campaign and support request creation is blocked until approved.'}
                {user.verificationStatus === 'REJECTED' && 'This organization\'s verification was rejected. They cannot create campaigns or support requests.'}
                {!user.verificationStatus && 'This user has no organization verification status.'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function ManageUsersPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const [assigningKebeleUser, setAssigningKebeleUser] = useState<string | null>(null);
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'USER', kebeleId: '' });
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();

  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
  const isKebeleAdmin = currentUser?.role === 'KEBELE_ADMIN';
  const canAssignRole = isSystemAdmin;

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined, role: roleFilter || undefined } }).then(r => r.data.data),
  });

  const { data: kebeles = [] } = useQuery({
    queryKey: ['admin-kebeles'],
    queryFn: () => api.get('/kebeles/active').then(r => r.data),
  });

  const assignRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => { toast.success(t('admin.role_updated')); qc.invalidateQueries({ queryKey: ['admin-users'] }); setAssigningUser(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('admin.role_update_failed')),
  });

  const assignKebele = useMutation({
    mutationFn: ({ userId, kebeleId }: { userId: string; kebeleId: string }) =>
      api.patch(`/admin/users/${userId}/kebele`, { kebeleId }),
    onSuccess: () => { toast.success('Kebele assigned successfully'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setAssigningKebeleUser(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to assign Kebele'),
  });

  const toggleActive = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/toggle-active`),
    onSuccess: (data) => { toast.success(data.data.message || 'User status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const toggleVerification = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/toggle-verification`),
    onSuccess: (data) => { toast.success(data.data.message || 'Verification updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const createUser = useMutation({
    mutationFn: (data: any) => api.post('/admin/users', data),
    onSuccess: () => { toast.success('User created successfully'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowCreateModal(false); setCreateForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'USER', kebeleId: '' }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create user'),
  });



  const deleteUser = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => { toast.success('User deleted successfully'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setDeletingUser(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete user'),
  });

  const canDeleteUser = (u: any) =>
    isSystemAdmin && u.id !== currentUser?.id;

  const roleColors: Record<string, string> = {
    SYSTEM_ADMIN: 'danger', CITY_ADMIN: 'danger',
    KEBELE_ADMIN: 'warning', ORGANIZATION: 'info',
    USER: 'default',
  };

  return (
    <div className="space-y-6">
      {/* View User Detail Modal */}
      <UserDetailModal user={viewingUser} isOpen={!!viewingUser} onClose={() => setViewingUser(null)} isDark={isDark} />

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingUser(null)} />
          <Card className="relative z-10 w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                isDark ? 'bg-red-900/40' : 'bg-red-100')}>
                <Trash2 className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  Archive User
                </h2>
                <p className={cn('text-sm mt-2', isDark ? 'text-slate-400' : 'text-gray-500')}>
                  Are you sure you want to archive{' '}
                  <span className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-800')}>
                    {deletingUser.firstName} {deletingUser.lastName}
                  </span>{' '}
                  ({deletingUser.email})?
                </p>
                <p className={cn('text-xs mt-3 px-3 py-2 rounded-lg', isDark ? 'bg-red-900/20 text-red-300 border border-red-700/40' : 'bg-red-50 text-red-700 border border-red-200')}>
                  This user will be deactivated and unable to log in, but their historical records (donations, campaigns) will be preserved for auditing.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="ghost" onClick={() => setDeletingUser(null)}>Cancel</Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}
                isLoading={deleteUser.isPending}
                onClick={() => deleteUser.mutate(deletingUser.id)}>
                Archive User
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('admin.manage_users_title')}</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{users?.length ?? 0} {t('admin.total_users_suffix')}</p>
        </div>
        {(isSystemAdmin || currentUser?.role === 'CITY_ADMIN') && (
          <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Create User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder={t('admin.search_placeholder')} leftIcon={<Search className="w-4 h-4" />}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className={cn('rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]',
            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
          <option value="">{t('admin.all_roles')}</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <Card className="relative z-10 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Create New User</h2>
              <button onClick={() => setShowCreateModal(false)} className={cn('p-1.5 rounded-lg', isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" value={createForm.firstName} onChange={e => setCreateForm(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" />
                <Input label="Last Name" value={createForm.lastName} onChange={e => setCreateForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" />
              </div>
              <Input label="Email" type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" />
              <Input label="Password" type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
              <Input label="Phone (optional)" value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} placeholder="+251..." />
              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Role</label>
                <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                  className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
                  {ALL_ROLES.filter(r => isSystemAdmin || (currentUser?.role === 'CITY_ADMIN' && r === 'KEBELE_ADMIN')).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              {createForm.role === 'KEBELE_ADMIN' && (
                <div>
                  <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Assign Kebele</label>
                  <select value={createForm.kebeleId} onChange={e => setCreateForm(p => ({ ...p, kebeleId: e.target.value }))}
                    className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
                    <option value="">-- Select active Kebele --</option>
                    {kebeles.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => createUser.mutate(createForm)} isLoading={createUser.isPending}
                  disabled={!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password}>
                  Create User
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}



      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={cn('border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100')}>
                <tr>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.user')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.email')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.role')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.joined')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.status')}</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-50')}>
                {users?.map((u: any) => (
                  <tr key={u.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50')}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.profileImage ? (
                          <img src={u.profileImage} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                            isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                        )}
                        <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-800')}>{u.firstName} {u.lastName}</span>
                        {u.verificationStatus === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{u.email}</td>
                    <td className="px-5 py-3.5">
                      {assigningUser === u.id ? (
                        <select autoFocus defaultValue={u.role}
                          onChange={e => assignRole.mutate({ userId: u.id, role: e.target.value })}
                          onBlur={() => setAssigningUser(null)}
                          className={cn('rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500',
                            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
                          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
                        </select>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant={(roleColors[u.role] || 'default') as any}>{u.role.replace('_',' ')}</Badge>
                          {u.role === 'KEBELE_ADMIN' && u.kebeleId && (
                            <span className="text-xs text-blue-500">
                              Kebele: {kebeles.find((k: any) => k.id === u.kebeleId)?.name || 'Unknown'}
                            </span>
                          )}
                          {assigningKebeleUser === u.id ? (
                            <select autoFocus defaultValue={u.kebeleId || ''}
                              onChange={e => assignKebele.mutate({ userId: u.id, kebeleId: e.target.value })}
                              onBlur={() => setAssigningKebeleUser(null)}
                              className={cn('mt-1 rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500',
                                isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
                              <option value="">-- No Kebele --</option>
                              {kebeles.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
                            </select>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive.mutate(u.id)}>
                        <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? t('admin.active') : t('admin.inactive')}</Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setViewingUser(u)}
                          className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                            isDark ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50' : 'text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100')}>
                          <Eye className="w-3.5 h-3.5" /> View Info
                        </button>
                        {((['ORGANIZATION'].includes(u.role) && ['CITY_ADMIN', 'SYSTEM_ADMIN'].includes(currentUser?.role || '')) || 
                          (['USER'].includes(u.role) && ['KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'].includes(currentUser?.role || ''))) && (
                          <button onClick={() => toggleVerification.mutate(u.id)}
                            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              u.verificationStatus === 'VERIFIED'
                                ? (isDark ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50' : 'text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100')
                                : (isDark ? 'text-slate-400 hover:text-slate-300 bg-slate-700 hover:bg-slate-600' : 'text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'))}>
                            <BadgeCheck className="w-3.5 h-3.5" /> {u.verificationStatus === 'VERIFIED' ? 'Unverify' : 'Verify'}
                          </button>
                        )}
                        {canAssignRole && (
                          <button onClick={() => setAssigningUser(u.id)}
                            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              isDark ? 'text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-900/50' : 'text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100')}>
                            <UserCog className="w-3.5 h-3.5" /> {t('admin.assign_role')}
                          </button>
                        )}
                        {u.role === 'KEBELE_ADMIN' && (isSystemAdmin || currentUser?.role === 'CITY_ADMIN') && (
                          <button onClick={() => setAssigningKebeleUser(u.id)}
                            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              isDark ? 'text-purple-400 hover:text-purple-300 bg-purple-900/30 hover:bg-purple-900/50' : 'text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100')}>
                            <UserCog className="w-3.5 h-3.5" /> Assign Kebele
                          </button>
                        )}
                        {canDeleteUser(u) && (
                          <button onClick={() => setDeletingUser(u)}
                            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              isDark ? 'text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50' : 'text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100')}>
                            <Trash2 className="w-3.5 h-3.5" /> Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users?.length && (
              <div className={cn('text-center py-10', isDark ? 'text-slate-500' : 'text-gray-400')}>{t('admin.no_users')}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
