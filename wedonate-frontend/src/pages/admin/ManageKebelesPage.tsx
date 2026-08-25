import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Edit, ShieldCheck, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ManageKebelesPage() {
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKebele, setEditingKebele] = useState<any>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const { data: kebeles = [], isLoading } = useQuery({
    queryKey: ['admin-kebeles'],
    queryFn: async () => {
      const { data } = await api.get('/kebeles');
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => editingKebele ? api.put(`/kebeles/${editingKebele.id}`, data) : api.post('/kebeles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kebeles'] });
      toast.success(editingKebele ? 'Kebele updated' : 'Kebele created');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Action failed'),
  });

  const openModal = (kebele?: any) => {
    if (kebele) {
      setEditingKebele(kebele);
      setName(kebele.name);
      setStatus(kebele.status);
    } else {
      setEditingKebele(null);
      setName('');
      setStatus('ACTIVE');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingKebele(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    mutation.mutate({ name, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Manage Kebeles</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Create and manage city Kebele regions</p>
        </div>
        <Button onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>
          Add Kebele
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn('border-b', isDark ? 'border-slate-700 bg-slate-800/50 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-600')}>
              <tr>
                <th className="px-6 py-4 font-semibold">Kebele Name</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Users Count</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-200')}>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
              ) : kebeles.map((k: any) => (
                <tr key={k.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50')}>
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <MapPin className={cn('w-4 h-4', isDark ? 'text-slate-400' : 'text-gray-400')} />
                    <span className={isDark ? 'text-slate-200' : 'text-gray-900'}>{k.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', k.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{k._count?.users || 0} users</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => openModal(k)} leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h2 className={cn('text-xl font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
              {editingKebele ? 'Edit Kebele' : 'Create New Kebele'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>Kebele Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kebele 01"
                  className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500', isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900')} />
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500', isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={closeModal}>Cancel</Button>
                <Button type="submit" isLoading={mutation.isPending}>{editingKebele ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
