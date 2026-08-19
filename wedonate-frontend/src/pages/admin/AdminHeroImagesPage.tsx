import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Plus, Trash2, X, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';

export default function AdminHeroImagesPage() {
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imageUrl: '', caption: '', sortOrder: 0 });

  const { data: images, isLoading } = useQuery({
    queryKey: ['hero-images-admin'],
    queryFn: () => api.get('/hero-images/all').then(r => r.data.data),
  });

  const addImage = useMutation({
    mutationFn: () => api.post('/hero-images', form),
    onSuccess: () => {
      toast.success('Hero image added');
      qc.invalidateQueries({ queryKey: ['hero-images-admin'] });
      setForm({ imageUrl: '', caption: '', sortOrder: 0 });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteImage = useMutation({
    mutationFn: (id: string) => api.delete(`/hero-images/${id}`),
    onSuccess: () => {
      toast.success('Hero image removed');
      qc.invalidateQueries({ queryKey: ['hero-images-admin'] });
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
            Hero Images Management
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Slideshow images shown on the Home page hero section
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Add Image
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <Card className="relative">
              <div className={cn('flex items-center justify-between px-6 py-5 border-b',
                isDark ? 'border-slate-700' : 'border-gray-100')}>
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  Add Hero Image
                </h2>
                <button onClick={() => { setShowForm(false); setForm({ imageUrl: '', caption: '', sortOrder: 0 }); }}
                  className={cn('p-2 rounded-xl transition-colors',
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <ImageUpload
                  label="Image *"
                  value={form.imageUrl}
                  onChange={url => setForm(p => ({ ...p, imageUrl: url }))}
                  hint="Upload a hero banner image"
                />
                <div>
                  <label className={lbl}>Caption *</label>
                  <input className={inp} placeholder="e.g. Adama City — Heart of Oromia"
                    value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Sort Order (lower = first)</label>
                  <input type="number" className={inp}
                    value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button className="flex-1" size="lg" isLoading={addImage.isPending}
                    onClick={() => {
                      if (!form.imageUrl) { toast.error('Please upload an image first'); return; }
                      if (!form.caption) { toast.error('Caption is required'); return; }
                      addImage.mutate();
                    }}>
                    Add to Slideshow
                  </Button>
                  <Button variant="outline" size="lg" className="px-6"
                    onClick={() => { setShowForm(false); setForm({ imageUrl: '', caption: '', sortOrder: 0 }); }}>
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
      ) : !images?.length ? (
        <Card className="text-center py-16">
          <Image className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-300')} />
          <p className={cn('font-medium mb-1', isDark ? 'text-slate-400' : 'text-gray-400')}>No hero images yet</p>
          <p className={cn('text-sm mb-4', isDark ? 'text-slate-500' : 'text-gray-400')}>
            Add images for the homepage hero slideshow
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add First Image
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img: any) => (
            <div key={img.id} className="group relative rounded-2xl overflow-hidden shadow-md bg-gray-100 aspect-video">
              <img src={img.imageUrl} alt={img.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-sm font-bold line-clamp-1">{img.caption}</p>
                <p className="text-white/60 text-xs mt-0.5">Order: {img.sortOrder}</p>
              </div>
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-all">
                <GripVertical className="w-3 h-3 text-white/70" />
                <span className="text-white text-xs font-medium">#{img.sortOrder}</span>
              </div>
              <button onClick={() => deleteImage.mutate(img.id)}
                className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
