import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Calendar, AlertTriangle, Eye, X, Users, Clock, FileText, Landmark, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { statusVariant } from '../../components/ui/Badge';
import ImageUpload from '../../components/ui/ImageUpload';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';

const CAMPAIGN_CATEGORIES = [
  { value: 'INFRASTRUCTURE', label: '🏗️ Infrastructure' },
  { value: 'EDUCATION', label: '📚 Education' },
  { value: 'HEALTH', label: '🏥 Health & Medical' },
  { value: 'EMERGENCY', label: '🆘 Emergency Relief' },
  { value: 'OTHER', label: '🤝 Other' },
];

function CreateCampaignForm({ isDark, onSuccess }: { isDark: boolean; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'OTHER', goalAmount: '', deadline: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  
  // Payment accounts
  const [telebirrAccount, setTelebirrAccount] = useState('');
  const [cbeAccount, setCbeAccount] = useState('');
  const [boaAccount, setBoaAccount] = useState('');
  const [awashAccount, setAwashAccount] = useState('');
  const [otherBankName, setOtherBankName] = useState('');
  const [otherBankAccount, setOtherBankAccount] = useState('');

  // Contact for item donations
  const [requesterPhone, setRequesterPhone] = useState('');

  // Admin-only documents
  const [supportLetterUrl, setSupportLetterUrl] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.goalAmount)
      return toast.error('Please fill all required fields');

    setLoading(true);
    try {
      await api.post('/campaigns', {
        ...form,
        telebirrAccount, cbeAccount, boaAccount, awashAccount,
        otherBankName, otherBankAccount,
        requesterPhone,
        supportLetterUrl,
        additionalNotes,
      });
      toast.success('Campaign submitted for admin approval!');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    } finally { setLoading(false); }
  };

  const input = cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors',
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900');
  const label = cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700');

  return (
    <Card className="max-w-2xl mx-auto" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
            isDark ? 'bg-green-900/40' : 'bg-green-100')}>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Create a Campaign</h2>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
              Campaigns need admin approval before going live
            </p>
          </div>
        </div>
        <button onClick={onSuccess} className={cn('p-2 rounded-xl transition-colors', isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={label}>Campaign Title *</label>
          <input className={input} placeholder="e.g. Build a Community Library"
            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        <div>
          <label className={label}>Description *</label>
          <textarea rows={4} className={cn(input, 'resize-none')}
            placeholder="Describe your campaign — why it's important, how funds will be used, and the expected impact..."
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Category *</label>
            <select className={input} value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CAMPAIGN_CATEGORIES.filter(c => c.value).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Goal Amount (ETB) *</label>
            <input type="number" className={input} placeholder="e.g. 50000"
              value={form.goalAmount} onChange={e => setForm(p => ({ ...p, goalAmount: e.target.value }))} min="1" />
          </div>
        </div>

        <div>
          <label className={label}>Deadline (optional)</label>
          <input type="date" className={input}
            value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
        </div>

        <ImageUpload label="Campaign Cover Photo (optional)" value={form.imageUrl}
          onChange={url => setForm(p => ({ ...p, imageUrl: url }))}
          hint="A compelling photo makes your campaign more trustworthy" />

        <div className={cn('rounded-2xl border p-4 space-y-3',
          isDark ? 'border-slate-600 bg-slate-700/30' : 'border-green-100 bg-green-50')}>
          <p className={cn('text-sm font-bold', isDark ? 'text-green-400' : 'text-green-700')}>💳 Your Payment Accounts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={label}>TeleBirr</label><input className={input} value={telebirrAccount} onChange={e => setTelebirrAccount(e.target.value)} /></div>
            <div><label className={label}>CBE</label><input className={input} value={cbeAccount} onChange={e => setCbeAccount(e.target.value)} /></div>
            <div><label className={label}>BOA</label><input className={input} value={boaAccount} onChange={e => setBoaAccount(e.target.value)} /></div>
            <div><label className={label}>Awash</label><input className={input} value={awashAccount} onChange={e => setAwashAccount(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={label}>Other Bank Name</label><input className={input} value={otherBankName} onChange={e => setOtherBankName(e.target.value)} /></div>
            <div><label className={label}>Other Bank Account</label><input className={input} value={otherBankAccount} onChange={e => setOtherBankAccount(e.target.value)} /></div>
          </div>
          <div className={cn('mt-4 pt-4 border-t', isDark ? 'border-slate-600' : 'border-green-200')}>
            <p className={cn('text-sm font-bold mb-2', isDark ? 'text-blue-400' : 'text-blue-700')}>📞 Contact for Item Donations</p>
            <div><label className={label}>Your Phone Number</label><input className={input} value={requesterPhone} onChange={e => setRequesterPhone(e.target.value)} /></div>
          </div>
        </div>

        <div className={cn('rounded-2xl border p-4 space-y-4',
          isDark ? 'border-slate-600 bg-slate-700/30' : 'border-amber-100 bg-amber-50')}>
          <div>
            <p className={cn('text-sm font-bold', isDark ? 'text-amber-400' : 'text-amber-700')}>🔒 Documents for Admin Review</p>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>These documents are only visible to admins.</p>
          </div>
          <ImageUpload
            label="Support Letter (official letter or ID)"
            value={supportLetterUrl}
            onChange={setSupportLetterUrl}
          />
          <div>
            <label className={label}>Additional Notes for Admin</label>
            <textarea rows={3}
              value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
              className={cn(input, 'resize-none')} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" size="lg" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Submit for Approval
          </Button>
          <Button variant="ghost" onClick={onSuccess}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

function DetailRow({ label, value, isDark }: { label: string; value?: string | null; isDark: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className={cn('text-xs font-semibold w-36 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>{label}</span>
      <span className={cn('text-xs flex-1 break-words', isDark ? 'text-slate-200' : 'text-gray-800')}>{value}</span>
    </div>
  );
}

function CampaignDetailModal({ campaignId, onClose, isDark }: { campaignId: string; onClose: () => void; isDark: boolean }) {
  const { t } = useTranslation();
  const { data: camp, isLoading } = useQuery({
    queryKey: ['campaign-detail', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}`).then(r => r.data.data),
    enabled: !!campaignId,
  });

  if (!camp) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative z-10 w-full max-w-2xl p-10 flex items-center justify-center">
          {isLoading
            ? <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            : <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>Campaign not found</p>}
        </Card>
      </div>
    );
  }

  const pct = Math.min((camp.raisedAmount / camp.goalAmount) * 100, 100);
  const accounts = [
    { label: 'TeleBirr', value: camp.telebirrAccount },
    { label: 'CBE', value: camp.cbeAccount },
    { label: 'BOA', value: camp.boaAccount },
    { label: 'Awash', value: camp.awashAccount },
    { label: camp.otherBankName || 'Other Bank', value: camp.otherBankAccount },
  ].filter(a => a.value);
  const docs = [
    { label: 'Support Letter', url: camp.supportLetterUrl },
  ].filter(d => d.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className={cn('sticky top-0 z-10 border-b',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100')}>
          <div className={cn('h-40 w-full overflow-hidden rounded-t-xl', !camp.imageUrl && 'bg-gradient-to-br from-green-500 to-emerald-700')}>
            {camp.imageUrl && <img src={camp.imageUrl} alt={camp.title} className="w-full h-full object-cover" />}
          </div>
          <div className="flex items-start justify-between gap-3 px-6 py-4">
            <div>
              <h2 className={cn('text-lg font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{camp.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={statusVariant(camp.status)}>{camp.status}</Badge>
                <Badge>{camp.category}</Badge>
                {camp.isPublished && <Badge variant="info">Published</Badge>}
              </div>
            </div>
            <button onClick={onClose}
              className={cn('p-2 rounded-xl transition-colors shrink-0',
                isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className={cn('rounded-xl p-4', isDark ? 'bg-slate-700/30' : 'bg-gray-50')}>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className={cn('text-[10px] font-semibold uppercase mb-1', isDark ? 'text-slate-500' : 'text-gray-400')}>Raised</p>
                <p className="text-sm font-bold text-green-500">{formatCurrency(camp.raisedAmount)}</p>
              </div>
              <div>
                <p className={cn('text-[10px] font-semibold uppercase mb-1', isDark ? 'text-slate-500' : 'text-gray-400')}>Goal</p>
                <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{formatCurrency(camp.goalAmount)}</p>
              </div>
              <div>
                <p className={cn('text-[10px] font-semibold uppercase mb-1 flex items-center gap-1', isDark ? 'text-slate-500' : 'text-gray-400')}>
                  <Users className="w-3 h-3" /> Donations
                </p>
                <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{camp._count?.donations ?? camp.donations?.length ?? 0}</p>
              </div>
            </div>
            <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className={cn('text-xs mt-2 text-right font-medium', isDark ? 'text-slate-400' : 'text-gray-500')}>
              {Math.round(pct)}% {t('dashboard.of')} {t('dashboard.goal')}
            </p>
          </div>

          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-2', isDark ? 'text-slate-500' : 'text-gray-400')}>About this campaign</h3>
            <p className={cn('text-sm leading-relaxed whitespace-pre-line', isDark ? 'text-slate-300' : 'text-gray-600')}>{camp.description}</p>
          </div>

          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3', isDark ? 'text-slate-500' : 'text-gray-400')}>Campaign Information</h3>
            <div className={cn('rounded-xl p-4 space-y-2', isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-gray-50 border border-gray-200')}>
              <DetailRow label="Created" value={camp.createdAt ? formatDate(camp.createdAt) : null} isDark={isDark} />
              <DetailRow label="Last Updated" value={camp.updatedAt ? formatDate(camp.updatedAt) : null} isDark={isDark} />
              <DetailRow label="Deadline" value={camp.deadline ? formatDate(camp.deadline) : null} isDark={isDark} />
              {camp.deadline && (() => {
                const daysLeft = Math.ceil((new Date(camp.deadline).getTime() - Date.now()) / 86400000);
                return (
                  <DetailRow label="Time Remaining" value={
                    daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
                    : new Date(camp.deadline).getTime() > 0 ? 'Deadline passed'
                    : null
                  } isDark={isDark} />
                );
              })()}
              <DetailRow label="Campaign ID" value={camp.id} isDark={isDark} />
            </div>
          </div>

          {accounts.length > 0 && (
            <div>
              <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
                <Landmark className="w-3.5 h-3.5" /> Payment Accounts
              </h3>
              <div className="space-y-1">
                {accounts.map(a => (
                  <div key={a.label} className={cn('text-xs px-3 py-2 rounded-lg flex justify-between',
                    isDark ? 'bg-slate-700' : 'bg-gray-100')}>
                    <span className="font-semibold">{a.label}:</span>
                    <span className="font-mono">{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(docs.length > 0 || camp.fanNumber || camp.additionalNotes) && (
            <div>
              <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
                <FileText className="w-3.5 h-3.5" /> Documents & Notes
              </h3>
              <div className={cn('rounded-xl p-4 space-y-2', isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-gray-50 border border-gray-200')}>
                {docs.map(d => (
                  <a key={d.label} href={d.url} target="_blank" rel="noreferrer"
                    className={cn('flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors group',
                      isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200')}>
                    <span className="font-semibold">{d.label}</span>
                    <span className="font-medium text-green-600 dark:text-green-400 underline">View document</span>
                  </a>
                ))}
                <DetailRow label="FAN Number" value={camp.fanNumber} isDark={isDark} />
                <DetailRow label="Additional Notes" value={camp.additionalNotes} isDark={isDark} />
              </div>
            </div>
          )}

          <div>
            <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3', isDark ? 'text-slate-500' : 'text-gray-400')}>
              Recent Donations ({camp.donations?.length ?? 0})
            </h3>
            {!camp.donations?.length ? (
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>No donations received yet.</p>
            ) : (
              <div className="space-y-2">
                {camp.donations.map((don: any) => {
                  const name = don.isAnonymous ? t('dashboard.anonymous')
                    : [don.donor?.firstName, don.donor?.lastName].filter(Boolean).join(' ') || t('dashboard.anonymous');
                  return (
                    <div key={don.id} className={cn('flex items-center justify-between px-3 py-2.5 rounded-lg',
                      isDark ? 'bg-slate-700/50' : 'bg-gray-50')}>
                      <div className="min-w-0">
                        <p className={cn('text-xs font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>{name}</p>
                        <p className={cn('text-[10px] flex items-center gap-1', isDark ? 'text-slate-500' : 'text-gray-400')}>
                          <Clock className="w-2.5 h-2.5" /> {formatDate(don.createdAt)}
                          {don.paymentMethod ? ` • ${don.paymentMethod.replace(/_/g, ' ')}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge variant={statusVariant(don.paymentStatus)}>{don.paymentStatus}</Badge>
                        <span className="text-xs font-bold text-green-500">
                          {don.donationType === 'ITEM'
                            ? (don.itemDescription ? `Item: ${don.itemDescription}` : 'In-kind')
                            : formatCurrency(don.amount || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {camp.successPhotoUrl && (
            <div>
              <h3 className={cn('text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Impact Proof
              </h3>
              <img src={camp.successPhotoUrl} alt="Success" className="w-full rounded-xl object-cover max-h-64" />
              {camp.successNote && (
                <p className={cn('text-xs mt-2 italic', isDark ? 'text-slate-400' : 'text-gray-500')}>{camp.successNote}</p>
              )}
            </div>
          )}

          {camp.adminNote && (
            <div className={cn('text-xs px-4 py-3 rounded-xl',
              isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
              <span className="font-semibold">{t('dashboard.admin_note')}</span> {camp.adminNote}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function MyCampaignsPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isOrgRole = user && ['ORGANIZATION'].includes(user.role);
  const isPendingOrg = isOrgRole && (user as any).verificationStatus === 'PENDING';
  const isRejectedOrg = isOrgRole && (user as any).verificationStatus === 'REJECTED';

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaigns/my').then(r => r.data.data),
    enabled: !isPendingOrg,
  });

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return (
      <div className="space-y-6">
        <CreateCampaignForm 
          isDark={isDark} 
          onSuccess={() => {
            setIsCreating(false);
            window.location.reload(); // Refresh the campaign list
          }} 
        />
      </div>
    );
  }

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
          <Button size="sm" onClick={() => setIsCreating(true)} leftIcon={<Plus className="w-4 h-4" />}>{t('dashboard.new_campaign')}</Button>
        )}
      </div>

      {isPendingOrg && (
        <Card className={cn('p-8 text-center',
          isDark ? 'bg-amber-900/10 border-amber-700/30' : 'bg-amber-50 border-amber-200')}>
          <AlertTriangle className={cn('w-12 h-12 mx-auto mb-4', isDark ? 'text-amber-400' : 'text-amber-500')} />
          <h3 className={cn('text-lg font-bold mb-2', isDark ? 'text-amber-300' : 'text-amber-800')}>
            Organization verification pending
          </h3>
          <p className={cn('text-sm max-w-md mx-auto', isDark ? 'text-amber-400/80' : 'text-amber-700')}>
            City Administration is reviewing your organization. Campaign creation becomes available after approval. You may still browse and donate.
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
            <Button size="sm" className="mt-4" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" /> {t('dashboard.create_campaign')}
            </Button>
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
                  <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setViewingId(camp.id)}>
                    <Eye className="w-4 h-4" /> View Details
                  </Button>
                </Card>
              );
            })}
          </div>
        )
      )}

      {viewingId && (
        <CampaignDetailModal campaignId={viewingId} onClose={() => setViewingId(null)} isDark={isDark} />
      )}
    </div>
  );
}
