// FILE: app/admin/capstone-pending/page.tsx
// Pending capstone submissions - who hasn't submitted yet

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface CapstoneGroup {
  id: number;
  name: string;
  member_count: number;
}

interface PendingStudent {
  id: number;
  name: string;
  matric_number: string;
  phone_number: string;
  capstone_group_name: string;
}

export default function CapstonePendingPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<CapstoneGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [pending, setPending] = useState<PendingStudent[]>([]);
  const [stats, setStats] = useState({ submitted: 0, total: 0, pending: 0 });
  const [periodName, setPeriodName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    loadPending();
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/capstone/groups', { cache: 'no-store' });
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPending = async () => {
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const url = selectedGroup === 'all'
        ? `/api/capstone/pending?_t=${timestamp}`
        : `/api/capstone/pending?group_id=${selectedGroup}&_t=${timestamp}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setPending(data.pending || []);
      setStats({
        submitted: data.submitted_count || 0,
        total: data.total_count || 0,
        pending: data.pending_count || 0
      });
      setPeriodName(data.period_name || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPhones = () => {
    const phones = pending.map(p => p.phone_number).filter(Boolean).join(', ');
    navigator.clipboard.writeText(phones);
    alert(`Copied ${pending.filter(p => p.phone_number).length} phone numbers to clipboard`);
  };

  const exportCSV = () => {
    if (pending.length === 0) return;
    const headers = ['Name', 'Matric Number', 'Phone', 'Capstone Group'];
    const rows = pending.map(p => [p.name, p.matric_number, p.phone_number || '', p.capstone_group_name]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Capstone_Pending_${selectedGroup === 'all' ? 'All' : 'Group'}.csv`;
    a.click();
  };

  const percent = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-slate-200 bg-white/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-2 h-8 bg-brand-red rounded-full" />
              <div className="w-2 h-8 bg-brand-blue rounded-full" />
              <div className="w-2 h-8 bg-brand-orange rounded-full" />
              <div className="w-2 h-8 bg-brand-green rounded-full" />
            </div>
            <h1 className="text-xl font-display font-bold">Capstone Pending Submissions</h1>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to Admin
          </button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">Period</div>
            <div className="text-lg font-display font-bold text-slate-900">{periodName || 'None'}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">Total Students</div>
            <div className="text-3xl font-display font-bold text-slate-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">Submitted</div>
            <div className="text-3xl font-display font-bold text-brand-green">{stats.submitted}</div>
            <div className="text-xs text-slate-500 mt-1">{percent}% complete</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">Pending</div>
            <div className="text-3xl font-display font-bold text-brand-red">{stats.pending}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Filter by Capstone Group</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue focus:outline-none"
          >
            <option value="all">All Capstone Groups</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.member_count} members)</option>
            ))}
          </select>

          {pending.length > 0 && (
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={copyPhones} className="px-4 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange/90">
                📋 Copy Phones
              </button>
              <button onClick={exportCSV} className="px-4 py-2 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90">
                Export CSV
              </button>
            </div>
          )}
        </div>

        {/* Pending list */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-brand-green/5 border-2 border-dashed border-brand-green/30 rounded-2xl p-12 text-center">
            <p className="text-2xl font-display font-bold text-brand-green mb-2">🎉 All Submitted!</p>
            <p className="text-slate-600">Everyone in this filter has submitted their capstone ratings.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Matric</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Capstone Group</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pending.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900 font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{p.matric_number}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{p.phone_number || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue rounded text-xs font-semibold">
                        {p.capstone_group_name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}