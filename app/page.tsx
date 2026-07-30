// FILE: app/page.tsx
// REPLACE YOUR EXISTING FILE WITH THIS
// Adds a Capstone rating button that appears when admin has opened the capstone period

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [matricNumber, setMatricNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // NEW: track which mode user selected (360 or capstone)
  const [loginMode, setLoginMode] = useState<'360' | 'capstone'>('360');
  const [capstoneOpen, setCapstoneOpen] = useState(false);

  // Check if capstone is open on load
  useEffect(() => {
    checkCapstoneStatus();
  }, []);

  const checkCapstoneStatus = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/capstone/periods/active?_t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.json();
      setCapstoneOpen(data.is_open === true);
    } catch (err) {
      console.error('Error checking capstone status:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Different endpoint based on mode
      const endpoint = loginMode === 'capstone' 
        ? '/api/auth/login-capstone' 
        : '/api/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matric_number: matricNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('studentId', data.student.id);
        sessionStorage.setItem('matricNumber', data.student.matric_number);
        sessionStorage.setItem('studentName', data.student.name);

        if (loginMode === 'capstone') {
          // Capstone flow
          if (data.already_submitted) {
            // Still route to capstone page - it will show the locked view
            setShowSuccess(true);
            setTimeout(() => {
              router.push(`/capstone/${data.student.id}`);
            }, 1500);
            return;
          }
          setShowSuccess(true);
          setTimeout(() => {
            router.push(`/capstone/${data.student.id}`);
          }, 1500);
        } else {
          // 360 flow (unchanged)
          if (data.already_submitted) {
            setError(`You have already submitted your reviews for ${data.period_name}. Thank you!`);
            setIsLoading(false);
            return;
          }
          setShowSuccess(true);
          setTimeout(() => {
            router.push(`/review/${data.student.id}`);
          }, 1500);
        }
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
    let formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formatted.length > 2) formatted = formatted.slice(0, 3) + '/' + formatted.slice(3);
    if (formatted.length > 7) formatted = formatted.slice(0, 8) + '/' + formatted.slice(8);
    if (formatted.length > 12) formatted = formatted.slice(0, 12);
    return formatted;
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/3 rounded-full blur-3xl" />
      </div>

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
            <h1 className="text-xl font-display font-bold tracking-tight">SPPG</h1>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {loginMode === 'capstone' ? 'Capstone Rating Portal' : '360 Degree Peer Review Portal'}
          </div>
        </div>
      </motion.header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-6xl md:text-7xl font-display font-bold mb-6 text-balance leading-tight">
            Excellence through
            <span className="block mt-2 bg-gradient-to-r from-brand-red via-brand-orange to-brand-blue bg-clip-text text-transparent">
              Collaborative Assessment
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto text-balance">
            Login with your matric number to {loginMode === 'capstone' ? 'rate your capstone group' : 'evaluate your peers'}
          </p>
        </motion.div>

        {/* NEW: CAPSTONE BUTTON (only shows when admin has opened capstone) */}
        {capstoneOpen && loginMode === '360' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <button
              onClick={() => {
                setLoginMode('capstone');
                setError('');
                setMatricNumber('');
              }}
              className="w-full bg-gradient-to-r from-brand-blue to-brand-orange text-white rounded-2xl p-6 hover:shadow-2xl hover:shadow-brand-blue/30 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded uppercase tracking-wider">NEW</span>
                    <h3 className="text-xl font-display font-bold">Capstone Rating is Open</h3>
                  </div>
                  <p className="text-white/90 text-sm">Rate your capstone group members (one-time evaluation)</p>
                </div>
                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  <span className="font-semibold">Click here to rate</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* SWITCH BACK TO 360 (only shows in capstone mode) */}
        {loginMode === 'capstone' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 text-center"
          >
            <button
              onClick={() => {
                setLoginMode('360');
                setError('');
                setMatricNumber('');
              }}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              ← Back to 360 Degree Review
            </button>
          </motion.div>
        )}

        {/* Login card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
            {/* Mode indicator */}
            <div className="mb-6 flex items-center justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                loginMode === 'capstone' 
                  ? 'bg-brand-blue/10 text-brand-blue' 
                  : 'bg-brand-red/10 text-brand-red'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  loginMode === 'capstone' ? 'bg-brand-blue' : 'bg-brand-red'
                }`} />
                {loginMode === 'capstone' ? 'CAPSTONE MODE' : '360 REVIEW MODE'}
              </div>
            </div>

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
                className={`w-full text-white font-display font-bold text-xl py-5 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  loginMode === 'capstone'
                    ? 'bg-gradient-to-r from-brand-blue to-brand-orange hover:shadow-2xl hover:shadow-brand-blue/30'
                    : 'bg-gradient-to-r from-brand-red to-brand-orange hover:shadow-2xl hover:shadow-brand-red/30'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  loginMode === 'capstone' ? 'Login & Rate Capstone' : 'Login & Start Review'
                )}
              </button>
            </form>

            <div className={`mt-8 p-4 rounded-xl border ${
              loginMode === 'capstone' 
                ? 'bg-brand-blue/5 border-brand-blue/20' 
                : 'bg-brand-blue/5 border-brand-blue/20'
            }`}>
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Security Notice</p>
                  <p>
                    {loginMode === 'capstone'
                      ? 'Capstone rating is a one-time submission. Please rate all group members carefully.'
                      : 'Your matric number is verified against our database. You can only submit reviews once per month.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 text-slate-500 text-sm"
        >
          Having trouble? Contact your administrator.
          Powered by The School of Politics Policy and Governance
        </motion.p>
      </div>

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
                Loading your {loginMode === 'capstone' ? 'capstone rating' : 'review'} form...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}