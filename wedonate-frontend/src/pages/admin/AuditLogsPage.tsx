import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate, timeAgo } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-blue-600 bg-blue-50',
  CREATE_USER: 'text-indigo-600 bg-indigo-50',
  ASSIGN_ROLE: 'text-purple-600 bg-purple-50',
  ACTIVATE_USER: 'text-green-600 bg-green-50',
  SUSPEND_USER: 'text-red-600 bg-red-50',
  VERIFY_DONATION: 'text-green-600 bg-green-50',
  REJECT_DONATION: 'text-red-600 bg-red-50',
  PAYMENT_SUCCESS: 'text-green-600 bg-green-50',
  PAYMENT_FAILED: 'text-red-600 bg-red-50',
  VERIFY_ORG: 'text-blue-600 bg-blue-50',
  UNVERIFY_ORG: 'text-orange-600 bg-orange-50',
  PUBLISH_REQUEST: 'text-amber-600 bg-amber-50',
  PUBLISH_CAMPAIGN: 'text-amber-600 bg-amber-50',
  FULFILL_REQUEST: 'text-teal-600 bg-teal-50',
  CREATE_NEWS: 'text-indigo-600 bg-indigo-50',
  UPDATE_SETTINGS: 'text-gray-600 bg-gray-50',
};

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, actionFilter, dateFrom, dateTo, page],
    queryFn: () => api.get('/admin/audit-logs', {
      params: {
        search: search || undefined, action: actionFilter || undefined,
        dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
        page, limit,
      },
    }).then(r => r.data),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Action', 'User', 'Resource', 'Resource ID', 'Details', 'Date'];
    const rows = logs.map((l: any) => [
      l.action, l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
      l.resource, l.resourceId || '', l.details || '', new Date(l.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueActions = [...new Set(logs.map((l: any) => l.action))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('admin.audit_logs_title')}</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            {pagination?.total ?? logs.length} total entries
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Search actions, details, resources..." leftIcon={<Search className="w-4 h-4" />}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className={cn('rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]',
            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className={cn('rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')} />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className={cn('rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
            isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !logs.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <Shield className={cn('w-10 h-10 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          {t('admin.no_logs')}
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={cn('border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100')}>
                  <tr>
                    <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.action')}</th>
                    <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.user')}</th>
                    <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.resource')}</th>
                    <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.details')}</th>
                    <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>{t('admin.time')}</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-50')}>
                  {logs.map((log: any) => (
                    <tr key={log.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50')}>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_COLORS[log.action] || (isDark ? 'text-slate-300 bg-slate-700' : 'text-gray-600 bg-gray-100')}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className={cn('px-5 py-3.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : t('admin.system')}
                      </td>
                      <td className={cn('px-5 py-3.5 font-mono text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{log.resource}</td>
                      <td className={cn('px-5 py-3.5 text-xs max-w-xs truncate', isDark ? 'text-slate-400' : 'text-gray-500')}>{log.details || '—'}</td>
                      <td className={cn('px-5 py-3.5 text-xs', isDark ? 'text-slate-500' : 'text-gray-400')} title={formatDate(log.createdAt)}>{timeAgo(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}>
                  Prev
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
