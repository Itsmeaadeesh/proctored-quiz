import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Question, Quiz, Submission } from '../types/quiz';
import { useProctoring } from '../hooks/useProctoring';
import { QuizTimer } from '../components/QuizTimer';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { WatermarkOverlay } from '../components/WatermarkOverlay';
import { FullscreenModal } from '../components/FullscreenModal';
import { BlackoutOverlay } from '../components/BlackoutOverlay';
import { AlertCircle, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface QuizTakingPageProps {
  onExamCompleted: (submissionId: string) => void;
}

export const QuizTakingPage: React.FC<QuizTakingPageProps> = ({ onExamCompleted }) => {
  const { user, activeQuizId, submissionId, setSubmissionId } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState<number | undefined>(undefined);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [lockedSubmissionId, setLockedSubmissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDisqualifiedModalOpen, setIsDisqualifiedModalOpen] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState('');

  const startTimeRef = useRef(Date.now());
  const hasStartedRef = useRef(false);
  const answersRef = useRef<Record<string, string | string[]>>({});
  const submissionIdRef = useRef<string | null>(submissionId);
  const isSubmittingRef = useRef(false);
  const quizRef = useRef<Quiz | null>(null);

  // Synchronize state references
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  // Handle Timeout Auto-submit (stable reference - no re-triggers)
  const handleTimeoutAutoSubmit = useCallback(
    async (forcedSubId?: string) => {
      const targetSubId = forcedSubId || submissionIdRef.current;
      if (!targetSubId || isSubmittingRef.current) return;
      setIsSubmitting(true);
      isSubmittingRef.current = true;

      const currentQuiz = quizRef.current;
      const maxSec = currentQuiz ? (currentQuiz.duration_minutes || 60) * 60 : 3600;

      try {
        await api.submitQuiz(targetSubId, answersRef.current, maxSec, 'auto_submitted');
        try {
          localStorage.removeItem(`rha_answers_${targetSubId}`);
        } catch (e) {}
        onExamCompleted(targetSubId);
      } catch (err) {
        console.error('Timeout auto-submit error:', err);
        onExamCompleted(targetSubId);
      }
    },
    [onExamCompleted]
  );

  // Initialize or resume quiz session ONCE on mount
  useEffect(() => {
    if (!user || !activeQuizId || hasStartedRef.current) return;
    hasStartedRef.current = true;

    let isMounted = true;

    api
      .startQuiz(activeQuizId, user.id, user.name, user.roll_no, user.email, user.phone)
      .then((data) => {
        if (!isMounted) return;
        setQuiz(data.quiz);
        quizRef.current = data.quiz;
        setQuestions(data.questions);
        setSubmissionId(data.submission.id);
        submissionIdRef.current = data.submission.id;

        // Restore any existing answers from local draft or server
        let initialAnswers: Record<string, string | string[]> = {};
        try {
          const cached = localStorage.getItem(`rha_answers_${data.submission.id}`);
          if (cached) {
            initialAnswers = JSON.parse(cached);
          }
        } catch (e) {}

        if (data.submission.answers && Object.keys(data.submission.answers).length > 0) {
          initialAnswers = { ...initialAnswers, ...data.submission.answers };
        }

        if (Object.keys(initialAnswers).length > 0) {
          setAnswers(initialAnswers);
          answersRef.current = initialAnswers;
        }

        // Calculate continuous remaining time from session start
        const elapsed = Math.floor(
          (Date.now() - new Date(data.submission.created_at).getTime()) / 1000
        );
        const rem = Math.max(0, (data.quiz.duration_minutes || 60) * 60 - elapsed);
        setRemainingSeconds(rem);

        if (rem <= 0) {
          handleTimeoutAutoSubmit(data.submission.id);
        }

        setIsLoading(false);
      })
      .catch((err: any) => {
        console.error('Failed to start quiz session:', err);
        if (err.data?.locked) {
          setLockedMessage(
            err.message || 'You have already attempted or completed this examination.'
          );
          if (err.data?.submission?.id) {
            setLockedSubmissionId(err.data.submission.id);
          }
        }
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, activeQuizId, setSubmissionId, handleTimeoutAutoSubmit]);

  // Handle Disqualification triggered by violation threshold
  const handleDisqualify = useCallback(
    async (reason: string) => {
      setDisqualificationReason(reason);
      setIsDisqualifiedModalOpen(true);
      const targetSubId = submissionIdRef.current;
      if (targetSubId) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
          await api.submitQuiz(targetSubId, answersRef.current, timeSpent, 'disqualified' as any);
          try {
            localStorage.removeItem(`rha_answers_${targetSubId}`);
          } catch (e) {}
        } catch (e) {
          console.error('Auto-submit under disqualification failed:', e);
        }
      }
    },
    []
  );

  // Proctoring Hook
  const {
    violationsCount,
    showFullscreenModal,
    showBlackoutAlert,
    blackoutReason,
    recentWarning,
    requestFullscreen,
  } = useProctoring({
    submissionId,
    userId: user?.id || null,
    maxViolations: quiz?.max_violations || 3,
    isActive: !isLoading && !isDisqualifiedModalOpen,
    onDisqualify: handleDisqualify,
  });

  // Force fullscreen on first render once loaded
  useEffect(() => {
    if (!isLoading && !showFullscreenModal) {
      requestFullscreen();
    }
  }, [isLoading, requestFullscreen, showFullscreenModal]);

  // Handle Answer Selection - saves to state, localStorage, and server draft
  const handleSelectAnswer = (answer: string | string[]) => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [qId]: answer,
      };
      answersRef.current = next;

      // Save to localStorage immediately
      const subId = submissionIdRef.current;
      if (subId) {
        try {
          localStorage.setItem(`rha_answers_${subId}`, JSON.stringify(next));
        } catch (e) {}

        // Fire-and-forget sync to backend
        api.saveDraftProgress(subId, next).catch(() => {});
      }

      return next;
    });
  };

  // Toggle Flag for current question
  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  // Submit Final Answers
  const handleSubmitExam = async () => {
    const targetSubId = submissionIdRef.current;
    if (!targetSubId || isSubmittingRef.current) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      await api.submitQuiz(targetSubId, answersRef.current, timeSpent);
      try {
        localStorage.removeItem(`rha_answers_${targetSubId}`);
      } catch (e) {}
      onExamCompleted(targetSubId);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      alert('Network error submitting your exam. Please notify proctor immediately.');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (lockedMessage) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-redhat-gray-light">
        <div className="max-w-md w-full bg-white border-2 border-redhat-black rounded-sm p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-redhat-black font-display uppercase tracking-tight mb-2">
            Examination Attempt Locked
          </h2>
          <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
            {lockedMessage}
          </p>
          {lockedSubmissionId ? (
            <button
              onClick={() => onExamCompleted(lockedSubmissionId)}
              className="w-full py-3 px-4 bg-redhat-red hover:bg-redhat-red-dark text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              View Incident Certificate &amp; Result
            </button>
          ) : (
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-3 px-4 bg-redhat-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              Return to Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading || !quiz || questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-redhat-gray-light">
        <div className="w-12 h-12 border-4 border-redhat-red border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold text-redhat-black font-display uppercase tracking-wider">
          Initializing Secure Proctoring Sandbox...
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Locking browser listeners &bull; Generating student watermark
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const questionIds = questions.map((q) => q.id);

  return (
    <div className="flex-1 flex flex-col bg-redhat-gray-light relative select-none">
      
      {/* 1. Dynamic Security Watermark across question screen */}
      {user && (
        <WatermarkOverlay
          studentName={user.name}
          studentRollNo={user.roll_no}
        />
      )}

      {/* 2. PrintScreen Blackout Alert Overlay */}
      <BlackoutOverlay
        isVisible={showBlackoutAlert}
        message={blackoutReason}
        violationsCount={violationsCount}
      />

      {/* 3. Fullscreen Exit Warning Modal */}
      <FullscreenModal
        isOpen={showFullscreenModal && !isDisqualifiedModalOpen}
        onReturnToFullscreen={requestFullscreen}
        violationsCount={violationsCount}
        maxViolations={quiz.max_violations}
      />

      {/* 4. Disqualified Overlay Modal */}
      {isDisqualifiedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white border-4 border-redhat-red max-w-lg w-full p-8 rounded-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-redhat-red rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-redhat-red font-display uppercase tracking-tight mb-2">
              EXAMINATION DISQUALIFIED
            </h2>
            <p className="text-sm text-neutral-800 mb-6 leading-relaxed">
              {disqualificationReason ||
                'The system has detected repeated anti-cheating violations exceeding the maximum permissible threshold.'}
            </p>
            <div className="bg-redhat-gray-light p-4 rounded-xs border border-redhat-gray-border text-xs text-left space-y-1 mb-6">
              <div><strong>Candidate:</strong> {user?.name} ({user?.roll_no})</div>
              <div><strong>Total Incidents:</strong> {violationsCount} logged</div>
              <div><strong>Status:</strong> Disqualified &amp; Marked for Review</div>
            </div>
            <button
              onClick={() => onExamCompleted(submissionId!)}
              className="w-full py-3 px-4 bg-redhat-red hover:bg-redhat-red-dark text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              View Incident Certificate &amp; Exit
            </button>
          </div>
        </div>
      )}

      {/* 5. Sticky Top Red Progress Bar / Timer */}
      <QuizTimer
        durationMinutes={quiz.duration_minutes || 60}
        initialSecondsRemaining={remainingSeconds}
        onTimeExpired={handleTimeoutAutoSubmit}
        isPaused={showFullscreenModal || isDisqualifiedModalOpen}
      />

      {/* 6. Transient Security Warning Toast */}
      {recentWarning && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 bg-redhat-black border border-redhat-red text-white text-xs px-4 py-2.5 rounded-sm shadow-xl flex items-center space-x-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-redhat-red shrink-0" />
          <span className="font-semibold">{recentWarning}</span>
        </div>
      )}

      {/* 7. Main Exam Work Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Question Column (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestion.id]}
              onSelectAnswer={handleSelectAnswer}
              isFlagged={flaggedQuestions.has(currentIndex)}
              onToggleFlag={handleToggleFlag}
              allowBacktracking={quiz.allow_backtracking}
            />

            {/* Quick Pagination footer below question */}
            <div className="flex justify-between items-center bg-white p-4 border border-redhat-gray-border rounded-sm">
              <button
                type="button"
                disabled={currentIndex === 0 || !quiz.allow_backtracking}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-redhat-black border border-redhat-gray-border rounded-sm hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous Question
              </button>

              <span className="text-xs font-mono font-bold text-neutral-500">
                Question {currentIndex + 1} of {questions.length}
              </span>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-redhat-black hover:bg-neutral-800 rounded-sm cursor-pointer"
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-redhat-red hover:bg-redhat-red-dark rounded-sm cursor-pointer"
                >
                  Review &amp; Finish
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Question Navigator & Summary (1 col) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <QuestionNavigator
                totalQuestions={questions.length}
                currentIndex={currentIndex}
                onSelectIndex={(idx) => setCurrentIndex(idx)}
                answers={answers}
                questionIds={questionIds}
                flaggedQuestions={flaggedQuestions}
                allowBacktracking={quiz.allow_backtracking}
                onNext={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                onSubmit={() => setShowConfirmModal(true)}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>

        </div>
      </div>

      {/* 8. Final Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-redhat-red rounded-sm max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-redhat-red" />
              <h3 className="text-lg font-black text-redhat-black font-display uppercase tracking-tight">
                Submit Examination?
              </h3>
            </div>

            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              You are about to complete your session for <strong>{quiz.title}</strong>. Once submitted, answers cannot be edited.
            </p>

            <div className="bg-redhat-gray-light p-3.5 rounded-xs border border-redhat-gray-border mb-6 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Total Answered:</span>
                <strong className="text-redhat-black">
                  {Object.keys(answers).length} of {questions.length}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Questions Flagged:</span>
                <strong className="text-amber-600">{flaggedQuestions.size}</strong>
              </div>
              <div className="flex justify-between">
                <span>Integrity Strikes Logged:</span>
                <strong className="text-redhat-red">{violationsCount}</strong>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-redhat-gray-border rounded-sm text-xs font-bold text-redhat-black hover:bg-neutral-50 cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitExam}
                className="flex-1 py-2.5 bg-redhat-red hover:bg-redhat-red-dark text-white rounded-sm text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
