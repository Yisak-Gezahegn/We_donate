import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Clock, Plus, Trash2, Send } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import toast from 'react-hot-toast';

export default function CampaignUpdates({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const isOwner = user?.id === (user as any)?.campaignUserId;

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['campaign-updates', campaignId],
    queryFn: async () => {
      const r = await api.get(`/campaign-updates/campaign/${campaignId}`);
      return r.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/campaign-updates/campaign/${campaignId}`, { title, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-updates', campaignId] });
      setTitle(''); setContent(''); setShowForm(false);
      toast.success('Update posted successfully!');
    },
    onError: () => toast.error('Failed to post update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/campaign-updates/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-updates', campaignId] });
      toast.success('Update deleted');
    },
  });

  if (isLoading) return null;

  return (
    <div className={cn('rounded-2xl p-5 mb-5', isDark ? 'bg-slate-700/50' : 'bg-gray-50')}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('text-sm font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
          <Clock className="w-4 h-4 text-green-600" /> {t('campaign.updates', { defaultValue: 'Campaign Updates' })}
        </h3>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}>
            {t('campaign.newUpdate', { defaultValue: 'New Update' })}
          </Button>
        )}
      </div>

      {showForm && (
        <div className={cn('p-4 rounded-xl mb-4 border', isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200')}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Update title..."
            className={cn('w-full px-3 py-2 rounded-lg text-sm mb-2 border', isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="What's new with this campaign?"
            rows={3}
            className={cn('w-full px-3 py-2 rounded-lg text-sm mb-2 border resize-none', isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={() => createMutation.mutate()}
              disabled={!title.trim() || !content.trim() || createMutation.isPending}
              leftIcon={<Send className="w-3.5 h-3.5" />}>
              {createMutation.isPending ? 'Posting...' : 'Post Update'}
            </Button>
          </div>
        </div>
      )}

      {updates.length === 0 ? (
        <p className={cn('text-xs text-center py-4', isDark ? 'text-slate-500' : 'text-gray-400')}>
          No updates posted yet.
        </p>
      ) : (
        <div className="space-y-3">
          {updates.map((u: any) => (
            <div key={u.id} className={cn('p-3 rounded-xl border-l-4 border-green-500', isDark ? 'bg-slate-800' : 'bg-white')}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{u.title}</h4>
                  <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{u.content}</p>
                  <p className={cn('text-[10px] mt-2', isDark ? 'text-slate-600' : 'text-gray-400')}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {isOwner && (
                  <button onClick={() => deleteMutation.mutate(u.id)}
                    className={cn('p-1 rounded-lg', isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100')}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
