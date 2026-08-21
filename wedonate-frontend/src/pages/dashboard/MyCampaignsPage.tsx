import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Calendar, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function MyCampaignsPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isOrgRole = user && ['NGO','ORGANIZATION','GOVERNMENTAL_ORG'].includes(user.role);
  const isPendingOrg = isOrgRole && (user as any).orgStatus === 'PENDING';
  const isRejectedOrg = isOrgRole && (user as any).orgStatus === 'REJECTED';

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaigns/my').then(r => r.data.data),
    enabled: !isPendingOrg,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('dashboard.my_campaigns')}</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            {t('dashboard.track_campaigns')}
          </p>
        </div>
        {!isPendingOrg && !isRejectedOrg && (
          <Link to="/donate">
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>{t('dashboard.new_campaign')}</Button>
          </Link>
        )}
      </div>

      {isPendingOrg && (
        <Card className={cn('p-8 text-center',
          isDark ? 'bg-amber-900/10 border-amber-700/30' : 'bg-amber-50 border-amber-200')}>
          <AlertTriangle className={cn('w-12 h-12 mx-auto mb-4', isDark ? 'text-amber-400' : 'text-amber-500')} />
          <h3 className={cn('text-lg font-bold mb-2', isDark ? 'text-amber-300' : 'text-amber-800')}>
            Verification Required
          </h3>
          <p className={cn('text-sm max-w-md mx-auto', isDark ? 'text-amber-400/80' : 'text-amber-700')}>
            Your organization registration is pending admin verification. Once verified, you will be able to create and manage campaigns. You can still browse the platform and donate in the meantime.
          </p>
        </Card>
      )}

      {isRejectedOrg && (
        <Card className={cn('p-8 text-center',
          isDark ? 'bg-red-900/10 border-red-700/30' : 'bg-red-50 border-red-200')}>
          <AlertTriangle className={cn('w-12 h-12 mx-auto mb-4', isDark ? 'text-red-400' : 'text-red-500')} />
          <h3 className={cn('text-lg font-bold mb-2', isDark ? 'text-red-300' : 'text-red-800')}>
            Registration Rejected
          </h3>
          <p className={cn('text-sm max-w-md mx-auto', isDark ? 'text-red-400/80' : 'text-red-700')}>
            {(user as any).rejectionReason || 'Your organization registration was rejected. Please contact support for more information.'}
          </p>
        </Card>
      )}

      {!isPendingOrg && !isRejectedOrg && (
        isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !campaigns?.length ? (
          <Card className="text-center py-16">
            <Target className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
            <p className={cn('font-medium', isDark ? 'text-slate-400' : 'text-gray-400')}>{t('dashboard.no_campaigns')}</p>
            <Link to="/donate">
              <Button size="sm" className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> {t('dashboard.create_campaign')}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {campaigns.map((camp: any) => {
              const pct = Math.min((camp.raisedAmount / camp.goalAmount) * 100, 100);
              return (
                <Card key={camp.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>{camp.title}</h3>
                    <Badge variant={statusVariant(camp.status)}>{camp.status}</Badge>
                  </div>
                  <p className={cn('text-xs line-clamp-2 mb-3', isDark ? 'text-slate-400' : 'text-gray-500')}>
                    {camp.description}
                  </p>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-green-500">{formatCurrency(camp.raisedAmount)}</span>
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{Math.round(pct)}% {t('dashboard.of')} {formatCurrency(camp.goalAmount)}</span>
                    </div>
                    <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className={cn('flex items-center justify-between text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>
                    <span className={cn('px-2 py-0.5 rounded-full', isDark ? 'bg-slate-700' : 'bg-gray-100')}>
                      {camp.category}
                    </span>
                    {camp.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(camp.deadline)}
                      </span>
                    )}
                  </div>
                  {camp.adminNote && (
                    <div className={cn('mt-3 text-xs px-3 py-2 rounded-lg',
                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
                      <span className="font-semibold">{t('dashboard.admin_note')}</span> {camp.adminNote}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
