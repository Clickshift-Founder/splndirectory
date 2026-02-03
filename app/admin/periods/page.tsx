'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ReviewPeriod {
  id: number;
  period_name: string;
  month: number;
  year: number;
  is_active: boolean;
}

export default function AdminPeriodsPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<ReviewPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState('');
  const [newPeriodYear, setNewPeriodYear] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const response = await fetch('/api/periods');
      const data = await response.json();
      setPeriods(data);
    } catch (error) {
      console.error('Error loading periods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPeriod = async () => {
    setError('');
    setSuccess('');

    if (!newPeriodMonth || !newPeriodYear) {
      setError('Please select both month and year');
      return;
    }

    try {
      const response = await fetch('/api/admin/periods/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(newPeriodMonth),
          year: parseInt(newPeriodYear),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Created new period: ${data.period.period_name}`);
        setShowCreateForm(false);
        setNewPeriodMonth('');
        setNewPeriodYear('');
        loadPeriods();
      } else {
        setError(data.error || 'Failed to create period');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    }
  };

  const activatePeriod = async (periodId: number) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/periods/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_id: periodId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Activated period: ${data.period.period_name}`);
        loadPeriods();
      } else {
        setError(data.error || 'Failed to activate period');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-slate-200 bg-white/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-2 h-8 bg-brand-red rounded-full" />
                <div className="w-2 h-8 bg-brand-blue rounded-full" />
                <div className="w-2 h-8 bg-brand-orange rounded-full" />
                <div className="w-2 h-8 bg-brand-green rounded-full" />
              </div>
              <h1 className="text-xl font-display font-bold">SPPG Admin</h1>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-3">
            Manage Review Periods
          </h2>
          <p className="text-slate-600">
            Create new review periods and activate them for student submissions
          </p>
        </motion.div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-brand-red/10 border-l-4 border-brand-red rounded-lg"
          >
            <p className="text-brand-red font-medium">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-brand-green/10 border-l-4 border-brand-green rounded-lg"
          >
            <p className="text-brand-green font-medium">{success}</p>
          </motion.div>
        )}

        {/* Create New Period Button */}
        {!showCreateForm && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setShowCreateForm(true)}
            className="mb-8 px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Period
          </motion.button>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
          >
            <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
              Create New Review Period
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Month
                </label>
                <select
                  value={newPeriodMonth}
                  onChange={(e) => setNewPeriodMonth(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                >
                  <option value="">Select Month</option>
                  {monthNames.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Year
                </label>
                <select
                  value={newPeriodYear}
                  onChange={(e) => setNewPeriodYear(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createNewPeriod}
                className="px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all"
              >
                Create Period
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPeriodMonth('');
                  setNewPeriodYear('');
                  setError('');
                }}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Periods List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading periods...</p>
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="divide-y divide-slate-200">
              {periods.map((period) => (
                <div
                  key={period.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {period.is_active && (
                      <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse" />
                    )}
                    <div>
                      <h4 className="text-lg font-display font-bold text-slate-900">
                        {period.period_name}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {period.is_active ? 'Currently Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  {!period.is_active && (
                    <button
                      onClick={() => activatePeriod(period.id)}
                      className="px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue/90 transition-all"
                    >
                      Activate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}