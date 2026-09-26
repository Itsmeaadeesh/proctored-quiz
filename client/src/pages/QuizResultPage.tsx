import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Submission } from '../types/quiz';
import {
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Calendar,
  FileCheck,
  Info,
  Lock,
  Hourglass,
  Award,
  Sparkles,
} from 'lucide-react';

interface QuizResultPageProps {
  submissionId: string;
  onRetakeOrHome: () => void;
}

// Format timestamp to India Standard Time (IST) Date & Time
const formatDateTimeIST = (isoString?: string): string => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

export const QuizResultPage: React.FC<QuizResultPageProps> = ({
  submissionId,
  onRetakeOrHome,
}) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getSubmission(submissionId)
      .then((data) => {
        setSubmission(data.submission);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load submission receipt:', err);
        setIsLoading(false);
      });
  }, [submissionId]);

  if (isLoading || !submission) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-redhat-gray-light min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-redhat-red border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-redhat-black font-display uppercase tracking-wider">
          Securing Submission Receipt...
        </p>
      </div>
    );
  }

  const isDisqualified = submission.disqualified;
  const minutesSpent = Math.floor((submission.time_taken_seconds || 0) / 60);
  const secondsSpent = (submission.time_taken_seconds || 0) % 60;

  return (
    <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full animate-in fade-in-50 duration-200">
      
      {/* Official Acknowledgment Card */}
      <div className="bg-white border-2 border-redhat-black rounded-sm shadow-xl overflow-hidden mb-8">
        
        {/* Certificate Header with Red Hat Red Rule */}
        <div className="bg-redhat-black text-white p-6 sm:p-8 border-b-4 border-b-redhat-red">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-widest text-redhat-red uppercase font-black bg-red-950/70 border border-red-800/80 px-2 py-0.5 rounded-xs">
                  EXAMINATION ACKNOWLEDGMENT &bull; RHA DAY 26
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight mt-1.5 text-white">
                Submission Recorded Successfully
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Gyan Ganga Institute of Technology &amp; Sciences &bull; Department of Computer Science
              </p>
            </div>

            {/* Status Badge */}
            <div className="self-start sm:self-center shrink-0">
              {isDisqualified ? (
                <div className="bg-red-950 border border-redhat-red text-redhat-red px-3.5 py-1.5 rounded-xs font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Disqualified</span>
                </div>
              ) : submission.status === 'auto_submitted' ? (
                <div className="bg-orange-950 border border-orange-500 text-orange-400 px-3.5 py-1.5 rounded-xs font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Auto-submitted (Timer Expired)</span>
                </div>
              ) : submission.status === 'incomplete' ? (
                <div className="bg-amber-950 border border-amber-500 text-amber-400 px-3.5 py-1.5 rounded-xs font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Incomplete Session</span>
                </div>
              ) : (
                <div className="bg-emerald-950 border border-emerald-500 text-emerald-400 px-3.5 py-1.5 rounded-xs font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Successfully Submitted</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Banner */}
        <div className="p-6 sm:p-8 border-b border-redhat-gray-border bg-neutral-50/50">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 shadow-2xs">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-display text-redhat-black uppercase tracking-tight">
                Exam Responses Encrypted &amp; Received
              </h2>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Thank you, <strong>{submission.student_name}</strong>. Your examination answers for{' '}
                <strong>RHA DAY 26</strong> have been locked and submitted to the institutional evaluation server.
                Your proctoring telemetry and submission timestamp have been permanently logged.
              </p>
            </div>
          </div>
        </div>

        {/* Results Declaration Timeline Announcement Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-redhat-black to-neutral-950 text-white border-b-4 border-b-redhat-red">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-red-950/90 border-2 border-redhat-red text-redhat-red flex items-center justify-center shrink-0 shadow-lg mt-0.5">
              <Hourglass className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center space-x-1.5 bg-red-950/80 text-red-300 text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-red-800/80 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-redhat-red animate-ping" />
                  <span>Evaluation Window Active</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  RHA DAY 26 &bull; Official Timeline
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight leading-snug">
                Results Will Be Declared Once The Quiz Period Is Concluded
              </h2>
              
              <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
                The examination session is actively underway across all candidate batches. To maintain strict competitive secrecy and academic integrity, individual scores, detailed answer keys, and merit rankings will be published by the <strong>Red Hat Academy &amp; GGITS Examination Coordinators</strong> immediately after the overall quiz period concludes.
              </p>

              {/* 3 Step Visual Milestone Tracker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-neutral-800 text-xs">
                <div className="bg-neutral-900/90 border border-neutral-800 p-3.5 rounded-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="uppercase text-[10px] tracking-wider">Step 1: Completed</span>
                    </div>
                    <div className="font-bold text-white text-xs">Your Exam Submitted</div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-normal">
                      60 questions &amp; telemetry timestamped
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-amber-600/60 p-3.5 rounded-xs relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500/80 animate-pulse" />
                  <div>
                    <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" />
                      <span className="uppercase text-[10px] tracking-wider">Step 2: In Progress</span>
                    </div>
                    <div className="font-bold text-white text-xs">Quiz Period Underway</div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-normal">
                      Awaiting completion of all examinees
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 p-3.5 rounded-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-red-400 font-bold mb-1.5">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span className="uppercase text-[10px] tracking-wider">Step 3: Upcoming</span>
                    </div>
                    <div className="font-bold text-white text-xs">Final Results &amp; Merit List</div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-normal">
                      Declared as soon as quiz period is done
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Candidate & Session Details Receipt */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-redhat-black" />
              <span>Official Candidate Receipt</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-redhat-gray-border rounded-sm p-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  Candidate Name
                </span>
                <span className="text-sm font-black text-redhat-black uppercase">
                  {submission.student_name}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  University Roll Number
                </span>
                <span className="text-sm font-black text-redhat-red">
                  {submission.student_roll_no}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  Institutional Email
                </span>
                <span className="text-neutral-800">
                  {submission.student_email || '--'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  Contact Phone
                </span>
                <span className="text-neutral-800">
                  {submission.student_phone || '--'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  Exam Start Time
                </span>
                <span className="text-neutral-800 font-bold flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  <span>{formatDateTimeIST(submission.created_at)}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  Exam Submit Time
                </span>
                <span className="text-neutral-800 font-bold flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>{formatDateTimeIST(submission.submitted_at || submission.created_at)}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  Total Duration
                </span>
                <span className="text-neutral-900 font-bold">
                  {minutesSpent}m {secondsSpent}s (Allocated: 60 mins)
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">
                  Submission ID
                </span>
                <span className="text-neutral-500 text-[11px] truncate block" title={submission.id}>
                  {submission.id}
                </span>
              </div>
            </div>
          </div>

          {/* Results Confidentiality & Timeline Notice */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-sm flex items-start space-x-3 text-xs">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-amber-950 flex-1">
              <div className="font-bold uppercase tracking-wider text-[11px] text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-800" />
                  <span>Official Results Declaration Notice</span>
                </div>
                <span className="font-mono text-[10px] text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-xs font-bold uppercase">
                  Coming Post-Exam Period
                </span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-900/90">
                To guarantee fairness and integrity for all examinees, individual scores and answer sheets are kept strictly confidential during test administration.
                <strong> Official scorecards, merit ranks, and prize winners will be declared once the entire quiz period has ended.</strong>
              </p>
              <p className="text-[11px] text-amber-900 font-semibold pt-0.5">
                Keep your Roll Number (<strong>{submission.student_roll_no}</strong>) handy to look up your position on the official leaderboard. You may now safely close this window.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onRetakeOrHome}
              className="py-3 px-8 bg-redhat-black hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-sm flex items-center space-x-2 transition-colors cursor-pointer shadow-xs"
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
