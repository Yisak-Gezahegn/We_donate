import { useState } from 'react';
import { Link } from 'react-router-dom';
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

import ImageUpload from '../../components/ui/ImageUpload';

export default function UserVerificationPage() {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [idFront, setIdFront] = useState('');
  const [idBack, setIdBack] = useState('');
  const [fanNumber, setFanNumber] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/users/verify-request', data),
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
        {(status === 'UNVERIFIED' || status === 'CHANGES_REQUESTED' || status === 'REJECTED') && (
          <div className="space-y-5 py-4">
            <div className="text-center mb-6">
              <ShieldCheck className={cn('w-12 h-12 mx-auto mb-2', isDark ? 'text-slate-600' : 'text-gray-300')} />
              <h2 className={cn('text-xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
                Identity Verification
              </h2>
              <p className={cn('text-sm max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-gray-500')}>
                To ensure trust on our platform, you must verify your identity with your local Kebele Administration before submitting a support request.
              </p>
            </div>
            
            {!(user as any)?.kebeleId ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <h3 className={cn('text-lg font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>Kebele Required</h3>
                <p className={cn('text-sm mb-4', isDark ? 'text-slate-400' : 'text-gray-500')}>
                  Please select your Kebele before submitting your account for verification.
                </p>
                <Link to="/dashboard/profile">
                  <Button>Go to Profile</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                      National ID (Front) *
                    </label>
                    <ImageUpload label="" value={idFront} onChange={setIdFront} hint="Upload front of ID" />
                  </div>
                  <div>
                    <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                      National ID (Back) *
                    </label>
                    <ImageUpload label="" value={idBack} onChange={setIdBack} hint="Upload back of ID" />
                  </div>
                </div>

                <div>
                  <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
                    FAN Number (Federal Admin Number) *
                  </label>
                  <input type="text" value={fanNumber} onChange={e => setFanNumber(e.target.value)}
                    className={cn('w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 outline-none',
                      isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-green-500 focus:ring-green-500/20' 
                             : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500 focus:ring-green-500/20'
                    )} placeholder="Enter your FAN number" />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button size="lg" isLoading={mutation.isPending} 
                    disabled={!idFront || !idBack || !fanNumber}
                    onClick={() => mutation.mutate({ nationalIdFrontUrl: idFront, nationalIdBackUrl: idBack, fanNumber })}>
                    Submit Verification
                  </Button>
                </div>
              </>
            )}
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


      </Card>
    </div>
  );
}
