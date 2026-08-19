import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, timeAgo } from '../../lib/utils';
import Card from '../../components/ui/Card';

export default function AuditLogsPage() {
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
        <h1 className="text-2xl font-extrabold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">System activity trail (last 100 events)</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !logs?.length ? (
        <Card className="text-center py-16 text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          No audit logs found
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Action</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">User</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Resource</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Details</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${actionColors[log.action] || 'text-gray-600 bg-gray-100'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{log.resource}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{timeAgo(log.createdAt)}</td>
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
