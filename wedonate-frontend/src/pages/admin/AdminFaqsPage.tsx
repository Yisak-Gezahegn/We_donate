import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit3, X, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function AdminFaqsPage() {
  const { isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', sortOrder: 0, isActive: true });
  const qc = useQueryClient();

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: () => api.get('/faqs').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/faqs', data),
    onSuccess: () => { toast.success('FAQ created'); qc.invalidateQueries({ queryKey: ['admin-faqs'] }); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/faqs/${id}`, data),
    onSuccess: () => { toast.success('FAQ updated'); qc.invalidateQueries({ queryKey: ['admin-faqs'] }); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/faqs/${id}`),
    onSuccess: () => { toast.success('FAQ deleted'); qc.invalidateQueries({ queryKey: ['admin-faqs'] }); },
  });

  const resetForm = () => { setShowModal(false); setEditId(null); setForm({ question: '', answer: '', sortOrder: 0, isActive: true }); };

  const startEdit = (faq: any) => {
    setEditId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isActive: faq.isActive });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const moveOrder = (faq: any, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? faq.sortOrder - 1 : faq.sortOrder + 1;
    updateMutation.mutate({ id: faq.id, data: { sortOrder: Math.max(0, newOrder) } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>FAQ Management</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{faqs?.length ?? 0} FAQs</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowModal(true); }}>New FAQ</Button>
      </div>

      {showModal && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}>{editId ? 'Edit FAQ' : 'New FAQ'}</h3>
            <button onClick={resetForm}><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Question *</label>
              <input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')} />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Answer *</label>
              <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={4}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                  className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-green-600 rounded" />
                  <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-gray-700')}>Active</span>
                </label>
              </div>
            </div>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.question.trim() || !form.answer.trim()}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : !faqs?.length ? (
        <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
          <HelpCircle className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className="font-medium">No FAQs yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq: any) => (
            <Card key={faq.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveOrder(faq, 'up')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => moveOrder(faq, 'down')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"><ArrowDown className="w-3 h-3" /></button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{faq.question}</h4>
                    <Badge variant={faq.isActive ? 'success' : 'default'}>{faq.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{faq.answer}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(faq)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteMutation.mutate(faq.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
