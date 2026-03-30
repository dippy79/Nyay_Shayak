import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ShieldCheck, ArrowRight, RotateCcw, Timer, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase';
import { useRouter } from 'react-router-dom';
import type { Database } from '../../types/supabase'; // Assume types generated

interface OTPFieldProps {
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  index: number;
}

const OTPField: React.FC<OTPFieldProps> = ({ value, onChange, isActive, index }) => (
  <motion.input
    key={`otp-${index}`}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className={cn(
      'w-16 h-16 text-2xl font-bold text-center border-2 rounded-2xl mx-2 focus:outline-none focus:ring-4 focus:ring-primary focus:border-primary transition-all shadow-lg',
      isActive ? 'ring-4 ring-primary border-primary shadow-primary/25' : 'border-outline-variant/30 shadow-sm'
    )}
    value={value}
    onChange={(e) => {
      const val = e.target.value.slice(0, 1);
      onChange(val);
    }}
    onKeyDown={(e) => {
      if (e.key === 'Backspace' && !value) {
        (e.target as HTMLInputElement).previousElementSibling?.focus();
      }
    }}
    maxLength={1}
    inputMode="numeric"
    pattern="[0-9]*"
    autoComplete="one-time-code"
  />
);

const LoginScreen: React.FC = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendTimer]);

  const sendOTP = async () => {
    if (!phone || !/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: {
          channel: 'sms'
        }
      });

      if (error) throw error;

      setMessage('OTP sent! Check your SMS.');
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter full 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otpCode,
        type: 'sms'
      });

      if (error) throw error;

      setMessage('Login successful! Redirecting...');
      // Router to dashboard after delay
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      // Focus first field
      document.querySelector('input')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      (document.querySelector(`input:nth-child(${index + 2})`) as HTMLInputElement)?.focus();
    }

    // Auto verify if complete
    if (newOtp.every(v => v !== '') && index === 5) {
      verifyOTP();
    }
  };

  const resendOTP = async () => {
    setIsResending(true);
    await sendOTP();
    setIsResending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone') sendOTP();
      else verifyOTP();
    }
    if (e.key === 'Escape') setStep('phone');
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary to-primary-container flex items-center justify-center p-6"
      onKeyDown={handleKeyDown}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl mx-auto flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark/80 bg-clip-text text-transparent">
              Welcome to Legis
            </h1>
            <p className="text-secondary text-sm mt-2">
              Secure login with your mobile number
            </p>
          </div>
        </div>

        {/* Phone Input */}
        <AnimatePresence mode="wait">
          {step === 'phone' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-outline-variant" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit phone"
                  className="w-full pl-12 pr-4 py-4 border-2 border-outline-variant rounded-2xl bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-lg font-semibold"
                  maxLength={10}
                />
              </div>
              <motion.button
                onClick={sendOTP}
                disabled={loading || phone.length !== 10}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-6 h-6" />
                    Send OTP
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* OTP Input */}
          {step === 'otp' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-center mb-4">Enter 6-digit OTP</h3>
                <p className="text-secondary text-sm text-center mb-6">
                  Sent to +91{phone}
                </p>
                <div className="flex justify-center">
                  {otp.map((digit, index) => (
                    <OTPField
                      key={index}
                      value={digit}
                      onChange={(val) => handleOtpChange(val, index)}
                      isActive={otp[index] !== '' || otp.slice(0, index).every(d => d !== '')}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Timer */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <Timer className="w-4 h-4 text-secondary" />
                <span className="text-secondary font-mono">
                  Resend in {resendTimer}s
                </span>
                {resendTimer === 0 && (
                  <motion.button
                    onClick={resendOTP}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isResending}
                    className="text-primary font-bold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </motion.button>
                )}
              </div>

              <motion.button
                onClick={verifyOTP}
                disabled={loading || otp.some(d => d === '')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    Verify & Continue
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl text-destructive font-medium text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary/10 border border-primary/30 rounded-2xl text-primary font-medium text-sm text-center"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button */}
        {step === 'otp' && (
          <motion.button
            onClick={() => setStep('phone')}
            whileHover={{ scale: 1.05 }}
            className="w-full flex items-center justify-center gap-2 text-secondary hover:text-primary py-3 font-medium text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Change Phone Number
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default LoginScreen;

