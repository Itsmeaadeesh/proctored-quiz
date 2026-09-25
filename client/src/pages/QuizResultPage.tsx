import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Submission, Violation } from '../types/quiz';
import {
  Award,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface QuizResultPageProps {
  submissionId: string;
  onRetakeOrHome: () => void;
}

export const QuizResultPage: React.FC<QuizResultPageProps> = ({
  submissionId,
  onRetakeOrHome,
}) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getSubmission(submissionId)
      .then((data) => {
        setSubmission(data.submission);
        setViolations(data.violations);
        setIsLoading(false);

        // Fire celebratory confetti if student passed and wasn't disqualified
        if (!data.submission.disqualified && data.submission.score > 0) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#EE0000', '#151515', '#FFFFFF', '#6A6E73'],
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load submission results:', err);
        setIsLoading(false);
      });
  }, [submissionId]);

  if (isLoading || !submission) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-redhat-gray-light">
        <div className="w-10 h-10 border-4 border-redhat-red border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-redhat-black font-display uppercase tracking-wider">
          Compiling Verification Scorecard...
        </p>
      </div>
    );
  }

  const percentage =
    submission.total_marks > 0
      ? Math.round((submission.score / submission.total_marks) * 100)
      : 0;

  const isDisqualified = submission.disqualified;
  const minutesSpent = Math.floor((submission.time_taken_seconds || 0) / 60);
  const secondsSpent = (submission.time_taken_seconds || 0) % 60;

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
      
      {/* Official Certificate Card */}
      <div className="bg-white border-2 border-[#151515] rounded-sm shadow-xl overflow-hidden mb-8">
        
        {/* Certificate Header with Red Hat Red Rule */}
        <div className="bg-redhat-black text-white p-6 sm:p-8 border-b-4 border-b-redhat-red">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-redhat-red uppercase font-black">
                EXAMINATION SCORECARD &bull; RHA DAY 26
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight mt-1 text-white">
                Red Hat Academy Challenge Results
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Gyan Ganga Institute of Technology & Sciences &bull; Department of Computer Science
              </p>
            </div>

            {/* Status Badge */}
            <div className="self-start sm:self-center">
              {isDisqualified ? (
                <div className="bg-red-950 border border-redhat-red text-redhat-red px-3.5 py-1.5 rounded-xs font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Disqualified</span>
                </div>
              ) : (
                <div className="bg-emerald-950 border border-emerald-500 text-emerald-400 px-3.5 py-1.5 rounded-xs font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Profile Bar */}
        <div className="bg-redhat-gray-light px-6 sm:px-8 py-3.5 border-b border-redhat-gray-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="text-neutral-500">Candidate:</span>{' '}
            <strong className="text-redhat-black font-bold uppercase">{submission.student_name}</strong>
          </div>
          <div>
            <span className="text-neutral-500">Roll No:</span>{' '}
            <strong className="text-redhat-red font-bold">{submission.student_roll_no}</strong>
          </div>
          <div>
            <span className="text-neutral-500">Submission ID:</span>{' '}
            <span className="text-neutral-700">{submission.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Score & Integrity Metrics Grid */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Score Metric */}
            <div className="p-5 border border-redhat-gray-border rounded-sm text-center bg-white shadow-xs">
              <div className="w-10 h-10 bg-redhat-red/10 text-redhat-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase font-bold text-redhat-gray-text">Overall Score</div>
              <div className="text-3xl font-black font-mono text-redhat-black my-1">
                {submission.score} <span className="text-lg text-neutral-400">/ {submission.total_marks}</span>
              </div>
              <div className="text-xs font-bold text-redhat-red font-mono">
                {percentage}% Accuracy
              </div>
            </div>

            {/* Time Taken */}
            <div className="p-5 border border-redhat-gray-border rounded-sm text-center bg-white shadow-xs">
              <div className="w-10 h-10 bg-neutral-100 text-neutral-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase font-bold text-redhat-gray-text">Time Elapsed</div>
              <div className="text-3xl font-black font-mono text-redhat-black my-1">
                {String(minutesSpent).padStart(2, '0')}:{String(secondsSpent).padStart(2, '0')}
              </div>
              <div className="text-xs text-neutral-500">
                Session duration
              </div>
            </div>

            {/* Anti-Cheating Integrity Score */}
            <div className="p-5 border border-redhat-gray-border rounded-sm text-center bg-white shadow-xs">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  submission.violations_count === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-redhat-red'
                }`}
              >
                {submission.violations_count === 0 ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="text-xs uppercase font-bold text-redhat-gray-text">Integrity Strikes</div>
              <div
                className={`text-3xl font-black font-mono my-1 ${
                  submission.violations_count === 0
                    ? 'text-green-700'
                    : 'text-redhat-red'
                }`}
              >
                {submission.violations_count}
              </div>
              <div className="text-xs text-neutral-500">
                {submission.violations_count === 0
                  ? 'Clean Proctor Record'
                  : 'Incidents Flagged'}
              </div>
            </div>

          </div>

          {/* Violations Log Detail (if any) */}
          {violations.length > 0 && (
            <div className="mb-8 p-4 bg-red-50/50 border border-redhat-red/30 rounded-xs">
              <h4 className="text-xs font-bold text-redhat-red uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Recorded Anti-Cheating Incidents</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                {violations.map((v, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1 border-b border-redhat-red/10 text-neutral-700 font-mono text-[11px]"
                  >
                    <span>{v.type}</span>
                    <span className="text-neutral-500">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={onRetakeOrHome}
              className="py-3 px-6 bg-redhat-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-sm flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return to Portal Home</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
