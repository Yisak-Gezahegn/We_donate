import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Heart, X, Eye, CreditCard, ShieldCheck, Package, MapPin, Hash, Calendar, CheckCircle2, XCircle, Printer } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Badge, { statusVariant } from '../../components/ui/Badge';
import { DonationReceipt } from '../../components/DonationReceipt';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CHAPA: 'Chapa Payment',
  TELEBIRR: 'TeleBirr',
  CBE: 'CBE Bank',
  BOA: 'BOA Bank',
  AWASH: 'Awash Bank',
  OTHER_BANK: 'Other Bank',
  ITEM: 'In-Kind Items',
};

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  BRING_TO_OFFICE: 'Bring to Office',
  DELIVER_TO_ADDRESS: 'Deliver to Address',
  COORDINATE: 'Coordinate Directly',
};

function DetailRow({ label, value, isDark }: { label: string; value?: string | null; isDark: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className={cn('text-xs font-semibold w-32 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>{label}</span>
      <span className={cn('text-xs flex-1 break-words', isDark ? 'text-slate-200' : 'text-gray-800')}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon, children, isDark }: { icon?: React.ReactNode; children: React.ReactNode; isDark: boolean }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>
      {icon}{children}
    </p>
  );
}

function DonationDetailModal({ donation, onClose, t }: {
  donation: any;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const { isDark } = useTheme();
  if (!donation) return null;

  const d = donation;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <Card className="relative">
          {/* Header */}
          <div className={cn('flex items-start justify-between gap-4 px-6 py-5 border-b',
            isDark ? 'border-slate-700' : 'border-gray-100')}>
            <div className="min-w-0">
              <h2 className={cn('text-xl font-bold break-words', isDark ? 'text-white' : 'text-gray-900')}>
                {d.donationType} {t('dashboard.donation')}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge>
                {d.isAnonymous && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500')}>
                    {t('dashboard.anonymous')}
                  </span>
                )}
                <span className="text-base font-bold text-green-600">
                  {d.amount ? formatCurrency(d.amount) : t('dashboard.in_kind')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()}
                className={cn('p-2 rounded-xl transition-colors shrink-0 flex items-center gap-2 text-sm font-semibold',
                  isDark ? 'bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700')}>
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Receipt</span>
              </button>
              <button onClick={onClose}
                className={cn('p-2 rounded-xl transition-colors shrink-0',
                  isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

            {/* Overview */}
            <div className={cn('rounded-xl p-4 space-y-2.5', isDark ? 'bg-slate-800/70' : 'bg-gray-50 border')}>
              <DetailRow label="Amount" value={d.amount ? `${formatCurrency(d.amount)} (${d.currency || 'ETB'})` : null} isDark={isDark} />
              <DetailRow label="Donation Type" value={d.donationType} isDark={isDark} />
              <DetailRow label="Made On" value={formatDate(d.createdAt)} isDark={isDark} />
              <DetailRow label="Last Updated" value={formatDate(d.updatedAt)} isDark={isDark} />
              {d.supportRequest?.title && <DetailRow label="Support Request" value={d.supportRequest.title} isDark={isDark} />}
              {d.campaign?.title && <DetailRow label="Campaign" value={d.campaign.title} isDark={isDark} />}
            </div>

            {/* Message / description */}
            {d.description && (
              <div>
                <SectionTitle isDark={isDark}>Your Message</SectionTitle>
                <div className={cn('rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed', isDark ? 'bg-slate-800/70 text-slate-300' : 'bg-gray-50 border text-gray-700')}>
                  {d.description}
                </div>
              </div>
            )}

            {/* In-kind item details */}
            {(d.itemDescription || d.itemImageUrl) && (
              <div>
                <SectionTitle isDark={isDark}><Package className="w-3.5 h-3.5" />Donated Items</SectionTitle>
                <div className="space-y-3">
                  {d.itemImageUrl && (
                    <img src={d.itemImageUrl} alt="Donated items"
                      className="rounded-xl w-full max-h-64 object-cover border" />
                  )}
                  <div className={cn('rounded-xl p-4', isDark ? 'bg-slate-800/70' : 'bg-gray-50 border')}>
                    <DetailRow label="Item Description" value={d.itemDescription} isDark={isDark} />
                    <DetailRow label="Delivery Method" value={d.deliveryMethod ? DELIVERY_METHOD_LABELS[d.deliveryMethod] || d.deliveryMethod : null} isDark={isDark} />
                  </div>
                </div>
              </div>
            )}

            {/* Payment information */}
            <div>
              <SectionTitle isDark={isDark}><CreditCard className="w-3.5 h-3.5" />Payment Information</SectionTitle>
              <div className={cn('rounded-xl p-4 space-y-2.5', isDark ? 'bg-slate-800/70' : 'bg-gray-50 border')}>
                <DetailRow label="Payment Method" value={d.paymentMethod ? PAYMENT_METHOD_LABELS[d.paymentMethod] || d.paymentMethod : null} isDark={isDark} />
                <DetailRow label="Bank Reference" value={d.referenceCode} isDark={isDark} />
                {d.chapaRef && (
                  <div className="flex gap-3">
                    <span className={cn('text-xs font-semibold w-32 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>Chapa Reference</span>
                    <span className={cn('text-xs flex-1 font-mono break-all', isDark ? 'text-slate-200' : 'text-gray-800')}>{d.chapaRef}</span>
                  </div>
                )}
                {d.paymentProofUrl && (
                  <div>
                    <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-400' : 'text-gray-500')}>Payment Proof</p>
                    <a href={d.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                      <img src={d.paymentProofUrl} alt="Payment proof"
                        className="rounded-xl max-h-64 object-contain w-full border cursor-pointer hover:opacity-90 transition-opacity"
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Verification */}
            <div>
              <SectionTitle isDark={isDark}><ShieldCheck className="w-3.5 h-3.5" />Verification</SectionTitle>
              <div className={cn('rounded-xl p-4 space-y-2.5', isDark ? 'bg-slate-800/70' : 'bg-gray-50 border')}>
                <div className="flex gap-3 items-center">
                  <span className={cn('text-xs font-semibold w-32 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>Status</span>
                  <Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge>
                </div>
                {d.verifiedAt && (
                  <div className="flex gap-3 items-center">
                    <span className={cn('text-xs font-semibold w-32 shrink-0', isDark ? 'text-slate-400' : 'text-gray-500')}>Verified On</span>
                    <span className={cn('flex items-center gap-1 text-xs text-green-600 font-medium', isDark && 'text-green-400')}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> {formatDate(d.verifiedAt)}
                    </span>
                  </div>
                )}
                {d.rejectionReason && (
                  <div className={cn('mt-1 rounded-lg px-3 py-2 text-xs flex items-start gap-2',
                    isDark ? 'bg-red-900/20 text-red-300 border border-red-700/40' : 'bg-red-50 text-red-700 border border-red-200')}>
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><span className="font-bold">Rejection reason: </span>{d.rejectionReason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function MyDonationsPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [viewing, setViewing] = useState<any>(null);
  const { data: donations, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => api.get('/donations/my').then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>{t('dashboard.my_donations')}</h1>
        <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>{donations?.length ?? 0} {t('dashboard.total')}</span>
      </div>

      {!donations?.length ? (
        <Card className="text-center py-16">
          <Heart className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
          <p className={cn('font-medium', isDark ? 'text-slate-400' : 'text-gray-400')}>{t('dashboard.no_donations')}</p>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-500' : 'text-gray-300')}>{t('dashboard.donation_history')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((d: any) => (
            <Card key={d.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  isDark ? 'bg-green-900/40' : 'bg-green-50')}>
                  <Heart className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-800')}>{d.donationType} {t('dashboard.donation')}</p>
                    {d.isAnonymous && <span className={cn('text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500')}>{t('dashboard.anonymous')}</span>}
                  </div>
                  {d.description && <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-gray-500')}>{d.description}</p>}
                  <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-gray-400')}>{formatDate(d.createdAt)}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                  <p className="text-base font-bold text-green-700">
                    {d.amount ? formatCurrency(d.amount) : t('dashboard.in_kind')}
                  </p>
                  <Badge variant={statusVariant(d.paymentStatus)}>{d.paymentStatus}</Badge>
                </div>
                <button onClick={() => setViewing(d)}
                  className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0',
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-green-50 hover:bg-green-100 text-green-700')}>
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Donation Detail Modal ── */}
      {viewing && (
        <>
          <div className="print:hidden">
            <DonationDetailModal donation={viewing} onClose={() => setViewing(null)} t={t} />
          </div>
          <DonationReceipt donation={viewing} />
        </>
      )}
    </div>
  );
}
