import { useState } from 'react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Save, Camera, BadgeCheck, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(user?.profileImage || '');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      phone:     user?.phone || '',
      kebeleId:  user?.kebeleId || '',
    },
  });

  const { data: kebeles = [] } = useQuery({
    queryKey: ['kebeles', 'active'],
    queryFn: async () => {
      const res = await api.get('/kebeles/active');
      return res.data;
    },
    enabled: user?.role === 'USER', // only needed for users
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/users/profile', data),
    onSuccess: (_res, variables) => {
      updateUser({ firstName: variables.firstName, lastName: variables.lastName, phone: variables.phone, kebeleId: variables.kebeleId });
      toast.success(t('dashboard.profile_updated'));
    },
    onError:   () => toast.error(t('dashboard.profile_update_failed')),
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await api.post('/users/profile/image', { imageUrl: data.data.imageUrl });
      setPreview(data.data.imageUrl);
      updateUser({ profileImage: data.data.imageUrl });
      toast.success(t('dashboard.photo_updated'));
    } catch {
      toast.error(t('dashboard.photo_update_failed'));
      setPreview(user?.profileImage || '');
    } finally {
      setUploading(false);
    }
  };

  const roleLabel = (role: string) => role.replace(/_/g, ' ');

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
        {t('dashboard.my_profile')}
      </h1>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-green-700 flex items-center justify-center shadow-lg">
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
            </div>
            <label className={cn(
              'absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors',
              uploading ? 'bg-gray-400 cursor-wait' : 'bg-green-600 hover:bg-green-700',
            )}>
              {uploading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-4 h-4 text-white" />
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>{user?.email}</p>
            <span className={cn(
              'inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold capitalize',
              isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700',
            )}>
              {roleLabel(user?.role || 'USER')}
            </span>
            {(user as any)?.verificationStatus === 'VERIFIED' && (
              <span className={cn(
                'inline-flex items-center gap-1 mt-2 ml-2 text-xs px-3 py-1 rounded-full font-semibold',
                isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700',
              )}>
                <BadgeCheck className="w-3.5 h-3.5" />
                {(user as any)?.verifiedByRole === 'CITY_ADMIN' ? 'Verified by City Administration' : 
                 (user as any)?.verifiedByRole === 'KEBELE_ADMIN' ? 'Verified by Kebele' : 
                 user?.role === 'ORGANIZATION' ? 'Verified by City Administration' : 
                 user?.role === 'USER' ? 'Verified by Kebele' : 'Verified'}
              </span>
            )}
            <p className={cn('text-xs mt-2', isDark ? 'text-slate-500' : 'text-gray-400')}>
              {t('dashboard.camera_hint')}
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className={cn('text-lg font-bold mb-5', isDark ? 'text-white' : 'text-gray-900')}>
          {t('dashboard.edit_info')}
        </h2>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('dashboard.first_name')} leftIcon={<User className="w-4 h-4" />}
              error={errors.firstName?.message}
              {...register('firstName', { required: t('dashboard.required') })} />
            <Input label={t('dashboard.last_name')} leftIcon={<User className="w-4 h-4" />}
              error={errors.lastName?.message}
              {...register('lastName', { required: t('dashboard.required') })} />
          </div>
          <Input label={t('dashboard.email')} type="email" leftIcon={<Mail className="w-4 h-4" />}
            value={user?.email} disabled className="opacity-60" />
          <Input label={t('dashboard.phone_number')} placeholder="+251 911 234 567"
            leftIcon={<Phone className="w-4 h-4" />} {...register('phone')} />

          {user?.role === 'USER' && (
            <div className="space-y-1.5">
              <label className={cn('block text-sm font-medium', isDark ? 'text-slate-300' : 'text-gray-700')}>
                Kebele
              </label>
              <div className="relative">
                <MapPin className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-gray-400')} />
                <select
                  {...register('kebeleId')}
                  className={cn(
                    'w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none',
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  )}
                >
                  <option value="">-- Select your Kebele --</option>
                  {kebeles.map((k: any) => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Button type="submit" isLoading={updateMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}>
            {t('dashboard.save_changes')}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className={cn('text-base font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
          {t('dashboard.account_info')}
        </h2>
        <dl className="space-y-3">
          {[
            { label: t('dashboard.role'),    value: roleLabel(user?.role || '') },
            { label: t('dashboard.user_id'), value: user?.id?.slice(0, 16) + '…', mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between text-sm">
              <dt className={isDark ? 'text-slate-400' : 'text-gray-500'}>{label}</dt>
              <dd className={cn('font-semibold', mono ? 'font-mono text-xs' : '',
                isDark ? 'text-slate-200' : 'text-gray-800')}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
