import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function UserVerificationPage() {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post('/users/verify-request'),
    onSuccess: (data) => {
      toast.success('Verification request submitted successfully');
      // Update local context
      updateUser({ verificationStatus: 'PENDING' });
      qc.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Failed to submit verification request');
    },
  });

  const status = (user as any)?.verificationStatus || 'UNVERIFIED';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
          Account Verification
        </h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          Verify your account to be able to create support requests
        </p>
      </div>

      <Card className="p-6">
        {status === 'UNVERIFIED' && (
          <div className="text-center py-8">
            <ShieldCheck className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-slate-600' : 'text-gray-300')} />
            <h2 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
              Your Account is Not Verified
            </h2>
            <p className={cn('text-sm mb-6 max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-gray-500')}>
              To ensure trust on our platform, you must verify your identity with your local Kebele Administration before submitting a support request.
            </p>
            <Button size="lg" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
              Request Verification
            </Button>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
              Verification Pending
            </h2>
            <p className={cn('text-sm max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-gray-500')}>
              Your Kebele Admin is currently reviewing your account. You will be notified once it is approved.
            </p>
          </div>
        )}

        {status === 'VERIFIED' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
              Account Verified
            </h2>
            <p className={cn('text-sm max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-gray-500')}>
              Your account is successfully verified. You can now create support requests.
            </p>
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
              Verification Rejected
            </h2>
            <p className={cn('text-sm mb-6 max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-gray-500')}>
              Your verification request was rejected. Please contact your Kebele Admin or update your profile information and try again.
            </p>
            <Button size="lg" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
              Submit Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
