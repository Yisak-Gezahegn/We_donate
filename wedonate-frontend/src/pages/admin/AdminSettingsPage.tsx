import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminSettingsPage() {
  const { isDark } = useTheme();
  const [form, setForm] = useState({
    contactEmail: '', contactPhone: '', address: '',
    facebookUrl: '', twitterUrl: '', instagramUrl: '', telegramUrl: '',
    missionStatement: '', aboutText: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        contactEmail: settings.contactEmail || '', contactPhone: settings.contactPhone || '',
        address: settings.address || '', facebookUrl: settings.facebookUrl || '',
        twitterUrl: settings.twitterUrl || '', instagramUrl: settings.instagramUrl || '',
        telegramUrl: settings.telegramUrl || '', missionStatement: settings.missionStatement || '',
        aboutText: settings.aboutText || '',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings', data),
    onSuccess: () => toast.success('Settings updated'),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Site Settings</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Manage contact information, social links, and site content.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className={cn('font-bold mb-4 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
              <Settings className="w-4 h-4" /> Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Contact Email" type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} />
              <Input label="Contact Phone" value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} />
              <div className="md:col-span-2">
                <Input label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={cn('font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Facebook URL" value={form.facebookUrl} onChange={e => setForm(p => ({ ...p, facebookUrl: e.target.value }))} />
              <Input label="Twitter URL" value={form.twitterUrl} onChange={e => setForm(p => ({ ...p, twitterUrl: e.target.value }))} />
              <Input label="Instagram URL" value={form.instagramUrl} onChange={e => setForm(p => ({ ...p, instagramUrl: e.target.value }))} />
              <Input label="Telegram URL" value={form.telegramUrl} onChange={e => setForm(p => ({ ...p, telegramUrl: e.target.value }))} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={cn('font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>About Content</h3>
            <div className="space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Mission Statement</label>
                <textarea value={form.missionStatement} onChange={e => setForm(p => ({ ...p, missionStatement: e.target.value }))} rows={3}
                  className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>About Text</label>
                <textarea value={form.aboutText} onChange={e => setForm(p => ({ ...p, aboutText: e.target.value }))} rows={5}
                  className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button leftIcon={<Save className="w-4 h-4" />} onClick={() => updateMutation.mutate(form)}
              isLoading={updateMutation.isPending}>
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
