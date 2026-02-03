'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [matricNumber, setMatricNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matric_number: matricNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store student info in session
        sessionStorage.setItem('studentId', data.student.id);
        sessionStorage.setItem('matricNumber', data.student.matric_number);
        sessionStorage.setItem('studentName', data.student.name);
        
        // Check if already submitted for current period
        if (data.already_submitted) {
          setError(`You have already submitted your reviews for ${data.period_name}. Thank you!`);
          setIsLoading(false);
          return;
        }

        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/review/${data.student.id}`);
        }, 1500);
      } else {
        setError(data.error || 'Invalid matric number');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMatricNumber = (value: string) => {
    // Auto-format as user types: SC6/2510/XXX
    let formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (formatted.length > 2) {
      formatted = formatted.slice(0, 3) + '/' + formatted.slice(3);
    }
    if (formatted.length > 7) {
      formatted = formatted.slice(0, 8) + '/' + formatted.slice(8);
    }
    if (formatted.length > 12) {
      formatted = formatted.slice(0, 12);
    }
    
    return formatted;
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-2 h-8 bg-brand-red rounded-full" />
              <div className="w-2 h-8 bg-brand-blue rounded-full" />
              <div className="w-2 h-8 bg-brand-orange rounded-full" />
              <div className="w-2 h-8 bg-brand-green rounded-full" />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight">
              SPPG
            </h1>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Peer Review Portal
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl md:text-7xl font-display font-bold mb-6 text-balance leading-tight">
            Excellence through
            <span className="block mt-2 bg-gradient-to-r from-brand-red via-brand-orange to-brand-blue bg-clip-text text-transparent">
              Collaborative Assessment
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto text-balance">
            Login with your matric number to evaluate your peers
          </p>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
            <form onSubmit={handleLogin}>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">
                  Matric Number
                </label>
                <input
                  type="text"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(formatMatricNumber(e.target.value))}
                  placeholder="SC6/2510/001"
                  className="w-full px-6 py-5 text-lg border-2 border-slate-200 rounded-2xl focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10 transition-all duration-200 placeholder:text-slate-400 font-mono"
                  disabled={isLoading}
                  maxLength={12}
                  required
                />
                <p className="text-sm text-slate-500 mt-2">
                  Format: SC6/2510/XXX (e.g., SC6/2510/001)
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-brand-red/10 border-l-4 border-brand-red rounded-lg"
                >
                  <p className="text-brand-red font-medium">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading || matricNumber.length < 12}
                className="w-full bg-gradient-to-r from-brand-red to-brand-orange text-white font-display font-bold text-xl py-5 rounded-2xl hover:shadow-2xl hover:shadow-brand-red/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Login & Start Review'
                )}
              </button>
            </form>

            {/* Info box */}
            <div className="mt-8 p-4 bg-brand-blue/5 rounded-xl border border-brand-blue/20">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Security Notice</p>
                  <p>Your matric number is verified against our database. You can only submit reviews once per month.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 text-slate-500 text-sm"
        >
          Having trouble? Contact your administrator
        </motion.p>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-display font-bold text-slate-900 mb-3">
                Login Successful!
              </h3>
              <p className="text-slate-600">
                Loading your review form...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}