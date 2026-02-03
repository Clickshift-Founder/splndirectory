'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  name: string;
  matric_number: string;
  group_id: number;
}

export default function Home() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleSearch = async (value: string) => {
    setSearchInput(value);
    
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(value)}`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setSearchInput(student.name);
    setSuggestions([]);
    
    // Redirect to review page after a brief moment
    setTimeout(() => {
      router.push(`/review/${student.id}`);
    }, 800);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Decorative background elements */}
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
            360 Degree Peer Review Portal
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
            Evaluate your peers with thoughtfulness and integrity
          </p>
        </motion.div>

        {/* Search card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">
                Enter Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Start typing your name..."
                  className="w-full px-6 py-5 text-lg border-2 border-slate-200 rounded-2xl focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10 transition-all duration-200 placeholder:text-slate-400"
                  disabled={selectedStudent !== null}
                />
                {isLoading && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Select Your Name
                  </p>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {suggestions.map((student, index) => (
                      <motion.button
                        key={student.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-brand-red hover:bg-brand-red/5 transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-brand-red transition-colors">
                              {student.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              Matric: {student.matric_number}
                            </div>
                          </div>
                          <div className="text-brand-red opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected student confirmation */}
            <AnimatePresence>
              {selectedStudent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-8 p-6 bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-2xl border-2 border-brand-green/30"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-semibold text-brand-green text-lg">
                      Identity Confirmed
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Redirecting to review form...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 text-slate-500 text-sm"
        >
          Type at least 2 characters to search for your name
        </motion.p>
      </div>
    </main>
  );
}
