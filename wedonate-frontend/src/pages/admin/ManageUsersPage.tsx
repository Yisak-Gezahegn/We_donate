import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCog, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

const ALL_ROLES = ['USER','NGO','ORGANIZATION','GOVERNMENTAL_ORG','KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];

export default function ManageUsersPage() {
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
      toast.success('Role updated successfully');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setAssigningUser(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update role'),
  });

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'danger', CITY_ADMIN: 'danger', WOREDA_ADMIN: 'warning',
    KEBELE_ADMIN: 'warning', NGO_PARTNER: 'info', DONOR: 'success', BENEFICIARY: 'default',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Manage Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users?.length ?? 0} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Search by name or email..." leftIcon={<Search className="w-4 h-4" />}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]">
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
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">User</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Joined</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-800">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      {assigningUser === u.id ? (
                        <select autoFocus defaultValue={u.role}
                          onChange={e => assignRole.mutate({ userId: u.id, role: e.target.value })}
                          onBlur={() => setAssigningUser(null)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
                        </select>
                      ) : (
                        <Badge variant={(roleColors[u.role] || 'default') as any}>{u.role.replace('_',' ')}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setAssigningUser(u.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                        <UserCog className="w-3.5 h-3.5" /> Assign Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users?.length && (
              <div className="text-center py-10 text-gray-400">No users found</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
