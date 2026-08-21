import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, BadgeCheck, UserPlus, X } from 'lucide-react';
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

const ALL_ROLES = ['USER','NGO','ORGANIZATION','GOVERNMENTAL_ORG','KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

export default function ManageUsersPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'USER' });
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined, role: roleFilter || undefined } }).then(r => r.data.data),
  });

  const assignRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => { toast.success(t('admin.role_updated')); qc.invalidateQueries({ queryKey: ['admin-users'] }); setAssigningUser(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('admin.role_update_failed')),
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

  const updateExpiry = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => api.patch(`/admin/users/${userId}/document-expiry`, data),
    onSuccess: () => { toast.success('Document expiry updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const createUser = useMutation({
    mutationFn: (data: any) => api.post('/admin/users', data),
    onSuccess: () => { toast.success('User created successfully'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowCreateModal(false); setCreateForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'USER' }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create user'),
  });

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'danger', CITY_ADMIN: 'danger', WOREDA_ADMIN: 'warning',
    KEBELE_ADMIN: 'warning', NGO: 'info', ORGANIZATION: 'info', GOVERNMENTAL_ORG: 'info',
    USER: 'default',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('admin.manage_users_title')}</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{users?.length ?? 0} {t('admin.total_users_suffix')}</p>
        </div>
        <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          Create User
        </Button>
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
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
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
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                          isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-800')}>{u.firstName} {u.lastName}</span>
                        {u.isVerified && (
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
                        <Badge variant={(roleColors[u.role] || 'default') as any}>{u.role.replace('_',' ')}</Badge>
                      )}
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive.mutate(u.id)}>
                        <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? t('admin.active') : t('admin.inactive')}</Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {['NGO','ORGANIZATION','GOVERNMENTAL_ORG'].includes(u.role) && (
                          <button onClick={() => toggleVerification.mutate(u.id)}
                            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              u.isVerified
                                ? (isDark ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50' : 'text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100')
                                : (isDark ? 'text-slate-400 hover:text-slate-300 bg-slate-700 hover:bg-slate-600' : 'text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'))}>
                            <BadgeCheck className="w-3.5 h-3.5" /> {u.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button onClick={() => setAssigningUser(u.id)}
                            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              isDark ? 'text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-900/50' : 'text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100')}>
                            <UserCog className="w-3.5 h-3.5" /> {t('admin.assign_role')}
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
