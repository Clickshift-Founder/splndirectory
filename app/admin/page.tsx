// FILE: app/admin/page.tsx
// REPLACE YOUR EXISTING FILE WITH THIS
// Adds tabs to switch between 360 Reviews and Capstone

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ==================================================================
// TYPES
// ==================================================================
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

interface CapstoneGroup {
  id: number;
  name: string;
  member_count: number;
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

interface CapstoneResult {
  student_id: number;
  student_name: string;
  matric_number: string;
  phone_number: string;
  capstone_group_name: string;
  avg_q1: number;
  avg_q2: number;
  avg_q3: number;
  overall_avg: number;
  review_count: number;
}

// ==================================================================
// MAIN COMPONENT
// ==================================================================
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'360' | 'capstone'>('360');

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
            <div className="flex items-center gap-3">
              {activeTab === '360' && (
                <>
                  <button
                    onClick={() => router.push('/admin/periods')}
                    className="px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue/90 transition-all flex items-center gap-2"
                  >
                    Manage Periods
                  </button>
                  <button
                    onClick={() => router.push('/admin/pending')}
                    className="px-4 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange/90 transition-all flex items-center gap-2"
                  >
                    Pending Submissions
                  </button>
                </>
              )}
              {activeTab === 'capstone' && (
                <button
                  onClick={() => router.push('/admin/capstone-pending')}
                  className="px-4 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange/90 transition-all flex items-center gap-2"
                >
                  Pending Capstone
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* TAB NAVIGATION */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('360')}
            className={`px-6 py-3 font-display font-semibold transition-all relative ${
              activeTab === '360'
                ? 'text-brand-red'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            360 Reviews
            {activeTab === '360' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-brand-red rounded-t"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('capstone')}
            className={`px-6 py-3 font-display font-semibold transition-all relative ${
              activeTab === 'capstone'
                ? 'text-brand-blue'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Capstone
            {activeTab === 'capstone' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-t"
              />
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === '360' ? <Tab360 /> : <TabCapstone />}
      </div>
    </main>
  );
}

// ==================================================================
// 360 REVIEWS TAB (Your existing content)
// ==================================================================
function Tab360() {
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
    if (selectedPeriod && selectedGroup) loadResults();
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
      const activePeriod = periodsData.find((p: ReviewPeriod) => p.is_active);
      if (activePeriod) setSelectedPeriod(activePeriod.id);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadResults = async () => {
    setError('');
    if (!selectedPeriod || !selectedGroup) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const random = Math.random();
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
      if (!response.ok) throw new Error((await response.json()).error || 'Failed');
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    const period = periods.find(p => p.id === selectedPeriod);
    const group = groups.find(g => g.id === selectedGroup);
    const headers = ['Student Name', 'Matric Number', 'Q1 Average', 'Q2 Average', 'Overall Average', 'Reviews'];
    const rows = results.map(r => [
      r.student_name, r.matric_number,
      r.avg_q1.toFixed(2), r.avg_q2.toFixed(2), r.overall_avg.toFixed(2), r.review_count.toString()
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group?.name || 'AllGroups'}_${period?.period_name}_360_results.csv`;
    a.click();
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-4xl font-display font-bold text-slate-900 mb-3">360 Peer Review Results</h2>
        <p className="text-slate-600">View and analyze 360 peer review data by period and group</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-brand-red/10 border-l-4 border-brand-red rounded-lg">
          <p className="text-brand-red font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Review Period</label>
            <select
              value={selectedPeriod || ''}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all"
            >
              <option value="">Select Period</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>{period.period_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Group</label>
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
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedPeriod && selectedGroup && results.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button onClick={exportToCSV} className="px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all">
              Export to CSV
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600 text-lg">
            {selectedPeriod && selectedGroup ? 'No reviews found for this period and group' : 'Please select a period and group to view results'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Matric Number</th>
                  {showingAllGroups && <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Group</th>}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Q1</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Q2</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Overall</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((result) => (
                  <tr key={result.student_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900 font-medium">{result.student_name}</td>
                    <td className="px-6 py-4 text-slate-600">{result.matric_number}</td>
                    {showingAllGroups && (
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-semibold">
                          {result.group_name || 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">{result.avg_q1?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 text-center">{result.avg_q2?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-brand-red">{result.overall_avg?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{result.review_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ==================================================================
// CAPSTONE TAB (NEW)
// ==================================================================
function TabCapstone() {
  const [capstoneGroups, setCapstoneGroups] = useState<CapstoneGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | string | null>(null);
  const [results, setResults] = useState<CapstoneResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCapstoneOpen, setIsCapstoneOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const showingAllGroups = selectedGroup === 'all';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGroup) loadResults();
  }, [selectedGroup]);

  const loadInitialData = async () => {
    try {
      const [groupsRes, toggleRes] = await Promise.all([
        fetch('/api/capstone/groups', { cache: 'no-store' }),
        fetch('/api/capstone/toggle', { cache: 'no-store' })
      ]);
      const groupsData = await groupsRes.json();
      const toggleData = await toggleRes.json();
      setCapstoneGroups(groupsData);
      setIsCapstoneOpen(toggleData.is_open === true);
    } catch (error) {
      console.error('Error loading capstone data:', error);
    }
  };

  const toggleCapstone = async () => {
    const action = isCapstoneOpen ? 'close' : 'open';
    const confirmMsg = isCapstoneOpen 
      ? '⚠️ Close the capstone rating window? Students will no longer be able to submit ratings.'
      : '✅ Open the capstone rating window? Students will be able to see and submit ratings.';
    if (!window.confirm(confirmMsg)) return;

    setIsToggling(true);
    try {
      const res = await fetch('/api/capstone/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCapstoneOpen(data.is_open);
        alert(data.message);
      } else {
        alert(data.error || 'Failed to toggle');
      }
    } catch (err) {
      alert('Error toggling capstone status');
    } finally {
      setIsToggling(false);
    }
  };

  const loadResults = async () => {
    setError('');
    if (!selectedGroup) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const url = selectedGroup === 'all'
        ? `/api/capstone/results?_t=${timestamp}`
        : `/api/capstone/results?group_id=${selectedGroup}&_t=${timestamp}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0' },
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed');
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const timestamp = Date.now();
      const url = selectedGroup && selectedGroup !== 'all'
        ? `/api/capstone/comments?group_id=${selectedGroup}&_t=${timestamp}`
        : `/api/capstone/comments?_t=${timestamp}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setComments(data);
      setShowComments(true);
    } catch (err) {
      alert('Error loading comments');
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    const group = capstoneGroups.find(g => g.id === selectedGroup);
    const headers = showingAllGroups 
      ? ['Student Name', 'Matric', 'Phone', 'Capstone Group', 'Q1 (Attendance)', 'Q2 (Ownership)', 'Q3 (Respect)', 'Overall', 'Reviews']
      : ['Student Name', 'Matric', 'Phone', 'Q1 (Attendance)', 'Q2 (Ownership)', 'Q3 (Respect)', 'Overall', 'Reviews'];
    const rows = results.map(r => showingAllGroups
      ? [r.student_name, r.matric_number, r.phone_number || '', r.capstone_group_name,
         r.avg_q1.toFixed(2), r.avg_q2.toFixed(2), r.avg_q3.toFixed(2), r.overall_avg.toFixed(2), r.review_count.toString()]
      : [r.student_name, r.matric_number, r.phone_number || '',
         r.avg_q1.toFixed(2), r.avg_q2.toFixed(2), r.avg_q3.toFixed(2), r.overall_avg.toFixed(2), r.review_count.toString()]
    );
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Capstone_${group?.name || 'AllGroups'}_results.csv`;
    a.click();
  };

  const exportCommentsToCSV = () => {
    if (comments.length === 0) return;
    const headers = ['Capstone Group', 'Reviewed Student', 'Matric', 'Reviewer', 'Reviewer Matric', 'Comment', 'Date'];
    const rows = comments.map(c => [
      c.capstone_group_name, c.reviewed_name, c.reviewed_matric,
      c.reviewer_name, c.reviewer_matric,
      `"${(c.comment || '').replace(/"/g, '""')}"`,
      new Date(c.created_at).toLocaleDateString()
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Capstone_Comments.csv`;
    a.click();
  };

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-3">Capstone Rating Results</h2>
          <p className="text-slate-600">View capstone group evaluations and comments</p>
        </div>
        <button
          onClick={toggleCapstone}
          disabled={isToggling}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            isCapstoneOpen
              ? 'bg-brand-red text-white hover:bg-brand-red/90'
              : 'bg-brand-green text-white hover:bg-brand-green/90'
          } disabled:opacity-50`}
        >
          {isToggling ? '...' : isCapstoneOpen ? '🔒 Close Capstone' : '🔓 Open Capstone'}
        </button>
      </div>

      <div className={`mb-6 p-4 rounded-xl border-l-4 ${
        isCapstoneOpen 
          ? 'bg-brand-green/5 border-brand-green'
          : 'bg-slate-50 border-slate-400'
      }`}>
        <p className="font-semibold">
          Status: {isCapstoneOpen ? '🟢 OPEN — Students can submit ratings' : '🔴 CLOSED — Students cannot submit'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-brand-red/10 border-l-4 border-brand-red rounded-lg">
          <p className="text-brand-red font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Capstone Group</label>
          <select
            value={selectedGroup === null ? '' : selectedGroup}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedGroup(value === 'all' ? 'all' : value === '' ? null : Number(value));
            }}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all"
          >
            <option value="">Select Capstone Group</option>
            <option value="all">All Capstone Groups</option>
            {capstoneGroups.map((group) => (
              <option key={group.id} value={group.id}>{group.name} ({group.member_count} members)</option>
            ))}
          </select>
        </div>

        {selectedGroup && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={loadComments}
              className="px-6 py-3 bg-brand-orange text-white rounded-xl font-semibold hover:bg-brand-orange/90 transition-all"
            >
              View Comments
            </button>
            {results.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all"
              >
                Export Ratings CSV
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading capstone results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600 text-lg">
            {selectedGroup ? 'No capstone ratings found yet' : 'Please select a capstone group to view results'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Matric</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                  {showingAllGroups && <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Capstone Group</th>}
                  <th className="px-4 py-4 text-center text-sm font-semibold text-slate-700">Q1</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-slate-700">Q2</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-slate-700">Q3</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-slate-700">Overall</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-slate-700">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((result) => (
                  <tr key={result.student_id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-900 font-medium">{result.student_name}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm">{result.matric_number}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm">{result.phone_number || '-'}</td>
                    {showingAllGroups && (
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue rounded text-xs font-semibold">
                          {result.capstone_group_name}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4 text-center">{result.avg_q1?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-4 text-center">{result.avg_q2?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-4 text-center">{result.avg_q3?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-lg font-bold text-brand-blue">{result.overall_avg?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">{result.review_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-bold">Capstone Comments</h3>
                <p className="text-sm text-slate-500">{comments.length} comments</p>
              </div>
              <div className="flex gap-2">
                {comments.length > 0 && (
                  <button
                    onClick={exportCommentsToCSV}
                    className="px-4 py-2 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => setShowComments(false)}
                  className="px-4 py-2 bg-slate-200 rounded-lg font-semibold hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No comments yet</p>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">About: {c.reviewed_name}</p>
                        <p className="text-xs text-slate-500">{c.reviewed_matric} • {c.capstone_group_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">From: {c.reviewer_name}</p>
                        <p className="text-xs text-slate-400">{c.reviewer_matric}</p>
                      </div>
                    </div>
                    <p className="text-slate-700 italic mt-3 pt-3 border-t border-slate-200">"{c.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}