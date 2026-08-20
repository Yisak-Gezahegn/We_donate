import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit3, X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type EventStatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export default function AdminEventsPage() {
  const { isDark } = useTheme();
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', startDate: '', endDate: '', imageUrl: '', status: 'DRAFT' });
  const qc = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events', statusFilter],
    queryFn: () => api.get('/events', { params: { status: statusFilter === 'ALL' ? undefined : statusFilter } }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/events', data),
    onSuccess: () => { toast.success('Event created'); qc.invalidateQueries({ queryKey: ['admin-events'] }); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/events/${id}`, data),
    onSuccess: () => { toast.success('Event updated'); qc.invalidateQueries({ queryKey: ['admin-events'] }); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => { toast.success('Event deleted'); qc.invalidateQueries({ queryKey: ['admin-events'] }); },
  });

  const resetForm = () => { setShowModal(false); setEditId(null); setForm({ title: '', description: '', location: '', startDate: '', endDate: '', imageUrl: '', status: 'DRAFT' }); };

  const startEdit = (event: any) => {
    setEditId(event.id);
    setForm({
      title: event.title, description: event.description, location: event.location || '',
      startDate: event.startDate?.split('T')[0] || '', endDate: event.endDate?.split('T')[0] || '',
      imageUrl: event.imageUrl || '', status: event.status,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Events Management</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{events?.length ?? 0} events</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowModal(true); }}>New Event</Button>
      </div>

      <div className="flex gap-2">
        {(['ALL','DRAFT','PUBLISHED','CANCELLED'] as EventStatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === s ? 'bg-green-700 text-white'
                : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'))}>
            {s}
          </button>
        ))}
      </div>

      {showModal && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>{editId ? 'Edit Event' : 'New Event'}</h3>
            <button onClick={resetForm}><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <div>
              <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
            </div>
            <Input label="Location (optional)" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              <Input label="End Date" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
            <Input label="Image URL (optional)" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
            <div>
              <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.title.trim() || !form.description.trim() || !form.startDate || !form.endDate}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : !events?.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <Calendar className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className="font-medium">No events yet</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className={cn('border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100')}>
              <tr>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Title</th>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Location</th>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Dates</th>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Status</th>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Actions</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-50')}>
              {events.map((e: any) => (
                <tr key={e.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50')}>
                  <td className={cn('px-5 py-3.5 font-medium', isDark ? 'text-white' : 'text-gray-800')}>{e.title}</td>
                  <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{e.location || '—'}</td>
                  <td className={cn('px-5 py-3.5 text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
                    {formatDate(e.startDate)} — {formatDate(e.endDate)}
                  </td>
                  <td className="px-5 py-3.5"><Badge variant={statusVariant(e.status === 'PUBLISHED' ? 'SUCCESS' : e.status === 'CANCELLED' ? 'FAILED' : 'PENDING')}>{e.status}</Badge></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(e)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMutation.mutate(e.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
