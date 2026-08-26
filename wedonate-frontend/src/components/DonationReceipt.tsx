import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../lib/utils';
import { Heart } from 'lucide-react';

export const DonationReceipt = forwardRef<HTMLDivElement, { donation: any }>(({ donation }, ref) => {
  const { t } = useTranslation();
  if (!donation) return null;

  const targetTitle = donation.supportRequest?.title || donation.campaign?.title || 'General Community Support';
  const recipientName = donation.supportRequest?.user
    ? `${donation.supportRequest.user.firstName} ${donation.supportRequest.user.lastName}`
    : donation.campaign?.user
      ? donation.campaign.user.orgName || `${donation.campaign.user.firstName} ${donation.campaign.user.lastName}`
      : 'Adama City Administration';
      
  const donorName = donation.donor ? `${donation.donor.firstName} ${donation.donor.lastName}` : (donation.guestName || 'Anonymous Donor');
  
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
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Official Receipt</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Receipt No.</p>
          <p className="font-mono text-gray-900 font-bold">{donation.id.split('-')[0].toUpperCase()}</p>
          <p className="text-sm text-gray-500 mt-2">Date</p>
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
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Received From</p>
          <p className="text-lg font-bold text-gray-900">{donorName}</p>
          {donation.guestEmail && <p className="text-gray-600">{donation.guestEmail}</p>}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Beneficiary</p>
          <p className="text-lg font-bold text-gray-900">{recipientName}</p>
          <p className="text-gray-600">{donation.campaignId ? 'Organizational Campaign' : 'Direct Support'}</p>
        </div>
      </div>
      
      <div className="mb-12">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Supported Cause</p>
        <p className="text-xl font-bold text-gray-900">{targetTitle}</p>
      </div>
      
      <table className="w-full mb-12 text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-3 text-sm font-bold text-gray-400 uppercase tracking-wide">Description</th>
            <th className="py-3 text-sm font-bold text-gray-400 uppercase tracking-wide">Method</th>
            <th className="py-3 text-sm font-bold text-gray-400 uppercase tracking-wide text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-4 text-gray-900 font-medium">Donation ({donation.donationType})</td>
            <td className="py-4 text-gray-600 font-medium">{donation.paymentMethod || 'Credit/Chapa'}</td>
            <td className="py-4 text-gray-900 font-bold text-right text-lg">{donation.amount ? formatCurrency(donation.amount) : 'In-Kind'}</td>
          </tr>
        </tbody>
      </table>
      
      {(donation.referenceCode || donation.chapaRef) && (
        <div className="mb-12">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Transaction Details</p>
          {donation.chapaRef && <p className="text-gray-700 font-mono"><span className="font-semibold text-gray-900 font-sans">Chapa:</span> {donation.chapaRef}</p>}
          {donation.referenceCode && <p className="text-gray-700 font-mono"><span className="font-semibold text-gray-900 font-sans">Bank Ref:</span> {donation.referenceCode}</p>}
        </div>
      )}
      
      <div className="mt-16 pt-8 border-t-2 border-gray-200 text-center">
        <p className="text-gray-500 font-medium italic">Thank you for your generosity and support for the community.</p>
        <p className="text-gray-400 text-sm mt-2">Adama City Administration &bull; WeDonate Platform</p>
      </div>
    </div>
  );
});
