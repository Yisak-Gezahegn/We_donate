import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Eye, ExternalLink, BadgeCheck, Send, CheckSquare, Plus, X, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';

type ViewMode = 'requests' | 'campaigns';
type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

const URGENCY_MAP: Record<number, { label: string; color: string }> = {
  5: { label: 'Emergency', color: 'bg-red-100 text-red-700 border-red-200' },
  4: { label: 'Critical', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  3: { label: 'High', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  1: { label: 'Standard', color: 'bg-green-100 text-green-700 border-green-200' },
};

const REQUEST_CATEGORIES = [
  { value: 'FOOD', label: 'Food' },
  { value: 'MEDICINE', label: 'Medicine' },
  { value: 'CLOTHES', label: 'Clothing' },
  { value: 'MONEY', label: 'Financial Aid' },
  { value: 'OTHER', label: 'Other' },
];

const CAMPAIGN_CATEGORIES = [
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HEALTH', label: 'Health & Medical' },
  { value: 'EMERGENCY', label: 'Emergency Relief' },
  { value: 'OTHER', label: 'Other' },
];

const EMPTY_REQUEST_FORM = {
  title: '', description: '', category: 'FOOD', urgencyLevel: '1',
  goalAmount: '', location: '', familySize: '1',
  imageUrl: '', telebirrAccount: '', cbeAccount: '', boaAccount: '', awashAccount: '',
  otherBankName: '', otherBankAccount: '',
  supportLetterUrl: '', nationalIdFrontUrl: '', nationalIdBackUrl: '', fanNumber: '', additionalNotes: '',
};

const EMPTY_CAMPAIGN_FORM = {
  title: '', description: '', category: 'INFRASTRUCTURE', goalAmount: '', deadline: '',
  imageUrl: '', telebirrAccount: '', cbeAccount: '', boaAccount: '', awashAccount: '',
  otherBankName: '', otherBankAccount: '',
  supportLetterUrl: '', nationalIdFrontUrl: '', nationalIdBackUrl: '', fanNumber: '', additionalNotes: '',
};

function DetailRow({ label, value, isDark }: { label: string; value?: string | null; isDark: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className={cn('text-xs font-semibold w-32 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>{label}</span>
      <span className={cn('text-xs flex-1', isDark ? 'text-slate-200' : 'text-gray-800')}>{value}</span>
    </div>
  );
}

function AccountInfo({ data, isDark }: { data: any; isDark: boolean }) {
  const { t } = useTranslation();
  const accounts = [
    { label: t('admin.telebirr'), value: data.telebirrAccount },
    { label: t('admin.cbe'), value: data.cbeAccount },
    { label: t('admin.boa'), value: data.boaAccount },
    { label: t('admin.awash'), value: data.awashAccount },
    { label: data.otherBankName || t('admin.other_bank'), value: data.otherBankAccount },
  ].filter(a => a.value);
  if (!accounts.length) return <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-gray-400')}>{t('admin.none_provided')}</span>;
  return (
    <div className="space-y-1">
      {accounts.map(a => (
        <div key={a.label} className={cn('text-xs px-2 py-1 rounded-lg flex justify-between',
          isDark ? 'bg-slate-700' : 'bg-gray-100')}>
          <span className="font-semibold">{a.label}:</span>
          <span className="font-mono">{a.value}</span>
        </div>
      ))}
    </div>
  );
}

function CreateForUserModal({ isOpen, onClose, isDark }: { isOpen: boolean; onClose: () => void; isDark: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [createType, setCreateType] = useState<'requests' | 'campaigns'>('requests');
  const [targetUserId, setTargetUserId] = useState('');
  const [reqForm, setReqForm] = useState(EMPTY_REQUEST_FORM);
  const [campForm, setCampForm] = useState(EMPTY_CAMPAIGN_FORM);

  const input = cn('w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors',
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300');
  const label = cn('block text-xs font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700');

  const { data: users } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => api.get('/admin/users').then(r => r.data.data),
    enabled: isOpen,
  });

  const createRequest = useMutation({
    mutationFn: (data: any) => api.post('/support-requests', data),
    onSuccess: () => {
      toast.success('Support request created for user');
      qc.invalidateQueries({ queryKey: ['admin-requests'] });
      resetForm();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const createCampaign = useMutation({
    mutationFn: (data: any) => api.post('/campaigns', data),
    onSuccess: () => {
      toast.success('Campaign created for user');
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] });
      resetForm();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const resetForm = () => {
    setTargetUserId('');
    setReqForm(EMPTY_REQUEST_FORM);
    setCampForm(EMPTY_CAMPAIGN_FORM);
  };

  const handleSubmit = () => {
    if (!targetUserId) { toast.error('Please select a user'); return; }
    if (createType === 'requests') {
      if (!reqForm.title || !reqForm.description || !reqForm.category) { toast.error('Fill required fields'); return; }
      createRequest.mutate({ ...reqForm, targetUserId });
    } else {
      if (!campForm.title || !campForm.description || !campForm.category || !campForm.goalAmount) { toast.error('Fill required fields'); return; }
      createCampaign.mutate({ ...campForm, targetUserId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Create for User</h2>
          <button onClick={onClose} className={cn('p-1.5 rounded-lg', isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className={cn('flex rounded-xl p-1 mb-4 border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200')}>
          {(['requests', 'campaigns'] as ViewMode[]).map(v => (
            <button key={v} type="button" onClick={() => setCreateType(v)}
              className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize',
                createType === v ? 'bg-green-600 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'))}>
              {v === 'requests' ? 'Support Request' : 'Campaign'}
            </button>
          ))}
        </div>

        {/* User Selector */}
        <div className="mb-4">
          <label className={label}>Select User *</label>
          <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
            className={cn(input, !targetUserId && 'opacity-60')}>
            <option value="">— Choose a user —</option>
            {users?.map((u: any) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email}) — {u.role}</option>
            ))}
          </select>
        </div>

        {/* Support Request Form */}
        {createType === 'requests' && (
          <div className="space-y-3">
            <div>
              <label className={label}>Title *</label>
              <input className={input} placeholder="Support request title" value={reqForm.title}
                onChange={e => setReqForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Category *</label>
                <select className={input} value={reqForm.category}
                  onChange={e => setReqForm(p => ({ ...p, category: e.target.value }))}>
                  {REQUEST_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Urgency Level</label>
                <select className={input} value={reqForm.urgencyLevel}
                  onChange={e => setReqForm(p => ({ ...p, urgencyLevel: e.target.value }))}>
                  {Object.entries(URGENCY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Target Amount (ETB)</label>
                <input type="number" className={input} placeholder="Optional" value={reqForm.goalAmount}
                  onChange={e => setReqForm(p => ({ ...p, goalAmount: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Location / Kebele</label>
                <input className={input} placeholder="Location" value={reqForm.location}
                  onChange={e => setReqForm(p => ({ ...p, location: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={label}>Description *</label>
              <textarea className={cn(input, 'resize-none')} rows={3} placeholder="Describe the situation..."
                value={reqForm.description} onChange={e => setReqForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Supporting Photo</label>
              <ImageUpload label="" value={reqForm.imageUrl} onChange={v => setReqForm(p => ({ ...p, imageUrl: v }))}
                hint="Optional photo" accept="image/*" />
            </div>
            <div className={cn('rounded-xl p-4 space-y-3', isDark ? 'bg-slate-700/50 border border-slate-600' : 'bg-green-50 border border-green-200')}>
              <p className={cn('text-xs font-bold', isDark ? 'text-green-400' : 'text-green-700')}>Payment Accounts</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>TeleBirr</label><input className={input} value={reqForm.telebirrAccount} onChange={e => setReqForm(p => ({ ...p, telebirrAccount: e.target.value }))} /></div>
                <div><label className={label}>CBE</label><input className={input} value={reqForm.cbeAccount} onChange={e => setReqForm(p => ({ ...p, cbeAccount: e.target.value }))} /></div>
                <div><label className={label}>BOA</label><input className={input} value={reqForm.boaAccount} onChange={e => setReqForm(p => ({ ...p, boaAccount: e.target.value }))} /></div>
                <div><label className={label}>Awash</label><input className={input} value={reqForm.awashAccount} onChange={e => setReqForm(p => ({ ...p, awashAccount: e.target.value }))} /></div>
              </div>
            </div>
            <div className={cn('rounded-xl p-4 space-y-3', isDark ? 'bg-amber-900/20 border border-amber-700/40' : 'bg-amber-50 border border-amber-200')}>
              <p className={cn('text-xs font-bold', isDark ? 'text-amber-400' : 'text-amber-700')}>Support Letter & Documents</p>
              <div><label className={label}>Support Letter *</label>
                <ImageUpload label="" value={reqForm.supportLetterUrl} onChange={v => setReqForm(p => ({ ...p, supportLetterUrl: v }))}
                  hint="Upload the support letter" accept=".pdf,image/*" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>National ID Front *</label>
                  <ImageUpload label="" value={reqForm.nationalIdFrontUrl} onChange={v => setReqForm(p => ({ ...p, nationalIdFrontUrl: v }))}
                    hint="Front side" accept=".pdf,image/*" /></div>
                <div><label className={label}>National ID Back *</label>
                  <ImageUpload label="" value={reqForm.nationalIdBackUrl} onChange={v => setReqForm(p => ({ ...p, nationalIdBackUrl: v }))}
                    hint="Back side" accept=".pdf,image/*" /></div>
              </div>
              <div><label className={label}>FAN Number *</label>
                <input className={input} placeholder="Federal Admin Number" value={reqForm.fanNumber} onChange={e => setReqForm(p => ({ ...p, fanNumber: e.target.value }))} /></div>
              <div><label className={label}>Additional Notes</label>
                <textarea className={cn(input, 'resize-none')} rows={2} value={reqForm.additionalNotes} onChange={e => setReqForm(p => ({ ...p, additionalNotes: e.target.value }))} /></div>
            </div>
          </div>
        )}

        {/* Campaign Form */}
        {createType === 'campaigns' && (
          <div className="space-y-3">
            <div>
              <label className={label}>Title *</label>
              <input className={input} placeholder="Campaign title" value={campForm.title}
                onChange={e => setCampForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Category *</label>
                <select className={input} value={campForm.category}
                  onChange={e => setCampForm(p => ({ ...p, category: e.target.value }))}>
                  {CAMPAIGN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Goal Amount (ETB) *</label>
                <input type="number" className={input} placeholder="Required" value={campForm.goalAmount}
                  onChange={e => setCampForm(p => ({ ...p, goalAmount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={label}>Deadline</label>
              <input type="date" className={input} value={campForm.deadline}
                onChange={e => setCampForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Description *</label>
              <textarea className={cn(input, 'resize-none')} rows={3} placeholder="Describe the campaign..."
                value={campForm.description} onChange={e => setCampForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Campaign Image</label>
              <ImageUpload label="" value={campForm.imageUrl} onChange={v => setCampForm(p => ({ ...p, imageUrl: v }))}
                hint="Optional image" accept="image/*" />
            </div>
            <div className={cn('rounded-xl p-4 space-y-3', isDark ? 'bg-slate-700/50 border border-slate-600' : 'bg-green-50 border border-green-200')}>
              <p className={cn('text-xs font-bold', isDark ? 'text-green-400' : 'text-green-700')}>Payment Accounts</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>TeleBirr</label><input className={input} value={campForm.telebirrAccount} onChange={e => setCampForm(p => ({ ...p, telebirrAccount: e.target.value }))} /></div>
                <div><label className={label}>CBE</label><input className={input} value={campForm.cbeAccount} onChange={e => setCampForm(p => ({ ...p, cbeAccount: e.target.value }))} /></div>
                <div><label className={label}>BOA</label><input className={input} value={campForm.boaAccount} onChange={e => setCampForm(p => ({ ...p, boaAccount: e.target.value }))} /></div>
                <div><label className={label}>Awash</label><input className={input} value={campForm.awashAccount} onChange={e => setCampForm(p => ({ ...p, awashAccount: e.target.value }))} /></div>
              </div>
            </div>
            <div className={cn('rounded-xl p-4 space-y-3', isDark ? 'bg-amber-900/20 border border-amber-700/40' : 'bg-amber-50 border border-amber-200')}>
              <p className={cn('text-xs font-bold', isDark ? 'text-amber-400' : 'text-amber-700')}>Support Letter & Documents</p>
              <div><label className={label}>Support Letter *</label>
                <ImageUpload label="" value={campForm.supportLetterUrl} onChange={v => setCampForm(p => ({ ...p, supportLetterUrl: v }))}
                  hint="Upload the support letter" accept=".pdf,image/*" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>National ID Front *</label>
                  <ImageUpload label="" value={campForm.nationalIdFrontUrl} onChange={v => setCampForm(p => ({ ...p, nationalIdFrontUrl: v }))}
                    hint="Front side" accept=".pdf,image/*" /></div>
                <div><label className={label}>National ID Back *</label>
                  <ImageUpload label="" value={campForm.nationalIdBackUrl} onChange={v => setCampForm(p => ({ ...p, nationalIdBackUrl: v }))}
                    hint="Back side" accept=".pdf,image/*" /></div>
              </div>
              <div><label className={label}>FAN Number *</label>
                <input className={input} placeholder="Federal Admin Number" value={campForm.fanNumber} onChange={e => setCampForm(p => ({ ...p, fanNumber: e.target.value }))} /></div>
              <div><label className={label}>Additional Notes</label>
                <textarea className={cn(input, 'resize-none')} rows={2} value={campForm.additionalNotes} onChange={e => setCampForm(p => ({ ...p, additionalNotes: e.target.value }))} /></div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
          <Button onClick={handleSubmit}
            isLoading={createRequest.isPending || createRequest.isPending}
            disabled={!targetUserId}>
            <Plus className="w-4 h-4 mr-1" /> Create {createType === 'requests' ? 'Request' : 'Campaign'}
          </Button>
          <Button variant="ghost" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminRequestsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const [view, setView] = useState<ViewMode>('requests');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ item: any; type: ViewMode } | null>(null);

  const isKebeleAdmin = currentUser?.role === 'KEBELE_ADMIN';

  const { data: requests, isLoading: loadingReqs } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => api.get('/support-requests/all').then(r => r.data.data),
  });
  const { data: campaigns, isLoading: loadingCamps } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => api.get('/campaigns/all').then(r => r.data.data),
  });

  const updateReq = useMutation({
    mutationFn: ({ id, status, adminNote }: any) => api.patch(`/support-requests/${id}/status`, { status, adminNote }),
    onSuccess: () => { toast.success(t('admin.updated')); qc.invalidateQueries({ queryKey: ['admin-requests'] }); },
    onError: () => toast.error(t('admin.failed')),
  });
  const updateCamp = useMutation({
    mutationFn: ({ id, status, adminNote }: any) => api.patch(`/campaigns/${id}/status`, { status, adminNote }),
    onSuccess: () => { toast.success(t('admin.updated')); qc.invalidateQueries({ queryKey: ['admin-campaigns'] }); },
    onError: () => toast.error(t('admin.failed')),
  });
  const publishReq = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/requests/${id}/publish`),
    onSuccess: () => { toast.success('Request published'); qc.invalidateQueries({ queryKey: ['admin-requests'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const fulfillReq = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/requests/${id}/fulfill`),
    onSuccess: () => { toast.success('Request fulfilled'); qc.invalidateQueries({ queryKey: ['admin-requests'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const publishCamp = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/campaigns/${id}/publish`),
    onSuccess: () => { toast.success('Campaign published'); qc.invalidateQueries({ queryKey: ['admin-campaigns'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const deleteReq = useMutation({
    mutationFn: (id: string) => api.delete(`/support-requests/${id}`),
    onSuccess: () => {
      toast.success('Request deleted');
      qc.invalidateQueries({ queryKey: ['admin-requests'] });
      setDeletingItem(null);
      setExpanded(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });
  const deleteCamp = useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Campaign deleted');
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] });
      setDeletingItem(null);
      setExpanded(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id);

  const handleReject = (id: string, type: 'requests' | 'campaigns') => {
    const reason = notes[id]?.trim();
    if (!reason) { toast.error(t('admin.rejection_reason_required')); return; }
    const mutate = type === 'requests' ? updateReq : updateCamp;
    mutate.mutate({ id, status: 'REJECTED', adminNote: reason });
  };

  const filterItems = (items: any[]) => {
    if (statusFilter === 'ALL') return items;
    if (statusFilter === 'FULFILLED') return items.filter((i: any) => i.status === 'FULFILLED');
    return items.filter((i: any) => i.status === statusFilter);
  };

  const ItemCard = ({ item, type }: { item: any; type: 'requests' | 'campaigns' }) => {
    const isOpen = expanded === item.id;
    const mutate = type === 'requests' ? updateReq : updateCamp;
    const publishMutate = type === 'requests' ? publishReq : publishCamp;

    return (
      <Card key={item.id} className="overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>{item.title}</h3>
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                {item.category && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600')}>
                    {item.category}
                  </span>
                )}
                {item.urgencyLevel && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-semibold', URGENCY_MAP[item.urgencyLevel]?.color)}>
                    {URGENCY_MAP[item.urgencyLevel]?.label}
                  </span>
                )}
                {item.isPublished && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Published</span>
                )}
              </div>
              <p className={cn('text-xs line-clamp-2 mb-2', isDark ? 'text-slate-400' : 'text-gray-600')}>{item.description}</p>
              <div className="flex items-center gap-3 text-xs">
                {item.user?.profileImage ? (
                  <img src={item.user.profileImage} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-[9px]">
                    {item.user?.firstName?.[0]}
                  </div>
                )}
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                  {item.user?.firstName} {item.user?.lastName} {item.user?.isVerified && <BadgeCheck className="w-3.5 h-3.5 inline text-blue-500" />} · {item.user?.email}
                </span>
                <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>·</span>
                <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{formatDate(item.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button onClick={() => toggleExpand(item.id)}
                className={cn('flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <Eye className="w-3.5 h-3.5" />
                {isOpen ? t('admin.hide') : t('admin.view_details')}
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setDeletingItem({ item, type })}
                title={type === 'requests' ? 'Delete request' : 'Delete campaign'}
                className={cn('flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors',
                  isDark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-700')}>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>

          {/* Admin note + actions for PENDING */}
          {item.status === 'PENDING' && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <textarea placeholder={t('admin.admin_note_placeholder')} value={notes[item.id] || ''} rows={2}
                  onChange={e => setNotes(p => ({ ...p, [item.id]: e.target.value }))}
                  className={cn('flex-1 rounded-xl border px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200')} />
                <div className="flex gap-2">
                  <Button size="sm" leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    isLoading={mutate.isPending}
                    onClick={() => mutate.mutate({ id: item.id, status: 'APPROVED', adminNote: notes[item.id] })}>
                    {t('admin.approve')}
                  </Button>
                  <Button size="sm" variant="danger" leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleReject(item.id, type)}>
                    {t('admin.reject')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Actions for APPROVED */}
          {item.status === 'APPROVED' && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
              {!item.isPublished && (
                <Button size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}
                  isLoading={publishMutate.isPending}
                  onClick={() => publishMutate.mutate(item.id)}>
                  Publish
                </Button>
              )}
              {type === 'requests' && (
                <Button size="sm" variant="secondary" leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
                  isLoading={fulfillReq.isPending}
                  onClick={() => fulfillReq.mutate(item.id)}>
                  Mark Fulfilled
                </Button>
              )}
            </div>
          )}

          {item.adminNote && (
            <div className={cn('mt-3 text-xs px-3 py-2 rounded-lg',
              isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
              <span className="font-semibold">{t('admin.admin_note_label')}</span>{item.adminNote}
            </div>
          )}
        </div>

        {/* Expanded details — full information */}
        {isOpen && (
          <div className={cn('px-5 pb-5 border-t space-y-5', isDark ? 'border-slate-700 bg-slate-700/30' : 'border-gray-100 bg-gray-50/50')}>
            <p className={cn('text-xs font-bold pt-4 mb-1 uppercase tracking-wide', isDark ? 'text-slate-300' : 'text-gray-600')}>{t('admin.full_details')}</p>

            {/* Full description */}
            <div>
              <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Description</p>
              <div className={cn('rounded-xl p-4 text-xs whitespace-pre-wrap leading-relaxed', isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border text-gray-700')}>
                {item.description}
              </div>
            </div>

            {/* Main photo */}
            {item.imageUrl && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>{t('admin.request_photo')}</p>
                <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img src={item.imageUrl} alt="Request" className="rounded-xl max-h-64 object-contain w-full border cursor-pointer hover:opacity-90 transition-opacity" />
                  <span className={cn('flex items-center gap-1 text-xs mt-1', isDark ? 'text-blue-400' : 'text-blue-600')}>
                    <ExternalLink className="w-3 h-3" /> {t('admin.open_full_image')}
                  </span>
                </a>
              </div>
            )}

            {/* Funding progress */}
            {item.goalAmount && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Funding</p>
                <div className={cn('rounded-xl p-4', isDark ? 'bg-slate-800' : 'bg-white border')}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-green-500 font-semibold">{formatCurrency(item.raisedAmount)} raised</span>
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>goal {formatCurrency(item.goalAmount)}</span>
                  </div>
                  <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
                    <div className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(((item.raisedAmount || 0) / item.goalAmount) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Overview grid */}
            <div className={cn('rounded-xl p-4 space-y-2', isDark ? 'bg-slate-800' : 'bg-white border')}>
              <DetailRow label="Status" value={item.status} isDark={isDark} />
              {item.urgencyLevel && (
                <DetailRow label="Urgency" value={`${URGENCY_MAP[item.urgencyLevel]?.label || item.urgencyLevel} (Level ${item.urgencyLevel})`} isDark={isDark} />
              )}
              <DetailRow label={t('admin.location_label')} value={item.location} isDark={isDark} />
              <DetailRow label={t('admin.family_size')} value={item.familySize ? `${item.familySize} people` : null} isDark={isDark} />
              <DetailRow label={t('admin.goal_amount')} value={item.goalAmount ? formatCurrency(item.goalAmount) : null} isDark={isDark} />
              <DetailRow label="Raised So Far" value={formatCurrency(item.raisedAmount || 0)} isDark={isDark} />
              {type === 'campaigns' && (
                <DetailRow label="Deadline" value={item.deadline ? formatDate(item.deadline) : null} isDark={isDark} />
              )}
              <DetailRow label="Published" value={
                item.isPublished
                  ? `Yes${item.publishedAt ? ` — ${formatDate(item.publishedAt)}` : ''}`
                  : null
              } isDark={isDark} />
              <DetailRow label="Submitted" value={formatDate(item.createdAt)} isDark={isDark} />
              <DetailRow label="Last Updated" value={formatDate(item.updatedAt)} isDark={isDark} />
            </div>

            {/* Requester info */}
            <div>
              <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Requester Information</p>
              <div className={cn('rounded-xl p-4 space-y-2', isDark ? 'bg-slate-800' : 'bg-white border')}>
                <DetailRow label="Name" value={item.user ? `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim() : null} isDark={isDark} />
                <DetailRow label="Email" value={item.user?.email} isDark={isDark} />
                <DetailRow label={t('admin.phone')} value={item.user?.phone} isDark={isDark} />
              </div>
            </div>

            {/* Documents */}
            {(item.supportLetterUrl || item.nationalIdFrontUrl || item.nationalIdBackUrl) && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>{t('admin.support_letter')} & National ID</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: t('admin.support_letter'), url: item.supportLetterUrl },
                    { label: 'National ID — Front', url: item.nationalIdFrontUrl },
                    { label: 'National ID — Back', url: item.nationalIdBackUrl },
                  ].filter(d => d.url).map(d => (
                    <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
                      className={cn('rounded-xl overflow-hidden border group relative block',
                        isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white')}>
                      <img src={d.url} alt={d.label}
                        className="w-full h-28 object-cover group-hover:opacity-80 transition-opacity"
                        onError={e => (e.currentTarget.style.display = 'none')} />
                      <span className={cn('block text-[10px] font-medium px-2 py-1.5 truncate',
                        isDark ? 'text-blue-400' : 'text-blue-600')}>
                        {d.label} ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Success proof (completed campaigns) */}
            {(item.successPhotoUrl || item.successNote) && (
              <div>
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Success Proof</p>
                {item.successPhotoUrl && (
                  <a href={item.successPhotoUrl} target="_blank" rel="noopener noreferrer">
                    <img src={item.successPhotoUrl} alt="Success proof" className="rounded-xl max-h-64 object-contain w-full border cursor-pointer hover:opacity-90 transition-opacity" />
                  </a>
                )}
                {item.successNote && (
                  <p className={cn('mt-2 rounded-xl p-3 text-xs whitespace-pre-wrap leading-relaxed', isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border text-gray-700')}>
                    {item.successNote}
                  </p>
                )}
              </div>
            )}

            {/* FAN + additional notes */}
            <div className={cn('rounded-xl p-4 space-y-2', isDark ? 'bg-slate-800' : 'bg-white border')}>
              <DetailRow label="FAN Number" value={item.fanNumber} isDark={isDark} />
              <DetailRow label={t('admin.additional_notes')} value={item.additionalNotes} isDark={isDark} />
            </div>

            {/* Payment accounts */}
            <div>
              <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>{t('admin.payment_accounts')}</p>
              <AccountInfo data={item} isDark={isDark} />
            </div>

            {item.adminNote && (
              <div className={cn('text-xs px-3 py-2 rounded-lg', isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
                <span className="font-semibold">Admin note: </span>{item.adminNote}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const currentItems = view === 'requests' ? filterItems(requests || []) : filterItems(campaigns || []);

  return (
    <div className="space-y-6">
      <CreateForUserModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} isDark={isDark} />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingItem(null)} />
          <Card className="relative z-10 w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                isDark ? 'bg-red-900/40' : 'bg-red-100')}>
                <Trash2 className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  Delete {deletingItem.type === 'requests' ? 'Support Request' : 'Campaign'}
                </h2>
                <p className={cn('text-sm mt-2', isDark ? 'text-slate-400' : 'text-gray-500')}>
                  Permanently delete{' '}
                  <span className={cn('font-semibold break-words', isDark ? 'text-white' : 'text-gray-800')}>
                    “{deletingItem.item.title}”
                  </span>{' '}
                  by {deletingItem.item.user?.firstName} {deletingItem.item.user?.lastName}?
                </p>
                <p className={cn('text-xs mt-3 px-3 py-2 rounded-lg',
                  isDark ? 'bg-red-900/20 text-red-300 border border-red-700/40' : 'bg-red-50 text-red-700 border border-red-200')}>
                  All donations and inspection reports linked to it will also be removed, and the owner will be notified. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="ghost" onClick={() => setDeletingItem(null)}>Cancel</Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}
                isLoading={deleteReq.isPending || deleteCamp.isPending}
                onClick={() => deletingItem.type === 'requests'
                  ? deleteReq.mutate(deletingItem.item.id)
                  : deleteCamp.mutate(deletingItem.item.id)}>
                Delete Permanently
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('admin.approvals_title')}</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>{t('admin.approvals_subtitle')}</p>
        </div>
        <div className="flex gap-3">
          {isKebeleAdmin && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Create for User
            </Button>
          )}
          <div className={cn('flex gap-1 p-1 rounded-xl', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
            {(['requests','campaigns'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => { setView(v); setStatusFilter('ALL'); }}
                className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize',
                  view === v ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
                {v} ({v === 'requests'
                  ? requests?.filter((r: any) => r.status === 'PENDING').length ?? 0
                  : campaigns?.filter((c: any) => c.status === 'PENDING').length ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL','PENDING','APPROVED','REJECTED','FULFILLED'] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === s
                ? 'bg-green-700 text-white'
                : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'))}>
            {s}
          </button>
        ))}
      </div>

      {view === 'requests' && (
        loadingReqs ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !currentItems.length ? (
          <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>{t('admin.no_support_requests')}</Card>
        ) : (
          <div className="space-y-4">
            {currentItems.map((req: any) => <ItemCard key={req.id} item={req} type="requests" />)}
          </div>
        )
      )}

      {view === 'campaigns' && (
        loadingCamps ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !currentItems.length ? (
          <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>{t('admin.no_campaigns')}</Card>
        ) : (
          <div className="space-y-4">
            {currentItems.map((camp: any) => <ItemCard key={camp.id} item={camp} type="campaigns" />)}
          </div>
        )
      )}
    </div>
  );
}
