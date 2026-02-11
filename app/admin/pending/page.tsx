'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface PendingStudent {
  id: number;
  name: string;
  matric_number: string;
  email: string;
  phone_number: string;
  group_name: string;
}

interface PendingData {
  period_name: string;
  total_pending: number;
  students: PendingStudent[];
}

export default function PendingSubmissionsPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [pendingData, setPendingData] = useState<PendingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPeriodsAndGroups();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPendingSubmissions();
    }
  }, [selectedPeriod, selectedGroup]);

  const loadPeriodsAndGroups = async () => {
    try {
      // Load periods
      const periodsRes = await fetch('/api/periods', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const periodsData = await periodsRes.json();
      setPeriods(periodsData);

      // Auto-select active period
      const activePeriod = periodsData.find((p: any) => p.is_active);
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id.toString());
      }

      // Load groups
      const groupsRes = await fetch('/api/groups', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading periods/groups:', error);
    }
  };

  const loadPendingSubmissions = async () => {
    if (!selectedPeriod) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        period_id: selectedPeriod,
      });

      if (selectedGroup !== 'all') {
        params.append('group_id', selectedGroup);
      }

      const response = await fetch(`/api/admin/pending-submissions?${params}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const data = await response.json();
      setPendingData(data);
    } catch (error) {
      console.error('Error loading pending submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!pendingData || pendingData.students.length === 0) return;

    const headers = ['Name', 'Matric Number', 'Phone Number', 'Email', 'Group'];
    const rows = pendingData.students.map(s => [
      s.name,
      s.matric_number,
      s.phone_number || 'N/A',
      s.email || 'N/A',
      s.group_name
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-submissions-${pendingData.period_name.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const copyPhoneNumbers = () => {
    if (!pendingData || pendingData.students.length === 0) return;

    const phones = pendingData.students
      .map(s => s.phone_number)
      .filter(p => p && p.trim() !== '')
      .join(', ');

    navigator.clipboard.writeText(phones);
    alert('Phone numbers copied to clipboard!');
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-3">
            Pending Submissions
          </h2>
          <p className="text-slate-600">
            Track students who haven't submitted reviews yet
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Review Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
              >
                <option value="">Select Period</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.period_name} {period.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Group Filter
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
              >
                <option value="all">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Summary */}
        {pendingData && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <p className="text-sm text-slate-600 mb-1">Period</p>
                <p className="text-2xl font-display font-bold text-slate-900">
                  {pendingData.period_name}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <p className="text-sm text-slate-600 mb-1">Pending Students</p>
                <p className="text-2xl font-display font-bold text-brand-orange">
                  {pendingData.total_pending}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex items-center gap-3">
                <button
                  onClick={exportToCSV}
                  disabled={pendingData.total_pending === 0}
                  className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={copyPhoneNumbers}
                  disabled={pendingData.total_pending === 0}
                  className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  📋 Copy Phones
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Student List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading pending submissions...</p>
          </div>
        ) : !pendingData ? (
          <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-600">Select a period to view pending submissions</p>
          </div>
        ) : pendingData.total_pending === 0 ? (
          <div className="bg-brand-green/10 border-2 border-brand-green rounded-2xl p-12 text-center">
            <p className="text-brand-green text-xl font-semibold mb-2">🎉 All students have submitted!</p>
            <p className="text-slate-600">No pending submissions for this period.</p>
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Matric Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pendingData.students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-900 font-medium">{student.name}</td>
                      <td className="px-6 py-4 text-slate-600">{student.matric_number}</td>
                      <td className="px-6 py-4">
                        {student.phone_number ? (
                          <a
                            href={`tel:${student.phone_number}`}
                            className="text-brand-blue hover:text-brand-blue/80 font-medium"
                          >
                            {student.phone_number}
                          </a>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-semibold">
                          {student.group_name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}