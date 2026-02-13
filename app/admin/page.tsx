'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // ← ADD THIS LINE

interface ReviewPeriod {
  id: number;
  period_name: string;
  month: number;
  year: number;
  is_active: boolean;
}

interface Group {
  id: number;
  name: string;
}

interface StudentResult {
  student_id: number;
  student_name: string;
  matric_number: string;
  group_name: string;
  avg_q1: number;
  avg_q2: number;
  overall_avg: number;
  review_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [periods, setPeriods] = useState<ReviewPeriod[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | string | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const showingAllGroups = selectedGroup === 'all';


  useEffect(() => {
    loadPeriodsAndGroups();
  }, []);

  useEffect(() => {
    if (selectedPeriod && selectedGroup) {
      loadResults();
    }
  }, [selectedPeriod, selectedGroup]);

  const loadPeriodsAndGroups = async () => {
    try {
      const [periodsRes, groupsRes] = await Promise.all([
        fetch('/api/periods'),
        fetch('/api/groups')
      ]);

      const periodsData = await periodsRes.json();
      const groupsData = await groupsRes.json();

      setPeriods(periodsData);
      setGroups(groupsData);

      // Auto-select active period if exists
      const activePeriod = periodsData.find((p: ReviewPeriod) => p.is_active);
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id);
      }

      // Auto-select first group
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

const loadResults = async () => {
  if (!selectedPeriod) {
    setResults([]);
    return;
  }

  // Allow showing all groups
  if (!selectedGroup) {
    setResults([]);
    return;
  }

  setIsLoading(true);
  try {
    const timestamp = Date.now();
    const random = Math.random();
    
    // Build URL: omit group_id if "all" is selected
    const url = selectedGroup === 'all'
      ? `/api/results?period_id=${selectedPeriod}&_t=${timestamp}&_r=${random}`
      : `/api/results?period_id=${selectedPeriod}&group_id=${selectedGroup}&_t=${timestamp}&_r=${random}`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch results');
    }

    const data = await response.json();
    setResults(data);
  } catch (error) {
    console.error('Error loading results:', error);
    setError('Failed to load results');
  } finally {
    setIsLoading(false);
  }
};

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-brand-green';
    if (score >= 3.5) return 'text-brand-blue';
    if (score >= 2.5) return 'text-brand-orange';
    return 'text-brand-red';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Below Average';
    return 'Poor';
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const period = periods.find(p => p.id === selectedPeriod);
    const group = groups.find(g => g.id === selectedGroup);

    const headers = ['Student Name', 'Matric Number', 'Q1 Average', 'Q2 Average', 'Overall Average', 'Number of Reviews'];
    const rows = results.map(r => [
      r.student_name,
      r.matric_number,
      r.avg_q1.toFixed(2),
      r.avg_q2.toFixed(2),
      r.overall_avg.toFixed(2),
      r.review_count.toString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group?.name}_${period?.period_name}_results.csv`;
    a.click();
  };

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
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <div className="w-2 h-8 bg-brand-red rounded-full" />
          <div className="w-2 h-8 bg-brand-blue rounded-full" />
          <div className="w-2 h-8 bg-brand-orange rounded-full" />
          <div className="w-2 h-8 bg-brand-green rounded-full" />
        </div>
        <h1 className="text-xl font-display font-bold">SPPG Admin Dashboard</h1>
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/periods')}
          className="px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue/90 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Manage Periods
        </button>

        <button
          onClick={() => router.push('/admin/pending')}
          className="px-4 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange/90 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Pending Submissions
        </button>
      </div>
    </div>
  </div>
</motion.header>


      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-3">
            Peer Review Results
          </h2>
          <p className="text-slate-600">
            View and analyze peer review data by period and group
          </p>
        </motion.div>

        {error && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-6 mb-4"
      >
        <div className="p-4 bg-brand-red/10 border-l-4 border-brand-red rounded-lg">
          <p className="text-brand-red font-medium">{error}</p>
        </div>
      </motion.div>
    )}

        {/* Filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Period Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                Review Period
              </label>
              <select
              value={selectedGroup === null ? '' : selectedGroup}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedGroup(value === 'all' ? 'all' : value === '' ? null : Number(value));
              }}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all"
            >
              <option value="">Select Group</option>
              <option value="all">All Groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            </div>

            {/* Group Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                Group
              </label>
              <select
                value={selectedGroup || ''}
                onChange={(e) => setSelectedGroup(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all"
              >
                <option value="">Select Group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPeriod && selectedGroup && results.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={exportToCSV}
                className="px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to CSV
              </button>
            </div>
          )}
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading results...</p>
          </div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center"
          >
            <p className="text-slate-600 text-lg">
              {selectedPeriod && selectedGroup
                ? 'No reviews found for this period and group'
                : 'Please select a period and group to view results'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
               <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Matric Number</th>
          {showingAllGroups && (
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Group</th>
          )}
          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Q1 Avg</th>
          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Q2 Avg</th>
          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Overall</th>
          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Reviews</th>
        </tr>
      </thead>
                <tbody className="divide-y divide-slate-200">
            {results.map((result) => (
              <tr key={result.student_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-900 font-medium">{result.student_name}</td>
                <td className="px-6 py-4 text-slate-600">{result.matric_number}</td>
                {showingAllGroups && (
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-semibold">
                      {result.group_name || 'N/A'}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 text-center text-slate-900">
                  {result.avg_q1?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 text-center text-slate-900">
                  {result.avg_q2?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-lg font-bold text-brand-red">
                    {result.overall_avg?.toFixed(2) || '0.00'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-slate-600">
                  {result.review_count || 0}
                </td>
              </tr>
            ))}
          </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Statistics */}
        {results.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid md:grid-cols-4 gap-6"
          >
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">
                Students
              </div>
              <div className="text-3xl font-display font-bold text-slate-900">
                {results.length}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">
                Avg Q1 Score
              </div>
              <div className="text-3xl font-display font-bold text-brand-blue">
                {(results.reduce((sum, r) => sum + r.avg_q1, 0) / results.length).toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">
                Avg Q2 Score
              </div>
              <div className="text-3xl font-display font-bold text-brand-orange">
                {(results.reduce((sum, r) => sum + r.avg_q2, 0) / results.length).toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">
                Overall Avg
              </div>
              <div className="text-3xl font-display font-bold text-brand-green">
                {(results.reduce((sum, r) => sum + r.overall_avg, 0) / results.length).toFixed(2)}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}