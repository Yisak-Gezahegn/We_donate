import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, X, FileText, Eye, Heart, CreditCard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge, { statusVariant } from '../../components/ui/Badge';
import ImageUpload from '../../components/ui/ImageUpload';

const CATEGORIES = [
  { value: 'FOOD', label: '🍞 Food' },
  { value: 'MEDICINE', label: '💊 Medicine' },
  { value: 'CLOTHES', label: '👕 Clothing' },
  { value: 'MONEY', label: '💰 Financial Aid' },
  { value: 'OTHER', label: '🤲 Other' },
];

const URGENCY_LABELS: Record<number, string> = {
  1: '🟢 Standard',
  2: '🟡 Medium',
  3: '🟠 High',
  4: '🔴 Critical',
  5: '🚨 Emergency',
};

function DetailRow({ label, value, isDark }: { label: string; value?: string | null; isDark: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className={cn('text-xs font-semibold w-28 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>{label}</span>
      <span className={cn('text-xs flex-1 break-words', isDark ? 'text-slate-200' : 'text-gray-800')}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon, children, isDark }: { icon?: ReactNode; children: ReactNode; isDark: boolean }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2',
      isDark ? 'text-slate-400' : 'text-gray-500')}>
      {icon}{children}
    </p>
  );
}

function RequestDetailModal({ requestId, onClose, isDark }: { requestId: string | null; onClose: () => void; isDark: boolean }) {
  const { data: req, isLoading } = useQuery({
    queryKey: ['request-detail', requestId],
    queryFn: () => api.get(`/support-requests/${requestId}`).then(r => r.data.data),
    enabled: !!requestId,
  });

  if (!requestId) return null;

  const accounts = [
    { label: 'TeleBirr', value: req?.telebirrAccount },
    { label: 'CBE Bank', value: req?.cbeAccount },
    { label: 'BOA Bank', value: req?.boaAccount },
    { label: 'Awash Bank', value: req?.awashAccount },
    { label: req?.otherBankName || 'Other Bank', value: req?.otherBankAccount },
  ].filter(a => a.value);

  const hasRequesterPhone = req?.requesterPhone;

  const docs = [
    { label: 'Support Letter', url: req?.supportLetterUrl },
    { label: 'National ID — Front', url: req?.nationalIdFrontUrl },
    { label: 'National ID — Back', url: req?.nationalIdBackUrl },
  ].filter(d => d.url);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <Card className="relative">
          {isLoading || !req ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className={cn('flex items-start justify-between gap-4 px-6 py-5 border-b',
                isDark ? 'border-slate-700' : 'border-gray-100')}>
                <div className="min-w-0">
                  <h2 className={cn('text-xl font-bold break-words', isDark ? 'text-white' : 'text-gray-900')}>
                    {req.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600')}>
                      {req.category}
                    </span>
                    {req.urgencyLevel && (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600')}>
                        {URGENCY_LABELS[req.urgencyLevel] || `Level ${req.urgencyLevel}`}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={onClose}
                  className={cn('p-2 rounded-xl transition-colors shrink-0',
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

                {req.imageUrl && (
                  <img src={req.imageUrl} alt={req.title}
                    className="rounded-xl w-full max-h-64 object-cover border"
                  />
                )}

                {/* Funding progress */}
                {req.goalAmount && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-green-500 font-semibold">
                        {formatCurrency(req.raisedAmount)} raised
                      </span>
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                        goal {formatCurrency(req.goalAmount)}
                      </span>
                    </div>
                    <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
                      <div className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min((req.raisedAmount / req.goalAmount) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* Overview */}
                <div className={cn('rounded-xl p-4 space-y-2.5', isDark ? 'bg-slate-800/70' : 'bg-gray-50 border')}>
                  <DetailRow label="Location" value={req.location} isDark={isDark} />
                  <DetailRow label="Family Size" value={req.familySize ? `${req.familySize} ${req.familySize === 1 ? 'person' : 'people'}` : null} isDark={isDark} />
                  <DetailRow label="Submitted" value={formatDate(req.createdAt)} isDark={isDark} />
                  <DetailRow label="Last Updated" value={formatDate(req.updatedAt)} isDark={isDark} />
                </div>

                {/* Description */}
                <div>
                  <SectionTitle isDark={isDark}>Your Situation</SectionTitle>
                  <p className={cn('text-sm whitespace-pre-wrap leading-relaxed', isDark ? 'text-slate-300' : 'text-gray-700')}>
                    {req.description}
                  </p>
                </div>

                {/* Payment accounts */}
                <div>
                  <SectionTitle isDark={isDark}><CreditCard className="w-3.5 h-3.5" />Payment Accounts</SectionTitle>
                  {accounts.length ? (
                    <div className="space-y-1.5">
                      {accounts.map(a => (
                        <div key={a.label} className={cn('text-xs px-3 py-2 rounded-lg flex justify-between items-center',
                          isDark ? 'bg-slate-800/70' : 'bg-gray-50 border')}>
                          <span className={cn('font-semibold', isDark ? 'text-slate-300' : 'text-gray-600')}>{a.label}</span>
                          <span className={cn('font-mono', isDark ? 'text-slate-200' : 'text-gray-800')}>{a.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>No payment accounts provided.</p>
                  )}

                  {/* Phone for item donations */}
                  {hasRequesterPhone && (
                    <div className={cn('mt-3 p-3 rounded-lg border', isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200')}>
                      <p className={cn('text-xs font-semibold mb-1', isDark ? 'text-blue-400' : 'text-blue-700')}>
                        📞 For Item Donations
                      </p>
                      <p className={cn('text-xs', isDark ? 'text-blue-300' : 'text-blue-900')}>
                        Contact: <a href={`tel:${req.requesterPhone}`} className="font-semibold hover:underline">{req.requesterPhone}</a>
                      </p>
                      <p className={cn('text-xs mt-1', isDark ? 'text-blue-400' : 'text-blue-600')}>
                        Call this number to coordinate item delivery or pickup
                      </p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {(docs.length > 0 || req.fanNumber) && (
                  <div>
                    <SectionTitle isDark={isDark}><ShieldCheck className="w-3.5 h-3.5" />Your Documents</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      {docs.map(d => (
                        <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
                          className={cn('rounded-xl overflow-hidden border group relative block',
                            isDark ? 'border-slate-700 bg-slate-800/70' : 'border-gray-200 bg-white')}>
                          <img src={d.url} alt={d.label}
                            className="w-full h-24 object-cover group-hover:opacity-80 transition-opacity"
                            onError={e => (e.currentTarget.style.display = 'none')} />
                          <span className={cn('block text-[10px] font-medium px-2 py-1.5 truncate',
                            isDark ? 'text-blue-400' : 'text-blue-600')}>
                            {d.label} ↗
                          </span>
                        </a>
                      ))}
                    </div>
                    <DetailRow label="FAN Number" value={req.fanNumber} isDark={isDark} />
                  </div>
                )}

                {/* Additional notes to admin */}
                {req.additionalNotes && (
                  <div className={cn('rounded-xl p-4 text-xs leading-relaxed',
                    isDark ? 'bg-slate-800/70 text-slate-300' : 'bg-gray-50 border text-gray-700')}>
                    <p className={cn('font-bold mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>Additional Notes for Admin</p>
                    <p className="whitespace-pre-wrap">{req.additionalNotes}</p>
                  </div>
                )}

                {/* Admin note */}
                {req.adminNote && (
                  <div className={cn('text-xs px-4 py-3 rounded-lg',
                    isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
                    <span className="font-semibold">Admin note: </span>{req.adminNote}
                  </div>
                )}

                {/* Recent donations */}
                <div>
                  <SectionTitle isDark={isDark}>
                    <Heart className="w-3.5 h-3.5" />Recent Donations ({req._count?.donations ?? 0})
                  </SectionTitle>
                  {req.donations?.length ? (
                    <div className="space-y-1.5">
                      {req.donations.map((d: any) => (
                        <div key={d.id} className={cn('flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs',
                          isDark ? 'bg-slate-800/70' : 'bg-gray-50 border')}>
                          <div className="min-w-0">
                            <p className={cn('font-semibold', isDark ? 'text-slate-200' : 'text-gray-800')}>
                              {d.isAnonymous
                                ? 'Anonymous Donor'
                                : [d.donor?.firstName, d.donor?.lastName].filter(Boolean).join(' ') || 'Donor'}
                            </p>
                            {d.description && (
                              <p className={cn('truncate', isDark ? 'text-slate-500' : 'text-gray-400')}>{d.description}</p>
                            )}
                            <p className={isDark ? 'text-slate-600' : 'text-gray-400'}>{formatDate(d.createdAt)}</p>
                          </div>
                          <span className="font-bold text-green-500 shrink-0">
                            {d.amount ? formatCurrency(d.amount) : d.itemDescription || d.donationType}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>
                      No donations yet for this request.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function SupportRequestsPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [supportLetterUrl, setSupportLetterUrl] = useState('');
  const [nationalIdFrontUrl, setNationalIdFrontUrl] = useState('');
  const [nationalIdBackUrl, setNationalIdBackUrl] = useState('');
  const [fanNumber, setFanNumber] = useState('');
  const { isDark } = useTheme();
  const { user } = useAuth();
  const qc = useQueryClient();

  const isAdmin = user && ['KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'].includes(user.role);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => api.get('/support-requests/my').then(r => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/support-requests', { ...data, imageUrl, supportLetterUrl, nationalIdFrontUrl, nationalIdBackUrl, fanNumber }),
    onSuccess: () => {
      toast.success('Request submitted! Awaiting admin approval.');
      qc.invalidateQueries({ queryKey: ['my-requests'] });
      reset();
      setImageUrl('');
      setSupportLetterUrl('');
      setNationalIdFrontUrl('');
      setNationalIdBackUrl('');
      setFanNumber('');
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit'),
  });

  const sel = cn(
    'w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
    isDark
      ? 'bg-slate-700 border-slate-600 text-white'
      : 'bg-white border-gray-300 text-gray-900',
  );

  const lbl = cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700');

  const closeForm = () => {
    setShowForm(false);
    reset();
    setImageUrl('');
    setSupportLetterUrl('');
    setNationalIdFrontUrl('');
    setNationalIdBackUrl('');
    setFanNumber('');
  };

  const onFormSubmit = (data: any) => {
    if (isAdmin && (!supportLetterUrl || !nationalIdFrontUrl || !nationalIdBackUrl || !fanNumber)) {
      toast.error('Admin users must upload a support letter, national ID (front & back), and provide FAN number');
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
            My Support Requests
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            Post a request — admin will review and approve it
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          New Request
        </Button>
      </div>

      {/* ── Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <Card className="relative">
              {/* Modal header */}
              <div className={cn('flex items-center justify-between px-6 py-5 border-b',
                isDark ? 'border-slate-700' : 'border-gray-100')}>
                <div>
                  <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                    Submit Support Request
                  </h2>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-gray-500')}>
                    All fields marked * are required
                  </p>
                </div>
                <button onClick={closeForm}
                  className={cn('p-2 rounded-xl transition-colors',
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit(d => onFormSubmit(d))} className="p-6 space-y-5">

                {/* Title */}
                <Input
                  label="Request Title *"
                  placeholder="e.g. Food support for my family"
                  error={errors.title?.message as string}
                  {...register('title', { required: 'Title is required' })}
                />

                {/* Category + Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Category *</label>
                    <select {...register('category', { required: true })} className={sel}>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Urgency Level *</label>
                    <select {...register('urgencyLevel')} className={sel}>
                      <option value="1">🟢 Standard — General needs</option>
                      <option value="2">🟡 Medium — Moderate priority</option>
                      <option value="3">🟠 High — Important, time-sensitive</option>
                      <option value="4">🔴 Critical — Urgent, needs immediate help</option>
                      <option value="5">🚨 Emergency — Life-threatening situation</option>
                    </select>
                  </div>
                </div>

                {/* Goal Amount + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Target Amount (ETB, optional)"
                    type="number"
                    placeholder="e.g. 5000"
                    {...register('goalAmount')}
                  />
                  <Input
                    label="Your Location / Kebele *"
                    placeholder="e.g. Kebele 05, Adama"
                    error={errors.location?.message as string}
                    {...register('location', { required: 'Location is required' })}
                  />
                </div>

                {/* Family size */}
                <div>
                  <label className={lbl}>Family Size</label>
                  <select {...register('familySize')} className={sel}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'person' : 'people'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>
                    Your Situation * <span className="text-xs font-normal opacity-60">(be as detailed as possible)</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Describe your situation in detail. What happened? What do you need? How will the support help you and your family? The more detail you provide, the faster it gets approved."
                    {...register('description', { required: 'Description is required' })}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none transition-colors',
                      isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900',
                    )}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-400 mt-1">{errors.description.message as string}</p>
                  )}
                </div>

                {/* Image upload */}
                <ImageUpload
                  label="Supporting Photo (optional)"
                  value={imageUrl}
                  onChange={setImageUrl}
                  hint="Upload a photo that shows your situation — it helps admins make faster decisions"
                />

                {/* Payment Accounts Section */}
                <div className={cn('rounded-2xl border p-4 space-y-3',
                  isDark ? 'border-slate-600 bg-slate-700/30' : 'border-green-100 bg-green-50')}>
                  <p className={cn('text-sm font-bold', isDark ? 'text-green-400' : 'text-green-700')}>
                    💳 Your Payment Accounts
                  </p>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
                    Donors will use these to send money directly to you. Add at least one.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="TeleBirr Account" placeholder="+251 9XX XXX XXX"
                      {...register('telebirrAccount')} />
                    <Input label="CBE Account" placeholder="Account number"
                      {...register('cbeAccount')} />
                    <Input label="BOA Account" placeholder="Account number"
                      {...register('boaAccount')} />
                    <Input label="Awash Bank Account" placeholder="Account number"
                      {...register('awashAccount')} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Other Bank Name" placeholder="e.g. Abyssinia Bank"
                      {...register('otherBankName')} />
                    <Input label="Other Bank Account" placeholder="Account number"
                      {...register('otherBankAccount')} />
                  </div>

                  <div className={cn('mt-4 pt-4 border-t', isDark ? 'border-slate-600' : 'border-green-200')}>
                    <p className={cn('text-sm font-bold mb-2', isDark ? 'text-blue-400' : 'text-blue-700')}>
                      📞 Contact for Item Donations
                    </p>
                    <p className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-gray-500')}>
                      If people want to donate items (food, clothes, etc.) instead of money, they can call you to coordinate delivery.
                    </p>
                    <Input label="Your Phone Number" placeholder="+251 9XX XXX XXX"
                      {...register('requesterPhone')} />
                  </div>
                </div>

                {/* Admin-only documents */}
                <div className={cn('rounded-2xl border p-4 space-y-4',
                  isDark ? 'border-slate-600 bg-slate-700/30' : 'border-amber-100 bg-amber-50')}>
                  <div>
                    <p className={cn('text-sm font-bold', isDark ? 'text-amber-400' : 'text-amber-700')}>
                      🔒 Documents for Admin Review Only
                    </p>
                    <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
                      These documents are only visible to admins — not shown to the public.
                      {isAdmin && <span className="block mt-1 text-amber-500 font-semibold">Required for admin users.</span>}
                    </p>
                  </div>
                  <ImageUpload
                    label={isAdmin ? "Support Letter (official letter or ID) *" : "Support Letter (official letter or ID)"}
                    value={supportLetterUrl}
                    onChange={setSupportLetterUrl}
                    hint="Upload a kebele support letter, hospital letter, or official document"
                  />
                  <ImageUpload
                    label={isAdmin ? "National ID - Front Side *" : "National ID - Front Side"}
                    value={nationalIdFrontUrl}
                    onChange={setNationalIdFrontUrl}
                    hint="Upload the front side of your national ID"
                  />
                  <ImageUpload
                    label={isAdmin ? "National ID - Back Side *" : "National ID - Back Side"}
                    value={nationalIdBackUrl}
                    onChange={setNationalIdBackUrl}
                    hint="Upload the back side of your national ID"
                  />
                  <div>
                    <label className={lbl}>{isAdmin ? "FAN Number (Federal Admin Number) *" : "FAN Number (Federal Admin Number)"}</label>
                    <input className={sel} placeholder="e.g. 1234567890"
                      value={fanNumber} onChange={e => setFanNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Additional Notes for Admin</label>
                    <textarea rows={3}
                      placeholder="Any additional information you want to share with the admin only..."
                      {...register('additionalNotes')}
                      className={cn(
                        'w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none',
                        isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900',
                      )} />
                  </div>
                </div>

                {/* Info notice */}
                <div className={cn('flex items-start gap-2.5 p-4 rounded-xl text-sm',
                  isDark ? 'bg-blue-900/20 border border-blue-700/30 text-blue-300' : 'bg-blue-50 border border-blue-100 text-blue-700')}>
                  <span className="text-lg mt-0.5">ℹ️</span>
                  <p>Your request will be reviewed by an admin within 24–48 hours. You'll receive a notification once it's approved or if more information is needed.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    isLoading={mutation.isPending}
                    className="flex-1"
                    size="lg"
                  >
                    Submit Request
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={closeForm}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ── Request List ──────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !requests?.length ? (
        <Card className="text-center py-16">
          <FileText className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className={cn('font-medium mb-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
            No requests yet
          </p>
          <p className={cn('text-sm mb-4', isDark ? 'text-slate-500' : 'text-gray-400')}>
            Submit a support request and the admin will review it
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Submit First Request
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <Card key={req.id} className="p-5">
              <div className="flex gap-4">
                {/* Thumbnail */}
                {req.imageUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img src={req.imageUrl} alt={req.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {req.title}
                    </p>
                    <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600')}>
                      {req.category}
                    </span>
                  </div>

                  <p className={cn('text-xs line-clamp-2 mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>
                    {req.description}
                  </p>

                  {req.goalAmount && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-500 font-medium">
                          {formatCurrency(req.raisedAmount)} raised
                        </span>
                        <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>
                          of {formatCurrency(req.goalAmount)}
                        </span>
                      </div>
                      <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.min((req.raisedAmount / req.goalAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {req.adminNote && (
                    <div className={cn('text-xs px-3 py-2 rounded-lg mb-2',
                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
                      <span className="font-semibold">Admin note: </span>{req.adminNote}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className={cn('text-xs', isDark ? 'text-slate-600' : 'text-gray-400')}>
                      Submitted {formatDate(req.createdAt)}
                    </p>
                    <button onClick={() => setViewingId(req.id)}
                      className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                        isDark
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          : 'bg-green-50 hover:bg-green-100 text-green-700')}>
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Request Detail Modal ──────────────────────────── */}
      <RequestDetailModal requestId={viewingId} onClose={() => setViewingId(null)} isDark={isDark} />
    </div>
  );
}
