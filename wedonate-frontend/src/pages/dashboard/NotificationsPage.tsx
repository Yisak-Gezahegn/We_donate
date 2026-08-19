import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { timeAgo, cn } from '../../lib/utils';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAll = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('dashboard.notifications')}</h1>
          {unread > 0 && <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{unread} {t('dashboard.unread')}</p>}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button size="sm" variant="outline" isLoading={markAll.isPending}
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={() => markAll.mutate()}>
              {t('dashboard.mark_all_read')}
            </Button>
          )}
          {notifications?.length > 0 && (
            <Button size="sm" variant="outline" isLoading={clearAll.isPending}
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                if (window.confirm(t('dashboard.clear_confirm'))) {
                  clearAll.mutate();
                }
              }}
              className={cn(isDark ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50')}>
              {t('dashboard.clear_all')}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !notifications?.length ? (
        <Card className="text-center py-16">
          <Bell className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className={cn(isDark ? 'text-slate-400' : 'text-gray-400')}>{t('dashboard.no_notifications')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n.id}
              onClick={() => !n.isRead && markOne.mutate(n.id)}
              className={cn('flex items-start gap-4 p-5 rounded-2xl border transition-all',
                !n.isRead && 'cursor-pointer',
                n.isRead
                  ? isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
                  : isDark ? 'bg-green-900/20 border-green-800/40' : 'bg-green-50 border-green-100')}>
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                n.type === 'SUCCESS' ? isDark ? 'bg-green-900/40' : 'bg-green-100'
                  : n.type === 'ERROR' ? isDark ? 'bg-red-900/40' : 'bg-red-100'
                  : isDark ? 'bg-blue-900/40' : 'bg-blue-100')}>
                <Bell className={cn('w-5 h-5',
                  n.type === 'SUCCESS' ? isDark ? 'text-green-400' : 'text-green-600'
                    : n.type === 'ERROR' ? isDark ? 'text-red-400' : 'text-red-500'
                    : isDark ? 'text-blue-400' : 'text-blue-500')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold',
                  n.isRead ? isDark ? 'text-slate-300' : 'text-gray-700' : isDark ? 'text-white' : 'text-gray-900')}>
                  {n.title}
                </p>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{n.message}</p>
                <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-gray-400')}>{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
