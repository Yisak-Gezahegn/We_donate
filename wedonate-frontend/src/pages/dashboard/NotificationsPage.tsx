import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-sm text-gray-500 mt-1">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" isLoading={markAll.isPending}
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !notifications?.length ? (
        <Card className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n.id}
              className={cn('flex items-start gap-4 p-5 rounded-2xl border transition-all',
                n.isRead ? 'bg-white border-gray-100' : 'bg-green-50 border-green-100')}>
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                n.type === 'SUCCESS' ? 'bg-green-100' : n.type === 'ERROR' ? 'bg-red-100' : 'bg-blue-100')}>
                <Bell className={cn('w-5 h-5',
                  n.type === 'SUCCESS' ? 'text-green-600' : n.type === 'ERROR' ? 'text-red-500' : 'text-blue-500')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', n.isRead ? 'text-gray-700' : 'text-gray-900')}>{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
