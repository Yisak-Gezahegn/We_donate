import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../lib/utils';
import { Heart } from 'lucide-react';

export const DonationReceipt = forwardRef<HTMLDivElement, { donation: any }>(({ donation }, ref) => {
  const { t } = useTranslation();
  if (!donation) return null;

  const targetTitle = donation.supportRequest?.title || donation.campaign?.title || t('common.ui.directSupport');
  const recipientName = donation.supportRequest?.user
    ? `${donation.supportRequest.user.firstName} ${donation.supportRequest.user.lastName}`
    : donation.campaign?.user
      ? donation.campaign.user.orgName || `${donation.campaign.user.firstName} ${donation.campaign.user.lastName}`
      : 'Adama City Administration';
      
  const donorName = donation.donor ? `${donation.donor.firstName} ${donation.donor.lastName}` : (donation.guestName || t('dashboard.anonymous'));
  
  const isVerified = donation.paymentStatus === 'SUCCESS';
  
  return (
    <div ref={ref} className="print-only hidden print:block text-black bg-white p-10 font-sans max-w-3xl mx-auto border-2 border-gray-100 min-h-screen print:min-h-0 print:border-none">
      <div className="flex justify-between items-start mb-12 border-b-2 border-gray-200 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">WeDonate</h1>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{t('common.ui.receiptTitle')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{t('common.ui.receiptNumber')}</p>
          <p className="font-mono text-gray-900 font-bold">{donation.id.split('-')[0].toUpperCase()}</p>
          <p className="text-sm text-gray-500 mt-2">{t('common.ui.date')}</p>
          <p className="font-semibold text-gray-900">{formatDate(donation.createdAt)}</p>
        </div>
      </div>
      
      {!isVerified && (
        <div className="mb-8 border-2 border-amber-400 bg-amber-50 p-4 rounded-xl text-amber-800 text-center font-bold uppercase tracking-wide">
          {t('common.status.PENDING')}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">{t('common.ui.receivedFrom')}</p>
          <p className="text-lg font-bold text-gray-900">{donorName}</p>
          {donation.guestEmail && <p className="text-gray-600">{donation.guestEmail}</p>}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">{t('common.ui.beneficiary')}</p>
          <p className="text-lg font-bold text-gray-900">{recipientName}</p>
          <p className="text-gray-600">{donation.campaignId ? t('common.ui.campaign') : t('common.ui.directSupport')}</p>
        </div>
      </div>
      
      <div className="mb-12">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">{t('common.ui.supportedCause')}</p>
        <p className="text-xl font-bold text-gray-900">{targetTitle}</p>
      </div>
      
      <table className="w-full mb-12 text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-3 text-sm font-bold text-gray-400 uppercase tracking-wide">{t('common.ui.description')}</th>
            <th className="py-3 text-sm font-bold text-gray-400 uppercase tracking-wide">{t('common.ui.method')}</th>
            <th className="py-3 text-sm font-bold text-gray-400 uppercase tracking-wide text-right">{t('common.ui.amount')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-4 text-gray-900 font-medium">{t('common.ui.donation')} ({t('donate.types.' + donation.donationType)})</td>
            <td className="py-4 text-gray-600 font-medium">{donation.paymentMethod || t('common.ui.creditChapa')}</td>
            <td className="py-4 text-gray-900 font-bold text-right text-lg">{donation.amount ? formatCurrency(donation.amount) : t('common.ui.inKind')}</td>
          </tr>
        </tbody>
      </table>
      
      {(donation.referenceCode || donation.chapaRef) && (
        <div className="mb-12">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">{t('common.ui.transactionDetails')}</p>
          {donation.chapaRef && <p className="text-gray-700 font-mono"><span className="font-semibold text-gray-900 font-sans">Chapa:</span> {donation.chapaRef}</p>}
          {donation.referenceCode && <p className="text-gray-700 font-mono"><span className="font-semibold text-gray-900 font-sans">{t('common.ui.bankReference')}</span> {donation.referenceCode}</p>}
        </div>
      )}
      
      <div className="mt-16 pt-8 border-t-2 border-gray-200 text-center">
        <p className="text-gray-500 font-medium italic">{t('common.ui.thanks')}</p>
        <p className="text-gray-400 text-sm mt-2">{t('footer.address')} &bull; WeDonate</p>
      </div>
    </div>
  );
});
