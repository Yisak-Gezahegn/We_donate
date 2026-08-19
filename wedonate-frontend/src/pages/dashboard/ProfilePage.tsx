import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ProfilePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(user?.profileImage || '');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      phone:     '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/users/profile', data),
    onSuccess: () => toast.success('Profile updated!'),
    onError:   () => toast.error('Failed to update profile'),
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Then update profile image
      await api.post('/users/profile/image', { imageUrl: data.data.imageUrl });
      setPreview(data.data.imageUrl);
      toast.success('Profile picture updated!');
      // Update cached user
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        u.profileImage = data.data.imageUrl;
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch {
      toast.error('Failed to upload image');
      setPreview(user?.profileImage || '');
    } finally {
      setUploading(false);
    }
  };

  const roleLabel = (role: string) => role.replace(/_/g, ' ');

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
        My Profile
      </h1>

      {/* Profile picture card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with upload */}
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
            {/* Camera button overlay */}
            <label className={cn(
              'absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors',
              uploading
                ? 'bg-gray-400 cursor-wait'
                : 'bg-green-600 hover:bg-green-700',
            )}>
              {uploading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-4 h-4 text-white" />
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
            </label>
          </div>

          {/* Info */}
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
            <p className={cn('text-xs mt-2', isDark ? 'text-slate-500' : 'text-gray-400')}>
              Click the camera icon to change your profile picture
            </p>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card padding="lg">
        <h2 className={cn('text-lg font-bold mb-5', isDark ? 'text-white' : 'text-gray-900')}>
          Edit Information
        </h2>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" leftIcon={<User className="w-4 h-4" />}
              error={errors.firstName?.message}
              {...register('firstName', { required: 'Required' })} />
            <Input label="Last Name" leftIcon={<User className="w-4 h-4" />}
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Required' })} />
          </div>
          <Input label="Email" type="email" leftIcon={<Mail className="w-4 h-4" />}
            value={user?.email} disabled className="opacity-60" />
          <Input label="Phone Number" placeholder="+251 911 234 567"
            leftIcon={<Phone className="w-4 h-4" />} {...register('phone')} />
          <Button type="submit" isLoading={updateMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Account info */}
      <Card>
        <h2 className={cn('text-base font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
          Account Information
        </h2>
        <dl className="space-y-3">
          {[
            { label: 'Role',    value: roleLabel(user?.role || '') },
            { label: 'User ID', value: user?.id?.slice(0, 16) + '…', mono: true },
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
