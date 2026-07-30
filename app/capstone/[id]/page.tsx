// FILE: app/capstone/[id]/page.tsx
// Capstone rating page for students - one-time submission with 3 questions + comment

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  name: string;
  matric_number: string;
  phone_number?: string;
  capstone_group_id: number;
  capstone_group_name: string;
}

interface GroupMember {
  id: number;
  name: string;
  matric_number: string;
  capstone_group_id: number;
  capstone_group_name: string;
}

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  max_score: number;
  is_comment: boolean;
}

interface CapstonePeriod {
  id: number;
  period_name: string;
  is_active: boolean;
  is_open: boolean;
}

interface Review {
  reviewed_id: number;
  question1_score: number;
  question2_score: number;
  question3_score: number;
  comment: string;
}

interface SubmittedReview {
  reviewed_id: number;
  reviewed_name: string;
  reviewed_matric: string;
  question1_score: number;
  question2_score: number;
  question3_score: number;
  comment: string;
}

export default function CapstonePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activePeriod, setActivePeriod] = useState<CapstonePeriod | null>(null);
  const [reviews, setReviews] = useState<Record<number, Review>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([]);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const timestamp = Date.now();
      const random = Math.random();
      const cacheHeaders = {
        cache: 'no-store' as RequestCache,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        }
      };

      // 1. Check submission status first
      const statusRes = await fetch(
        `/api/capstone/submissions/status/${params.id}?_t=${timestamp}&_r=${random}`,
        cacheHeaders
      );
      const statusData = await statusRes.json();

      // If period is not open at all
      if (!statusData.period_open) {
        setErrorMessage('Capstone rating is not currently open. Please contact admin.');
        setIsLoading(false);
        return;
      }

      // If already submitted, show locked view
      if (statusData.has_submitted) {
        setHasSubmitted(true);
        setSubmittedReviews(statusData.reviews || []);
        setSubmittedAt(statusData.submitted_at);
      }

      // 2. Fetch student info
      const studentRes = await fetch(
        `/api/capstone/students/${params.id}?_t=${timestamp}&_r=${random}`,
        cacheHeaders
      );
      const studentData = await studentRes.json();

      // Check if student has no capstone group
      if (studentData.error === 'not_assigned') {
        setErrorMessage(studentData.message || 'You are not assigned to any capstone group. Please contact admin.');
        setIsLoading(false);
        return;
      }

      setStudent(studentData);

      // 3. Fetch active capstone period
      const periodRes = await fetch(
        `/api/capstone/periods/active?_t=${timestamp}&_r=${random}`,
        cacheHeaders
      );
      const periodData = await periodRes.json();
      setActivePeriod(periodData);

      // If already submitted, we don't need to load rating form data
      if (statusData.has_submitted) {
        setIsLoading(false);
        return;
      }

      // 4. Fetch capstone group members
      const membersRes = await fetch(
        `/api/capstone/groups/${studentData.capstone_group_id}/members?_t=${timestamp}&_r=${random}`,
        cacheHeaders
      );
      const membersData = await membersRes.json();
      
      // Filter out the current student (they don't rate themselves)
      const otherMembers = membersData.filter((m: GroupMember) => m.id !== studentData.id);
      setGroupMembers(otherMembers);

      // 5. Fetch questions
      const questionsRes = await fetch(
        `/api/capstone/questions?_t=${timestamp}&_r=${random}`,
        cacheHeaders
      );
      const questionsData = await questionsRes.json();
      setQuestions(questionsData);

      // Initialize reviews with default scores of 3
      const initialReviews: Record<number, Review> = {};
      otherMembers.forEach((member: GroupMember) => {
        initialReviews[member.id] = {
          reviewed_id: member.id,
          question1_score: 3,
          question2_score: 3,
          question3_score: 3,
          comment: '',
        };
      });
      setReviews(initialReviews);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading capstone data:', error);
      setErrorMessage('Failed to load data. Please refresh and try again.');
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

  const handleCommentChange = (memberId: number, comment: string) => {
    setReviews((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        comment: comment,
      },
    }));
  };

  const getScoreLabel = (score: number) => {
    const labels: Record<number, string> = {
      1: 'Poor',
      2: 'Below Average',
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    };
    return labels[score] || '';
  };

  const handleSubmit = async () => {
    if (!student || !activePeriod) return;

    // Confirmation because this is one-time
    const confirmed = window.confirm(
      '⚠️ This is a ONE-TIME submission. Once you submit, you cannot edit your capstone ratings.\n\nAre you sure you want to submit?'
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/capstone/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: student.id,
          capstone_period_id: activePeriod.id,
          reviews: Object.values(reviews),
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        // After 3 seconds, reload page to show locked state
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit reviews. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ===================================================================
  // LOADING STATE
  // ===================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your capstone rating form...</p>
        </div>
      </div>
    );
  }

  // ===================================================================
  // ERROR STATE (not in group / period closed)
  // ===================================================================
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">
            Capstone Rating Unavailable
          </h3>
          <p className="text-slate-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-red/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // ===================================================================
  // LOCKED STATE (already submitted)
  // ===================================================================
  if (hasSubmitted) {
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
                <h1 className="text-xl font-display font-bold">SPPG Capstone</h1>
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

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Lock notice */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold text-slate-900">
                  Capstone Ratings Submitted
                </h2>
                <p className="text-slate-600 mt-1">
                  Submitted on {submittedAt ? new Date(submittedAt).toLocaleString() : 'earlier'}
                </p>
              </div>
            </div>

            <div className="bg-brand-blue/5 border-l-4 border-brand-blue rounded-xl p-4 mb-6">
              <p className="text-slate-700">
                <strong>Thank you!</strong> This was a one-time evaluation, so no further changes can be made. Your ratings for each capstone group member are shown below for your records.
              </p>
            </div>
          </motion.div>

          {/* Submitted reviews display */}
          <div className="space-y-4">
            {submittedReviews.map((review, index) => (
              <motion.div
                key={review.reviewed_id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              >
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900">
                      {review.reviewed_name}
                    </h3>
                    <p className="text-sm text-slate-500">{review.reviewed_matric}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue/70 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Q1: Attendance</div>
                    <div className="text-3xl font-display font-bold text-brand-red">{review.question1_score}</div>
                    <div className="text-xs text-slate-600 mt-1">{getScoreLabel(review.question1_score)}</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Q2: Ownership</div>
                    <div className="text-3xl font-display font-bold text-brand-blue">{review.question2_score}</div>
                    <div className="text-xs text-slate-600 mt-1">{getScoreLabel(review.question2_score)}</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Q3: Respect</div>
                    <div className="text-3xl font-display font-bold text-brand-green">{review.question3_score}</div>
                    <div className="text-xs text-slate-600 mt-1">{getScoreLabel(review.question3_score)}</div>
                  </div>
                </div>

                {review.comment && (
                  <div className="bg-amber-50 border-l-4 border-brand-orange rounded-xl p-4 mt-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Your Comment</p>
                    <p className="text-slate-700 italic">"{review.comment}"</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-red/90 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ===================================================================
  // NO STUDENT / NO PERIOD FALLBACK
  // ===================================================================
  if (!student || !activePeriod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600">Unable to load capstone data</p>
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

  // ===================================================================
  // MAIN RATING FORM
  // ===================================================================
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
              <h1 className="text-xl font-display font-bold">SPPG Capstone</h1>
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
        {/* One-Time Warning Banner */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-brand-orange/10 to-brand-red/10 border-l-4 border-brand-orange rounded-2xl p-6 mb-8"
        >
          <div className="flex gap-4">
            <svg className="w-8 h-8 text-brand-orange flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
                One-Time Evaluation
              </h3>
              <p className="text-slate-700">
                This is a <strong>final capstone evaluation</strong>. You can only submit once and cannot edit after submission. Please rate each capstone group member carefully.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Welcome Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-8"
        >
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-6">
            Welcome, {student.name}
          </h2>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-brand-red/10 rounded-xl">
              <span className="text-sm text-slate-600">Matric:</span>
              <span className="ml-2 font-semibold text-brand-red">{student.matric_number}</span>
            </div>
            <div className="px-4 py-2 bg-brand-blue/10 rounded-xl">
              <span className="text-sm text-slate-600">Capstone:</span>
              <span className="ml-2 font-semibold text-brand-blue">{student.capstone_group_name}</span>
            </div>
            <div className="px-4 py-2 bg-brand-green/10 rounded-xl">
              <span className="text-sm text-slate-600">Peers:</span>
              <span className="ml-2 font-semibold text-brand-green">{groupMembers.length}</span>
            </div>
            <div className="px-4 py-2 bg-amber-50 rounded-xl">
              <span className="text-sm text-slate-600">Period:</span>
              <span className="ml-2 font-semibold text-amber-700">{activePeriod.period_name}</span>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-brand-blue/5 border-l-4 border-brand-blue rounded-2xl p-6 mb-8"
        >
          <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
            Rate Your Capstone Group Members
          </h3>
          <p className="text-slate-600">
            Please rate each capstone group member honestly on the three questions below. Use the slider to select a score from 1 (Poor) to 5 (Excellent). You may also add optional comments or observations.
          </p>
        </motion.div>

        {/* Questions Reference */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 mb-8"
        >
          <h4 className="font-display font-bold text-slate-900 mb-4">Evaluation Questions</h4>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  q.is_comment 
                    ? 'bg-brand-orange/10 text-brand-orange' 
                    : 'bg-brand-blue/10 text-brand-blue'
                }`}>
                  {q.question_number}
                </div>
                <div className="flex-1">
                  <p className="text-slate-700">{q.question_text}</p>
                  {q.is_comment && (
                    <p className="text-xs text-slate-500 mt-1 italic">Optional - free text</p>
                  )}
                </div>
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
                    <p className="text-sm text-slate-500">Matric: {member.matric_number}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-blue/70 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Rating Sliders (Q1, Q2, Q3) */}
              <div className="p-6 space-y-8">
                {questions.filter(q => !q.is_comment).map((question) => {
                  const questionKey = `question${question.question_number}_score` as 'question1_score' | 'question2_score' | 'question3_score';
                  const currentScore = reviews[member.id]?.[questionKey] || 3;

                  return (
                    <div key={question.id}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-2 py-1 rounded">
                              Q{question.question_number}
                            </span>
                            <p className="text-sm font-medium text-slate-700">
                              {question.question_text}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-orange rounded-2xl flex items-center justify-center">
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
                            background: `linear-gradient(to right, #109DD9 0%, #109DD9 ${
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
                          <span className="text-sm font-semibold text-brand-blue">
                            {getScoreLabel(currentScore)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Q4: Comment (optional) */}
                {questions.find(q => q.is_comment) && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded">
                        Q4
                      </span>
                      <p className="text-sm font-medium text-slate-700">
                        {questions.find(q => q.is_comment)?.question_text}
                      </p>
                      <span className="text-xs text-slate-500 italic">(optional)</span>
                    </div>
                    <textarea
                      value={reviews[member.id]?.comment || ''}
                      onChange={(e) => handleCommentChange(member.id, e.target.value)}
                      placeholder="Share any observations or comments about this group member (optional)..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-orange focus:outline-none focus:ring-4 focus:ring-brand-orange/10 transition-all resize-none"
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">
                      {(reviews[member.id]?.comment || '').length} / 500
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-brand-blue to-brand-orange text-white font-display font-bold text-xl py-6 rounded-2xl hover:shadow-2xl hover:shadow-brand-blue/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting Capstone Ratings...
              </span>
            ) : (
              `Submit Final Capstone Ratings`
            )}
          </button>
          <p className="text-center text-sm text-slate-500 mt-3">
            ⚠️ This is a one-time submission and cannot be edited.
          </p>
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
                Capstone Ratings Submitted!
              </h3>
              <p className="text-slate-600 mb-6">
                Thank you for completing your capstone evaluation. Your ratings have been permanently recorded.
              </p>
              <div className="text-sm text-slate-500">
                Loading your submission summary...
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
          border: 3px solid #109DD9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid #109DD9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </main>
  );
}