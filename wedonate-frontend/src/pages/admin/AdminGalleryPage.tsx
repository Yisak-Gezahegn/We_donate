import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';

export default function AdminGalleryPage() {
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imageUrl: '', title: '', description: '' });

  const { data: photos, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.get('/gallery').then(r => r.data.data),
  });

  const addPhoto = useMutation({
    mutationFn: () => api.post('/gallery', form),
    onSuccess: () => {
      toast.success('Photo added to gallery');
      qc.invalidateQueries({ queryKey: ['gallery'] });
      setForm({ imageUrl: '', title: '', description: '' });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deletePhoto = useMutation({
    mutationFn: (id: string) => api.delete(`/gallery/${id}`),
    onSuccess: () => {
      toast.success('Photo removed');
      qc.invalidateQueries({ queryKey: ['gallery'] });
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
            Gallery Management
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Photos shown in the About page community gallery
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Add Photo
        </Button>
      </div>

      {/* ── Add Photo Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <Card className="relative">
              {/* Header */}
              <div className={cn('flex items-center justify-between px-6 py-5 border-b',
                isDark ? 'border-slate-700' : 'border-gray-100')}>
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  Add Gallery Photo
                </h2>
                <button
                  onClick={() => { setShowForm(false); setForm({ imageUrl: '', title: '', description: '' }); }}
                  className={cn('p-2 rounded-xl transition-colors',
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Image upload from folder */}
                <ImageUpload
                  label="Photo *"
                  value={form.imageUrl}
                  onChange={url => setForm(p => ({ ...p, imageUrl: url }))}
                  hint="Choose a photo from your computer"
                />

                {/* Title */}
                <div>
                  <label className={lbl}>Title *</label>
                  <input className={inp} placeholder="e.g. Adama City Center"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>Description (optional)</label>
                  <textarea rows={3} className={cn(inp, 'resize-none')}
                    placeholder="Brief description shown on hover..."
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    className="flex-1"
                    size="lg"
                    isLoading={addPhoto.isPending}
                    onClick={() => {
                      if (!form.imageUrl) { toast.error('Please upload a photo first'); return; }
                      if (!form.title) { toast.error('Title is required'); return; }
                      addPhoto.mutate();
                    }}>
                    Add to Gallery
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-6"
                    onClick={() => { setShowForm(false); setForm({ imageUrl: '', title: '', description: '' }); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Gallery Grid ── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !photos?.length ? (
        <Card className="text-center py-16">
          <Image className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-300')} />
          <p className={cn('font-medium mb-1', isDark ? 'text-slate-400' : 'text-gray-400')}>No photos yet</p>
          <p className={cn('text-sm mb-4', isDark ? 'text-slate-500' : 'text-gray-400')}>
            Add photos to show in the About page gallery
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add First Photo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p: any) => (
            <div key={p.id} className="group relative rounded-2xl overflow-hidden shadow-md bg-gray-100"
              style={{ height: '180px' }}>
              <img
                src={p.imageUrl}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-xs font-bold line-clamp-1">{p.title}</p>
                {p.description && (
                  <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{p.description}</p>
                )}
              </div>
              {/* Delete button */}
              <button
                onClick={() => deletePhoto.mutate(p.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600
                  rounded-full flex items-center justify-center text-white
                  opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
