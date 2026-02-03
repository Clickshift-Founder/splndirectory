'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  name: string;
  matric_number: string;
  group_id: number;
}

interface GroupMember extends Student {
  isReviewer?: boolean;
}

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  max_score: number;
}

interface ReviewPeriod {
  id: number;
  period_name: string;
  month: number;
  year: number;
  is_active: boolean;
}

interface Review {
  reviewed_id: number;
  question1_score: number;
  question2_score: number;
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activePeriod, setActivePeriod] = useState<ReviewPeriod | null>(null);
  const [reviews, setReviews] = useState<Record<number, Review>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      // Fetch student info
      const studentRes = await fetch(`/api/students/${params.id}`);
      const studentData = await studentRes.json();
      setStudent(studentData);

      // Fetch active review period
      const periodRes = await fetch('/api/periods/active');
      const periodData = await periodRes.json();
      setActivePeriod(periodData);

      // Fetch group members
      const membersRes = await fetch(`/api/groups/${studentData.group_id}/members`);
      const membersData = await membersRes.json();
      
      // Filter out the current student
      const otherMembers = membersData.filter((m: GroupMember) => m.id !== studentData.id);
      setGroupMembers(otherMembers);

      // Fetch questions
      const questionsRes = await fetch('/api/questions');
      const questionsData = await questionsRes.json();
      setQuestions(questionsData);

      // Initialize review scores (default to 3 - middle of 1-5 scale)
      const initialReviews: Record<number, Review> = {};
      otherMembers.forEach((member: GroupMember) => {
        initialReviews[member.id] = {
          reviewed_id: member.id,
          question1_score: 3,
          question2_score: 3,
        };
      });
      setReviews(initialReviews);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const handleScoreChange = (memberId: number, questionNumber: number, score: number) => {
    setReviews((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [`question${questionNumber}_score`]: score,
      },
    }));
  };

  const getScoreLabel = (score: number) => {
    const labels = {
      1: 'Poor',
      2: 'Below Average',
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    };
    return labels[score as keyof typeof labels] || '';
  };

  const handleSubmit = async () => {
    if (!student || !activePeriod) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: student.id,
          review_period_id: activePeriod.id,
          reviews: Object.values(reviews),
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        alert('Failed to submit reviews. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your review form...</p>
        </div>
      </div>
    );
  }

  if (!student || !activePeriod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600">
            {!student ? 'Student not found' : 'No active review period'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50"
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
              <h1 className="text-xl font-display font-bold">SPPG</h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Student Info Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-lg border border-slate-200 p-8 mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">
                Welcome, {student.name}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-red/10 rounded-full">
                  <span className="font-semibold text-brand-red">Matric:</span>
                  <span className="text-slate-700">{student.matric_number}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-blue/10 rounded-full">
                  <span className="font-semibold text-brand-blue">Group:</span>
                  <span className="text-slate-700">#{student.group_id}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-full">
                  <span className="font-semibold text-brand-green">Peers:</span>
                  <span className="text-slate-700">{groupMembers.length}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 rounded-full">
                  <span className="font-semibold text-brand-orange">Period:</span>
                  <span className="text-slate-700">{activePeriod.period_name}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-brand-orange/5 border-l-4 border-brand-orange rounded-2xl p-6 mb-8"
        >
          <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
            Review Your Peers for {activePeriod.period_name}
          </h3>
          <p className="text-slate-600">
            Please rate each group member honestly on the two questions below. Use the slider to select a score from 1 (Poor) to 5 (Excellent) for each question.
          </p>
        </motion.div>

        {/* Questions Reference */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 mb-8"
        >
          <h4 className="font-display font-bold text-slate-900 mb-4">Evaluation Questions</h4>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-red/10 rounded-full flex items-center justify-center font-bold text-brand-red text-sm">
                  {q.question_number}
                </div>
                <p className="text-slate-700 flex-1">{q.question_text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Peer Reviews */}
        <div className="space-y-6">
          {groupMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              {/* Member Header */}
              <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Matric: {member.matric_number}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-blue/70 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Rating Sliders */}
              <div className="p-6 space-y-8">
                {questions.map((question) => {
                  const questionKey = `question${question.question_number}_score` as 'question1_score' | 'question2_score';
                  const currentScore = reviews[member.id]?.[questionKey] || 3;

                  return (
                    <div key={question.id}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded">
                              Q{question.question_number}
                            </span>
                            <p className="text-sm font-medium text-slate-700">
                              {question.question_text}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-brand-orange rounded-2xl flex items-center justify-center">
                            <span className="text-3xl font-display font-bold text-white">
                              {currentScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={currentScore}
                          onChange={(e) =>
                            handleScoreChange(member.id, question.question_number, parseInt(e.target.value))
                          }
                          className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #DA1427 0%, #DA1427 ${
                              ((currentScore - 1) / 4) * 100
                            }%, #e2e8f0 ${((currentScore - 1) / 4) * 100}%, #e2e8f0 100%)`,
                          }}
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>1 - Poor</span>
                          <span>3 - Average</span>
                          <span>5 - Excellent</span>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-sm font-semibold text-brand-red">
                            {getScoreLabel(currentScore)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-brand-red to-brand-orange text-white font-display font-bold text-xl py-6 rounded-2xl hover:shadow-2xl hover:shadow-brand-red/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting Reviews...
              </span>
            ) : (
              `Submit All Reviews for ${activePeriod.period_name}`
            )}
          </button>
        </motion.div>
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
                Reviews Submitted!
              </h3>
              <p className="text-slate-600 mb-6">
                Thank you for your thoughtful feedback for {activePeriod.period_name}. Your reviews have been recorded successfully.
              </p>
              <div className="text-sm text-slate-500">
                Redirecting to home...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid #DA1427;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid #DA1427;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </main>
  );
}