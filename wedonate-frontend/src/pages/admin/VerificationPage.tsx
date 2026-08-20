import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ORG_ROLES = ['NGO', 'ORGANIZATION', 'GOVERNMENTAL_ORG'];
type Tab = 'unverified' | 'verified';

export default function VerificationPage() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('unverified');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', ''],
    queryFn: () => api.get('/admin/users').then(r => r.data.data),
  });

  const toggleVerification = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/toggle-verification`),
    onSuccess: (data) => { toast.success(data.data.message || 'Verification updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const orgs = (users || []).filter((u: any) => ORG_ROLES.includes(u.role));
  const unverified = orgs.filter((u: any) => !u.isVerified);
  const verified = orgs.filter((u: any) => u.isVerified);
  const currentList = tab === 'unverified' ? unverified : verified;
  const filtered = currentList.filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.firstName.toLowerCase().includes(s) || u.lastName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Account Verification</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Review and verify donor & beneficiary organization accounts.</p>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className={cn('flex gap-1 p-1 rounded-xl', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
          <button onClick={() => setTab('unverified')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'unverified' ? 'bg-amber-500 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Unverified ({unverified.length})
          </button>
          <button onClick={() => setTab('verified')}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === 'verified' ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
            Verified ({verified.length})
          </button>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search organizations..." leftIcon={<Search className="w-4 h-4" />}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !filtered.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <BadgeCheck className={cn('w-12 h-12 mx-auto mb-3', tab === 'verified' ? 'text-green-400' : 'text-amber-400')} />
          <p className="font-medium">{tab === 'unverified' ? 'All organizations are verified' : 'No verified organizations yet'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((u: any) => (
            <Card key={u.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                  isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{u.firstName} {u.lastName}</h3>
                    <Badge variant={u.isVerified ? 'success' : 'warning'}>{u.isVerified ? 'Verified' : 'Pending'}</Badge>
                    <Badge variant="info">{u.role.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className={cn('text-xs mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{u.email}</p>
                  <p className={cn('text-xs mb-3', isDark ? 'text-slate-500' : 'text-gray-400')}>Joined {formatDate(u.createdAt)}</p>
                  <Button size="sm"
                    variant={u.isVerified ? 'danger' : 'primary'}
                    leftIcon={<BadgeCheck className="w-3.5 h-3.5" />}
                    onClick={() => toggleVerification.mutate(u.id)}
                    isLoading={toggleVerification.isPending}>
                    {u.isVerified ? 'Remove Verification' : 'Verify Account'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
