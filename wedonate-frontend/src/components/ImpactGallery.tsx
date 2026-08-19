import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, X, PartyPopper } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import toast from 'react-hot-toast';

export default function ImpactGallery({ campaign }: { campaign: any }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(campaign.successPhotoUrl || '');
  const [note, setNote] = useState(campaign.successNote || '');
  const isOwner = user?.id === campaign.userId;
  const isCompleted = campaign.status === 'COMPLETED' && campaign.successPhotoUrl;

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/campaigns/${campaign.id}/success-photo`, {
        successPhotoUrl: photoUrl,
        successNote: note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] });
      setShowForm(false);
      toast.success('Impact photo submitted! Campaign marked as completed.');
    },
    onError: () => toast.error('Failed to submit impact photo'),
  });

  // Show completed impact gallery
  if (isCompleted) {
    return (
      <div className={cn('rounded-2xl overflow-hidden mb-5', isDark ? 'bg-slate-700/50' : 'bg-gray-50')}>
        <div className="p-4 border-b border-green-500/20">
          <h3 className={cn('text-sm font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
            <PartyPopper className="w-4 h-4 text-green-600" /> Impact Gallery
          </h3>
        </div>
        <div className="relative">
          <img src={campaign.successPhotoUrl} alt="Campaign Impact"
            className="w-full h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
              ✓ Campaign Completed
            </span>
            {campaign.successNote && (
              <p className="text-white text-sm font-medium">{campaign.successNote}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show upload form for owner if goal is met
  const goalMet = campaign.goalAmount && campaign.raisedAmount >= campaign.goalAmount;

  if (!isOwner || !goalMet) return null;

  return (
    <div className={cn('rounded-2xl p-4 mb-5 border-2 border-dashed', isDark ? 'border-green-700 bg-slate-700/30' : 'border-green-300 bg-green-50/50')}>
      <div className="flex items-center gap-3 mb-3">
        <Camera className="w-5 h-5 text-green-600" />
        <div>
          <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Goal Reached! 🎉</h3>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Upload a success photo to show donors the impact of their contribution
          </p>
        </div>
      </div>

      {showForm ? (
        <div className="space-y-3">
          <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
            placeholder="Paste image URL (success photo)"
            className={cn('w-full px-3 py-2 rounded-lg text-sm border',
              isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Write a note about the impact (e.g., 'We bought 50 bags of flour for 20 families!')"
            rows={2}
            className={cn('w-full px-3 py-2 rounded-lg text-sm border resize-none',
              isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={() => submitMutation.mutate()}
              disabled={!photoUrl.trim() || submitMutation.isPending}
              leftIcon={<Upload className="w-3.5 h-3.5" />}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Impact Photo'}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={() => setShowForm(true)}
          leftIcon={<Camera className="w-3.5 h-3.5" />}>
          Upload Success Photo
        </Button>
      )}
    </div>
  );
}
