'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  avg_q1: number;
  avg_q2: number;
  overall_avg: number;
  review_count: number;
}

export default function AdminDashboard() {
  const [periods, setPeriods] = useState<ReviewPeriod[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!selectedPeriod || !selectedGroup) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/results?period_id=${selectedPeriod}&group_id=${selectedGroup}`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error loading results:', error);
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
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-2 h-8 bg-brand-red rounded-full" />
                <div className="w-2 h-8 bg-brand-blue rounded-full" />
                <div className="w-2 h-8 bg-brand-orange rounded-full" />
                <div className="w-2 h-8 bg-brand-green rounded-full" />
              </div>
              <h1 className="text-xl font-display font-bold">SPPG Admin Dashboard</h1>
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
                value={selectedPeriod || ''}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10 transition-all"
              >
                <option value="">Select Period</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.period_name} {period.is_active && '(Active)'}
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Matric
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Q1 Avg
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Q2 Avg
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Overall
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Reviews
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((result, index) => (
                    <motion.tr
                      key={result.student_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {result.student_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {result.matric_number}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-2xl font-display font-bold ${getScoreColor(result.avg_q1)}`}>
                          {result.avg_q1.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {getScoreLabel(result.avg_q1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-2xl font-display font-bold ${getScoreColor(result.avg_q2)}`}>
                          {result.avg_q2.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {getScoreLabel(result.avg_q2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-3xl font-display font-bold ${getScoreColor(result.overall_avg)}`}>
                          {result.overall_avg.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {getScoreLabel(result.overall_avg)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand-blue/10 text-brand-blue">
                          {result.review_count}
                        </span>
                      </td>
                    </motion.tr>
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