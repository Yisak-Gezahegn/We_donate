import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

const ALL_ROLES = ['USER','NGO','ORGANIZATION','GOVERNMENTAL_ORG','KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

export default function ManageUsersPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined, role: roleFilter || undefined } }).then(r => r.data.data),
  });

  const assignRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast.success(t('admin.role_updated'));
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setAssigningUser(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('admin.role_update_failed')),
  });

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'danger', CITY_ADMIN: 'danger', WOREDA_ADMIN: 'warning',
    KEBELE_ADMIN: 'warning', NGO_PARTNER: 'info', DONOR: 'success', BENEFICIARY: 'default',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('admin.manage_users_title')}</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{users?.length ?? 0} {t('admin.total_users_suffix')}</p>
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
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? t('admin.active') : t('admin.inactive')}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setAssigningUser(u.id)}
                        className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                          isDark ? 'text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-900/50' : 'text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100')}>
                        <UserCog className="w-3.5 h-3.5" /> {t('admin.assign_role')}
                      </button>
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
