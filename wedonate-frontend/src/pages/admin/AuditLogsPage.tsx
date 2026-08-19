import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate, timeAgo } from '../../lib/utils';
import Card from '../../components/ui/Card';

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/admin/audit-logs').then(r => r.data.data),
  });

  const actionColors: Record<string, string> = {
    LOGIN: 'text-blue-600 bg-blue-50', ASSIGN_ROLE: 'text-purple-600 bg-purple-50',
    PAYMENT_SUCCESS: 'text-green-600 bg-green-50', PAYMENT_FAILED: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('admin.audit_logs_title')}</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{t('admin.audit_logs_subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !logs?.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <Shield className={cn('w-10 h-10 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          {t('admin.no_logs')}
        </Card>
      ) : (
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
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${actionColors[log.action] || (isDark ? 'text-slate-300 bg-slate-700' : 'text-gray-600 bg-gray-100')}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className={cn('px-5 py-3.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : t('admin.system')}
                    </td>
                    <td className={cn('px-5 py-3.5 font-mono text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{log.resource}</td>
                    <td className={cn('px-5 py-3.5 text-xs max-w-xs truncate', isDark ? 'text-slate-400' : 'text-gray-500')}>{log.details || '—'}</td>
                    <td className={cn('px-5 py-3.5 text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>{timeAgo(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
