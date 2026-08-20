import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit3, X, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, formatDate } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminNewsPage() {
  const { isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '', isPublished: false });
  const qc = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => api.get('/news').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/news', data),
    onSuccess: () => { toast.success('News created'); qc.invalidateQueries({ queryKey: ['admin-news'] }); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/news/${id}`, data),
    onSuccess: () => { toast.success('News updated'); qc.invalidateQueries({ queryKey: ['admin-news'] }); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/news/${id}`),
    onSuccess: () => { toast.success('News deleted'); qc.invalidateQueries({ queryKey: ['admin-news'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const resetForm = () => { setShowModal(false); setEditId(null); setForm({ title: '', content: '', imageUrl: '', isPublished: false }); };

  const startEdit = (article: any) => {
    setEditId(article.id);
    setForm({ title: article.title, content: article.content, imageUrl: article.imageUrl || '', isPublished: article.isPublished });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>News Management</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{articles?.length ?? 0} articles</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowModal(true); }}>New Article</Button>
      </div>

      {showModal && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>{editId ? 'Edit Article' : 'New Article'}</h3>
            <button onClick={resetForm}><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <div>
              <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Content *</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
            </div>
            <Input label="Image URL (optional)" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                className="w-4 h-4 text-green-600 rounded" />
              <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-gray-700')}>Published</span>
            </label>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.title.trim() || !form.content.trim()}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : !articles?.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <Newspaper className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className="font-medium">No news articles yet</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className={cn('border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100')}>
              <tr>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Title</th>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Status</th>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Date</th>
                <th className={cn('text-left px-5 py-3.5 font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>Actions</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-slate-700' : 'divide-gray-50')}>
              {articles.map((a: any) => (
                <tr key={a.id} className={cn('transition-colors', isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50')}>
                  <td className={cn('px-5 py-3.5 font-medium', isDark ? 'text-white' : 'text-gray-800')}>{a.title}</td>
                  <td className="px-5 py-3.5"><Badge variant={a.isPublished ? 'success' : 'warning'}>{a.isPublished ? 'Published' : 'Draft'}</Badge></td>
                  <td className={cn('px-5 py-3.5', isDark ? 'text-slate-400' : 'text-gray-500')}>{formatDate(a.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMutation.mutate(a.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
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
