import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Heart, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import Button from '../components/ui/Button';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [donation, setDonation] = useState<any>(null);

  useEffect(() => {
    if (!txRef) { setStatus('failed'); return; }
    api.get(`/payments/verify/${txRef}`)
      .then(({ data }) => {
        setDonation(data.data.donation);
        setStatus(data.data.status === 'SUCCESS' ? 'success' : 'failed');
      })
      .catch(() => setStatus('failed'));
  }, [txRef]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-20">
      <div className="max-w-md w-full">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-10 text-center">

          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-5" />
              <h2 className="text-xl font-bold text-gray-800">Verifying your payment...</h2>
              <p className="text-gray-500 mt-2 text-sm">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Successful! 🎉</h2>
              <p className="text-gray-500 mb-6">Thank you for your generosity. Your donation has been received.</p>
              {donation && (
                <div className="bg-green-50 rounded-2xl p-5 mb-6 text-left space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-green-700 text-lg">{formatCurrency(donation.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-mono text-xs text-gray-600">{donation.chapaRef?.slice(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className="font-semibold">{donation.donationType}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Link to="/dashboard/donations">
                  <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View My Donations
                  </Button>
                </Link>
                <Link to="/donate">
                  <Button variant="outline" className="w-full">
                    <Heart className="w-4 h-4 mr-2" /> Donate Again
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-500 mb-6">Something went wrong with your payment. No charge was made.</p>
              <Link to="/donate">
                <Button className="w-full">Try Again</Button>
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
