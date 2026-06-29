import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, Lock, Copy, Loader2, ArrowRight,
  Zap, MessageSquare, FileText, BarChart3, Shield
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentPage = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const { state } = useAppContext();
  const language = state.language;
  
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failure'>('idle');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(500); // default video call
  const [consultationType, setConsultationType] = useState<'video' | 'chat' | 'callback'>('video');

  const translations = {
    en: {
      payment: 'Payment',
      orderSummary: 'Order Summary',
      consultationType: 'Consultation Type',
      videoCall: 'Video Call',
      textChat: 'Text Chat',
      callback: 'Callback',
      amount: 'Amount',
      freeServices: 'Free Services Included',
      paidServices: 'Paid Services',
      duration: 'Duration',
      min5: '5 min',
      min30: '30 min',
      unlimited: 'Unlimited',
      paymentMethods: 'Payment Methods',
      upi: 'UPI',
      cards: 'Cards & Wallets',
      netbanking: 'Net Banking',
      proceedPayment: 'Proceed to Payment',
      securePayment: 'Secure Payment by Razorpay',
      processing: 'Processing...',
      success: 'Payment Successful!',
      failure: 'Payment Failed',
      redirecting: 'Redirecting to video call...',
      tryAgain: 'Try Again',
      homePage: 'Home Page',
      discountOffer: 'First time user? Get 10% off!',
      totalPayable: 'Total Payable',
      freeMinutes: 'Free Minutes',
      documentScan: 'Document Scan',
      caseTracking: 'Case Tracking',
      courtDirectory: 'Court Directory',
      legalChat: '24/7 Legal Chat',
    },
    hi: {
      payment: 'भुगतान',
      orderSummary: 'ऑर्डर सारांश',
      consultationType: 'परामर्श प्रकार',
      videoCall: 'वीडियो कॉल',
      textChat: 'पाठ चैट',
      callback: 'कॉलबैक',
      amount: 'राशि',
      freeServices: 'शामिल निःशुल्क सेवाएं',
      paidServices: 'सशुल्क सेवाएं',
      duration: 'अवधि',
      min5: '5 मिनट',
      min30: '30 मिनट',
      unlimited: 'असीमित',
      paymentMethods: 'भुगतान विधियाँ',
      upi: 'यूपीआई',
      cards: 'कार्ड और वॉलेट',
      netbanking: 'नेट बैंकिंग',
      proceedPayment: 'भुगतान के लिए आगे बढ़ें',
      securePayment: 'Razorpay द्वारा सुरक्षित भुगतान',
      processing: 'प्रोसेस हो रहा है...',
      success: 'भुगतान सफल!',
      failure: 'भुगतान विफल',
      redirecting: 'वीडियो कॉल पर पुनः निर्देशित किया जा रहा है...',
      tryAgain: 'पुनः प्रयास करें',
      homePage: 'होम पेज',
      discountOffer: 'पहली बार उपयोगकर्ता? 10% छूट प्राप्त करें!',
      totalPayable: 'कुल देय',
      freeMinutes: 'निःशुल्क मिनट',
      documentScan: 'दस्तावेज़ स्कैन',
      caseTracking: 'मामला ट्रैकिंग',
      courtDirectory: 'कोर्ट निर्देशिका',
      legalChat: '24/7 कानूनी चैट',
    }
  };

  const t = translations[language];

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');
      setLoading(true);

      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          consultation_id: consultationId,
          user_id: 'current-user-id' // Should come from context
        })
      });

      if (!response.ok) throw new Error('Failed to create order');
      const data = await response.json();
      setOrderId(data.order_id);

      // Load and open Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load');

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: 'INR',
        order_id: data.order_id,
        prefill: { contact: '9876543210', email: 'user@example.com' },
        notes: { consultation_id: consultationId, service_type: consultationType },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                consultation_id: consultationId
              })
            });

            if (verifyResponse.ok) {
              setPaymentStatus('success');
              setTimeout(() => {
                navigate(`/call/${consultationId}`);
              }, 2000);
            } else {
              setPaymentStatus('failure');
            }
          } catch (err) {
            console.error('Verification error:', err);
            setPaymentStatus('failure');
          }
        },
        modal: { ondismiss: () => setPaymentStatus('idle') }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentStatus('failure');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{t.payment}</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">{t.orderSummary}</h2>

              {/* Consultation Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  {t.consultationType}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { type: 'video', label: t.videoCall, price: 500, icon: Zap },
                    { type: 'chat', label: t.textChat, price: 200, icon: MessageSquare },
                    { type: 'callback', label: t.callback, price: 100, icon: ArrowRight }
                  ].map(({ type, label, price, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => {
                        setConsultationType(type as any);
                        setAmount(price);
                      }}
                      className={`p-4 rounded-xl transition-all border-2 ${
                        consultationType === type
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="mx-auto mb-2 text-gray-700" size={24} />
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-blue-600 font-bold">₹{price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Services */}
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  {t.freeServices}
                </h3>
                <ul className="space-y-2 text-green-800">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> {t.freeMinutes} (5 {t.min5})
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> {t.documentScan}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> {t.caseTracking}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> {t.courtDirectory}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> {t.legalChat} ({t.unlimited})
                  </li>
                </ul>
              </div>

              {/* Payment Methods Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <Shield size={20} />
                  {t.paymentMethods}
                </h3>
                <p className="text-blue-800 text-sm">
                  {t.upi}, {t.cards}, {t.netbanking}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Payment Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white rounded-3xl shadow-lg p-8 sticky top-8">
              <div className="mb-8">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">{t.amount}</span>
                  <span className="text-2xl font-bold text-gray-900">₹{amount}</span>
                </div>

                {consultationType === 'video' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-amber-900">{t.discountOffer}</p>
                  </div>
                )}

                <div className="border-t border-b border-gray-200 py-4 mb-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t.totalPayable}</span>
                    <span className="text-blue-600">₹{amount}</span>
                  </div>
                </div>
              </div>

              {paymentStatus === 'idle' && (
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
                  aria-label="Proceed to payment"
                >
                  {loading ? (
                    <>
                      <Loader2 className="inline animate-spin mr-2" size={18} />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <Lock className="inline mr-2" size={18} />
                      {t.proceedPayment}
                    </>
                  )}
                </button>
              )}

              {paymentStatus === 'processing' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                  <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
                  <p className="text-blue-900 font-semibold">{t.processing}</p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center"
                >
                  <CheckCircle2 className="mx-auto mb-4 text-green-600" size={40} />
                  <p className="text-green-900 font-bold mb-2">{t.success}</p>
                  <p className="text-green-700 text-sm">{t.redirecting}</p>
                </motion.div>
              )}

              {paymentStatus === 'failure' && (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-4">
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-600" size={40} />
                    <p className="text-red-900 font-bold">{t.failure}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentStatus('idle')}
                      className="bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700"
                    >
                      {t.tryAgain}
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="bg-gray-300 text-gray-900 font-bold py-2 rounded-xl hover:bg-gray-400"
                    >
                      {t.homePage}
                    </button>
                  </div>
                </motion.div>
              )}

              <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                <Shield size={14} /> {t.securePayment}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
