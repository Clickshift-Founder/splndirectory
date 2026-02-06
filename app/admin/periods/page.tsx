'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isProcessing, setIsProcessing] = useState(false);
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
      setIsLoading(true);
      // Force fresh data with cache busting
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/periods?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
      setPeriods([...data]); // Create new array to force re-render
      
      console.log('✅ Periods loaded:', data);
    } catch (error) {
      console.error('❌ Error loading periods:', error);
      setError('Failed to load periods');
    } finally {
      setIsLoading(false);
    }
  };

  const forcePageRefresh = () => {
    // Nuclear option: force complete page reload
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const createNewPeriod = async () => {
    setError('');
    setSuccess('');

    if (!newPeriodMonth || !newPeriodYear) {
      setError('Please select both month and year');
      return;
    }

    setIsProcessing(true);
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
        setSuccess(`✅ Created: ${data.period.period_name}`);
        setShowCreateForm(false);
        setNewPeriodMonth('');
        setNewPeriodYear('');
        
        // Force page reload to show new period
        forcePageRefresh();
      } else {
        setError(data.error || 'Failed to create period');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Create error:', error);
      setError('Connection error. Please try again.');
      setIsProcessing(false);
    }
  };

  const activatePeriod = async (periodId: number, periodName: string) => {
    if (!confirm(`Activate "${periodName}"?\n\nThis will deactivate all other periods and allow students to submit reviews.`)) {
      return;
    }

    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/periods/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_id: periodId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ Activated: ${data.period.period_name}`);
        
        // Force page reload to update UI
        forcePageRefresh();
      } else {
        setError(data.error || 'Failed to activate period');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Activate error:', error);
      setError('Connection error. Please try again.');
      setIsProcessing(false);
    }
  };

  const deactivatePeriod = async (periodId: number, periodName: string) => {
    if (!confirm(`Deactivate "${periodName}"?\n\nStudents will not be able to submit reviews until you activate another period.`)) {
      return;
    }

    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/periods/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setSuccess('✅ All periods deactivated');
        
        // Force page reload
        forcePageRefresh();
      } else {
        setError('Failed to deactivate period');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Deactivate error:', error);
      setError('Connection error. Please try again.');
      setIsProcessing(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const activePeriod = periods.find(p => p.is_active);

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

        {/* Active Period Alert */}
        {activePeriod && !isLoading && (
          <motion.div
            key={`active-${activePeriod.id}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 p-6 bg-brand-green/10 border-l-4 border-brand-green rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse" />
                <div>
                  <p className="font-semibold text-brand-green text-lg">Currently Active Period</p>
                  <p className="text-slate-700 text-xl font-display font-bold mt-1">{activePeriod.period_name}</p>
                  <p className="text-sm text-slate-600 mt-1">✓ Students can submit reviews</p>
                </div>
              </div>
              <button
                onClick={() => deactivatePeriod(activePeriod.id, activePeriod.period_name)}
                disabled={isProcessing}
                className="px-4 py-2 bg-brand-red text-white rounded-lg font-semibold hover:bg-brand-red/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Deactivate'}
              </button>
            </div>
          </motion.div>
        )}

        {/* No Active Period Warning */}
        {!activePeriod && !isLoading && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 p-6 bg-brand-orange/10 border-l-4 border-brand-orange rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-brand-orange">No Active Period</p>
                <p className="text-slate-600 text-sm">Students cannot submit reviews. Activate a period below to begin.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-brand-red/10 border-l-4 border-brand-red rounded-lg"
            >
              <p className="text-brand-red font-medium">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-brand-green/10 border-l-4 border-brand-green rounded-lg"
            >
              <p className="text-brand-green font-medium">{success}</p>
              <p className="text-slate-600 text-sm mt-1">Page will refresh in a moment...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create New Period Button */}
        {!showCreateForm && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setShowCreateForm(true)}
            disabled={isProcessing}
            className="mb-8 px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Period
          </motion.button>
        )}

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                Create New Review Period
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                💡 <strong>Tip:</strong> Create periods in advance. Activate when ready.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Month
                  </label>
                  <select
                    value={newPeriodMonth}
                    onChange={(e) => setNewPeriodMonth(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 disabled:opacity-50"
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
                    disabled={isProcessing}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 disabled:opacity-50"
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
                  disabled={isProcessing}
                  className="px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Creating...' : 'Create Period'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPeriodMonth('');
                    setNewPeriodYear('');
                    setError('');
                  }}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Periods List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading periods...</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-600 text-lg mb-4">No review periods created yet</p>
            <p className="text-slate-500 text-sm">Click "Create New Period" above to get started</p>
          </div>
        ) : (
          <motion.div
            key={periods.map(p => `${p.id}-${p.is_active}`).join('-')}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="divide-y divide-slate-200">
              {periods
                .sort((a, b) => {
                  if (a.year !== b.year) return b.year - a.year;
                  return b.month - a.month;
                })
                .map((period) => (
                  <div
                    key={`period-${period.id}`}
                    className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {period.is_active ? (
                        <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3 h-3 bg-slate-300 rounded-full" />
                      )}
                      <div>
                        <h4 className="text-lg font-display font-bold text-slate-900">
                          {period.period_name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {period.is_active ? (
                            <span className="text-brand-green font-semibold">✓ Currently Active - Students can submit</span>
                          ) : (
                            'Inactive'
                          )}
                        </p>
                      </div>
                    </div>
                    {!period.is_active && (
                      <button
                        onClick={() => activatePeriod(period.id, period.period_name)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : 'Activate'}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-brand-blue/5 rounded-2xl border border-brand-blue/20"
        >
          <h4 className="font-display font-bold text-slate-900 mb-3">How Period Management Works</h4>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="text-brand-blue">•</span>
              <span><strong>Create</strong> periods in advance</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-blue">•</span>
              <span><strong>Activate</strong> when ready for submissions</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-blue">•</span>
              <span><strong>Only ONE</strong> period can be active at a time</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-blue">•</span>
              <span><strong>Page refreshes</strong> after each action to update UI</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </main>
  );
}