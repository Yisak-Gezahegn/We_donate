import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Quote, Plus, Trash2, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminTestimonialsPage() {
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', text: '', avatar: '', rating: 5 });

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials-admin'],
    queryFn: () => api.get('/testimonials/all').then(r => r.data.data),
  });

  const addTestimonial = useMutation({
    mutationFn: () => api.post('/testimonials', form),
    onSuccess: () => {
      toast.success('Testimonial added');
      qc.invalidateQueries({ queryKey: ['testimonials-admin'] });
      setForm({ name: '', role: '', text: '', avatar: '', rating: 5 });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteTestimonial = useMutation({
    mutationFn: (id: string) => api.delete(`/testimonials/${id}`),
    onSuccess: () => {
      toast.success('Testimonial removed');
      qc.invalidateQueries({ queryKey: ['testimonials-admin'] });
    },
  });

  const inp = cn(
    'w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900',
  );
  const lbl = cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
            Testimonials Management
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Testimonials shown on the Home page
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Add Testimonial
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <Card className="relative">
              <div className={cn('flex items-center justify-between px-6 py-5 border-b',
                isDark ? 'border-slate-700' : 'border-gray-100')}>
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  Add Testimonial
                </h2>
                <button onClick={() => { setShowForm(false); setForm({ name: '', role: '', text: '', avatar: '', rating: 5 }); }}
                  className={cn('p-2 rounded-xl transition-colors',
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Name *</label>
                    <input className={inp} placeholder="e.g. Liya Tadesse"
                      value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Role *</label>
                    <input className={inp} placeholder="e.g. Donor"
                      value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Testimonial Text *</label>
                  <textarea rows={3} className={cn(inp, 'resize-none')}
                    placeholder="What they said..."
                    value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Avatar Initials (optional)</label>
                    <input className={inp} placeholder="e.g. LT" maxLength={2}
                      value={form.avatar} onChange={e => setForm(p => ({ ...p, avatar: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Rating (1-5)</label>
                    <input type="number" min={1} max={5} className={inp}
                      value={form.rating} onChange={e => setForm(p => ({ ...p, rating: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button className="flex-1" size="lg" isLoading={addTestimonial.isPending}
                    onClick={() => {
                      if (!form.name || !form.role || !form.text) { toast.error('Name, role, and text are required'); return; }
                      addTestimonial.mutate();
                    }}>
                    Add Testimonial
                  </Button>
                  <Button variant="outline" size="lg" className="px-6"
                    onClick={() => { setShowForm(false); setForm({ name: '', role: '', text: '', avatar: '', rating: 5 }); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !testimonials?.length ? (
        <Card className="text-center py-16">
          <Quote className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-300')} />
          <p className={cn('font-medium mb-1', isDark ? 'text-slate-400' : 'text-gray-400')}>No testimonials yet</p>
          <p className={cn('text-sm mb-4', isDark ? 'text-slate-500' : 'text-gray-400')}>
            Add testimonials to show on the Home page
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add First Testimonial
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t: any) => (
            <Card key={t.id} className="relative group">
              <button onClick={() => deleteTestimonial.mutate(t.id)}
                className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <Quote className={cn('w-6 h-6 mb-3', isDark ? 'text-green-800' : 'text-green-200')} />
              <p className={cn('text-sm italic mb-4', isDark ? 'text-slate-300' : 'text-gray-600')}>
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-xs">
                  {t.avatar || t.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-800')}>{t.name}</p>
                  <p className="text-xs text-green-500">{t.role}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(t.rating || 5)].map((_, s) => (
                    <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
