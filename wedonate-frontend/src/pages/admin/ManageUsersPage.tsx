import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, Shield, ShieldOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ALL_ROLES = ['USER','NGO','ORGANIZATION','GOVERNMENTAL_ORG','KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

export default function ManageUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const qc = useQueryClient();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined, role: roleFilter || undefined } }).then(r => r.data.data),
  });

  const assignRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast.success('Role updated successfully');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setAssigningUser(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update role'),
  });

  const toggleActive = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/toggle-active`),
    onSuccess: (data) => {
      toast.success(data.data.message || 'User status updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update user status'),
  });

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'danger', CITY_ADMIN: 'danger', WOREDA_ADMIN: 'warning',
    KEBELE_ADMIN: 'warning', NGO: 'info', ORGANIZATION: 'info', GOVERNMENTAL_ORG: 'info',
    USER: 'default',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Manage Users</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{users?.length ?? 0} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Search by name or email..." leftIcon={<Search className="w-4 h-4" />}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className={cn('rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]',
            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900')}>
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

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
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>User</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Email</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Role</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Joined</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Status</th>
                  <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Actions</th>
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
                        <span className={cn('font-medium', isDark ? 'text-slate-200' : 'text-gray-800')}>{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{u.email}</td>
                    <td className="px-5 py-3.5">
                      {assigningUser === u.id ? (
                        <select autoFocus defaultValue={u.role}
                          onChange={e => assignRole.mutate({ userId: u.id, role: e.target.value })}
                          onBlur={() => setAssigningUser(null)}
                          className={cn('rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500',
                            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300')}>
                          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
                        </select>
                      ) : (
                        <Badge variant={(roleColors[u.role] || 'default') as any}>{u.role.replace('_',' ')}</Badge>
                      )}
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Suspended'}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {/* Role assignment - only for SUPER_ADMIN */}
                        {isSuperAdmin && (
                          <button onClick={() => setAssigningUser(u.id)}
                            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'text-green-700 hover:bg-green-100 bg-green-50')}>
                            <UserCog className="w-3.5 h-3.5" /> Role
                          </button>
                        )}
                        {/* Suspend/Activate - for all admins */}
                        <button onClick={() => toggleActive.mutate(u.id)}
                          disabled={toggleActive.isPending}
                          className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                            u.isActive
                              ? (isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'text-red-600 hover:bg-red-50 bg-red-50')
                              : (isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'text-green-600 hover:bg-green-50 bg-green-50')
                          )}>
                          {u.isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users?.length && (
              <div className={cn('text-center py-10', isDark ? 'text-slate-500' : 'text-gray-400')}>No users found</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
