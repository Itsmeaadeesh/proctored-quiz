import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Submission,
  AdminMetrics,
  Violation,
  ProctorSnapshot,
  Question,
  Quiz,
} from '../types/quiz';
import {
  ShieldAlert,
  Users,
  Award,
  CheckCircle,
  Download,
  Eye,
  Sliders,
  X,
  Camera,
  Search,
  Filter,
  Trophy,
  Medal,
  Clock,
  ShieldCheck,
  RefreshCw,
  Crown,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
} from 'lucide-react';

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

// Format timestamp to India Standard Time (IST) Time only (HH:MM:SS AM/PM)
const formatTimeOnlyIST = (isoString?: string): string => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

export const AdminDashboardPage: React.FC = () => {
  const [adminTab, setAdminTab] = useState<'leaderboard' | 'audit'>('leaderboard');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<(Submission & { rank: number })[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Leaderboard filters
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'top10' | 'clean' | 'disqualified'>('all');

  // Telemetry Audit filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'auto_submitted' | 'incomplete' | 'disqualified'>('all');

  // Selected student audit & quiz report modal
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'report' | 'timeline' | 'snapshots'>('report');
  const [reportQuestionFilter, setReportQuestionFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [auditDetails, setAuditDetails] = useState<{
    submission: Submission;
    violations: Violation[];
    snapshots: ProctorSnapshot[];
    questions: Question[];
  } | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Quiz config modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [durationInput, setDurationInput] = useState(60);
  const [maxViolationsInput, setMaxViolationsInput] = useState(3);
  const [shuffleInput, setShuffleInput] = useState(true);
  const [backtrackInput, setBacktrackInput] = useState(true);

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [m, subs, qData, board] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminSubmissions(),
        api.getActiveQuiz(),
        api.getAdminLeaderboard().catch((err) => {
          console.error('Failed to load leaderboard:', err);
          return [];
        }),
      ]);
      setMetrics(m);
      setSubmissions(subs);
      setLeaderboard(board);
      setActiveQuiz(qData.quiz);
      setDurationInput(qData.quiz.duration_minutes);
      setMaxViolationsInput(qData.quiz.max_violations);
      setShuffleInput(qData.quiz.shuffle_questions);
      setBacktrackInput(qData.quiz.allow_backtracking);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAudit = async (subId: string, initialTab: 'report' | 'timeline' = 'report') => {
    setSelectedSubId(subId);
    setModalTab(initialTab);
    setReportQuestionFilter('all');
    setAuditLoading(true);
    try {
      const details = await api.getSubmissionDetails(subId);
      setAuditDetails(details);
    } catch (err) {
      console.error('Failed to load audit details:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz) return;
    try {
      await api.updateQuizSettings(activeQuiz.id, {
        duration_minutes: durationInput,
        max_violations: maxViolationsInput,
        shuffle_questions: shuffleInput,
        allow_backtracking: backtrackInput,
      });
      setIsConfigOpen(false);
      loadData(true);
      alert('Quiz settings updated successfully.');
    } catch (err) {
      console.error('Failed to update config:', err);
      alert('Could not update quiz settings.');
    }
  };

  // Filtered Leaderboard candidates
  const filteredLeaderboard = leaderboard.filter((item) => {
    const term = leaderboardSearch.toLowerCase().trim();
    const matchSearch =
      !term ||
      item.student_name.toLowerCase().includes(term) ||
      item.student_roll_no.toLowerCase().includes(term) ||
      (item.student_email && item.student_email.toLowerCase().includes(term)) ||
      (item.student_phone && item.student_phone.toLowerCase().includes(term));

    if (!matchSearch) return false;

    if (leaderboardFilter === 'top10') return item.rank <= 10;
    if (leaderboardFilter === 'clean') return (item.violations_count || 0) === 0 && !item.disqualified;
    if (leaderboardFilter === 'disqualified') return item.disqualified;
    return true;
  });

  // Top 3 Podium Candidates
  const eligibleForPodium = leaderboard.filter((s) => !s.disqualified);
  const top1 = eligibleForPodium[0] || null;
  const top2 = eligibleForPodium[1] || null;
  const top3 = eligibleForPodium[2] || null;

  // Filtered Telemetry Submissions
  const filteredSubmissions = submissions.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      s.student_name.toLowerCase().includes(term) ||
      s.student_roll_no.toLowerCase().includes(term);

    const matchFilter =
      statusFilter === 'all'
        ? true
        : statusFilter === 'disqualified'
        ? s.disqualified
        : statusFilter === 'submitted'
        ? s.status === 'submitted' && !s.disqualified
        : statusFilter === 'auto_submitted'
        ? s.status === 'auto_submitted'
        : statusFilter === 'incomplete'
        ? s.status === 'incomplete'
        : true;

    return matchSearch && matchFilter;
  });

  const cleanRecordsCount = leaderboard.filter(
    (s) => (s.violations_count || 0) === 0 && !s.disqualified
  ).length;

  // Question-by-question analysis for candidate report
  let analyzedQuestions: Array<{
    question: Question;
    index: number;
    studentAns: any;
    isUnanswered: boolean;
    isCorrect: boolean;
  }> = [];

  let reportStats = {
    total: 0,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    score: 0,
    totalMarks: 60,
  };

  if (auditDetails && auditDetails.questions) {
    const answers = auditDetails.submission.answers || {};
    reportStats.total = auditDetails.questions.length;
    reportStats.score = auditDetails.submission.score;
    reportStats.totalMarks = auditDetails.submission.total_marks || 60;

    analyzedQuestions = auditDetails.questions.map((q, idx) => {
      const studentAns = answers[q.id];
      const isUnanswered = studentAns === undefined || studentAns === null || studentAns === '';
      let isCorrect = false;

      if (!isUnanswered) {
        if (q.type === 'short_answer') {
          isCorrect =
            String(q.correct_answer || '').trim().toLowerCase() ===
            String(studentAns || '').trim().toLowerCase();
        } else if (q.type === 'mcq_multiple') {
          const expected = Array.isArray(q.correct_answer)
            ? [...q.correct_answer].sort()
            : [q.correct_answer];
          const given = Array.isArray(studentAns)
            ? [...studentAns].sort()
            : [studentAns];
          isCorrect = JSON.stringify(expected) === JSON.stringify(given);
        } else {
          // mcq_single
          isCorrect = String(q.correct_answer || '').trim() === String(studentAns || '').trim();
        }
      }

      if (isUnanswered) {
        reportStats.unanswered++;
      } else if (isCorrect) {
        reportStats.correct++;
        reportStats.attempted++;
      } else {
        reportStats.incorrect++;
        reportStats.attempted++;
      }

      return {
        question: q,
        index: idx + 1,
        studentAns,
        isUnanswered,
        isCorrect,
      };
    });
  }

  const filteredQuestions = analyzedQuestions.filter((item) => {
    if (reportQuestionFilter === 'correct') return item.isCorrect;
    if (reportQuestionFilter === 'incorrect') return !item.isUnanswered && !item.isCorrect;
    if (reportQuestionFilter === 'unanswered') return item.isUnanswered;
    return true;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-redhat-gray-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono tracking-widest text-redhat-red uppercase font-black bg-red-50 border border-red-200 px-2 py-0.5 rounded-xs">
              OFFICIAL COORDINATOR CONSOLE
            </span>
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
              • CONFIDENTIAL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-redhat-black tracking-tight mt-1.5">
            RHA DAY 26 Examination Command Center
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Gyan Ganga Institute of Technology &amp; Sciences &bull; Real-time Proctored Leaderboard, Quiz Reports &amp; Audit Logs
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="py-2.5 px-3.5 bg-white border border-redhat-gray-border hover:bg-neutral-50 text-redhat-black text-xs font-bold uppercase rounded-sm flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Refresh latest candidate submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-neutral-600 ${isRefreshing ? 'animate-spin text-redhat-red' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsConfigOpen(true)}
            className="py-2.5 px-3.5 bg-white border border-redhat-gray-border hover:bg-neutral-50 text-redhat-black text-xs font-bold uppercase rounded-sm flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-600" />
            <span>Settings</span>
          </button>

          {adminTab === 'leaderboard' ? (
            <a
              href={api.getExportLeaderboardCsvUrl()}
              download
              className="py-2.5 px-4 bg-redhat-red hover:bg-redhat-red-dark text-white text-xs font-black uppercase tracking-wider rounded-sm flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Leaderboard CSV</span>
            </a>
          ) : (
            <a
              href={api.getExportCsvUrl()}
              download
              className="py-2.5 px-4 bg-redhat-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-sm flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Telemetry CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Dual-Tab Navigation Switcher */}
      <div className="flex border-b-2 border-redhat-gray-border mb-8 gap-1 sm:gap-2">
        <button
          onClick={() => setAdminTab('leaderboard')}
          className={`pb-3.5 px-4 sm:px-6 font-black uppercase text-xs sm:text-sm tracking-wider flex items-center space-x-2 border-b-4 -mb-[2px] transition-all cursor-pointer ${
            adminTab === 'leaderboard'
              ? 'border-redhat-red text-redhat-red bg-red-50/50'
              : 'border-transparent text-neutral-600 hover:text-redhat-black hover:bg-neutral-50'
          }`}
        >
          <Trophy className={`w-4 h-4 ${adminTab === 'leaderboard' ? 'text-redhat-red' : 'text-neutral-500'}`} />
          <span>Live Leaderboard</span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
            adminTab === 'leaderboard' ? 'bg-redhat-red text-white' : 'bg-neutral-200 text-neutral-700'
          }`}>
            {leaderboard.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`pb-3.5 px-4 sm:px-6 font-black uppercase text-xs sm:text-sm tracking-wider flex items-center space-x-2 border-b-4 -mb-[2px] transition-all cursor-pointer ${
            adminTab === 'audit'
              ? 'border-redhat-red text-redhat-red bg-red-50/50'
              : 'border-transparent text-neutral-600 hover:text-redhat-black hover:bg-neutral-50'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${adminTab === 'audit' ? 'text-redhat-red' : 'text-neutral-500'}`} />
          <span>Candidate Telemetry &amp; Audit</span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
            adminTab === 'audit' ? 'bg-redhat-red text-white' : 'bg-neutral-200 text-neutral-700'
          }`}>
            {submissions.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OFFICIAL LEADERBOARD VIEW                         */}
      {/* ======================================================== */}
      {adminTab === 'leaderboard' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-redhat-black text-white p-4 sm:p-5 rounded-sm border-l-4 border-l-redhat-red shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase">
                <span>Ranked Candidates</span>
                <Trophy className="w-4 h-4 text-redhat-red" />
              </div>
              <div className="text-3xl font-black font-mono mt-2">{leaderboard.length}</div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Completed &amp; evaluated submissions
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-sm border border-redhat-gray-border shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase">
                <span>Highest Score Achieved</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black font-mono text-redhat-black mt-2">
                {top1 ? top1.score : 0} <span className="text-sm text-neutral-400">/ 60 marks</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                {top1 ? `${((top1.score / (top1.total_marks || 60)) * 100).toFixed(1)}% Accuracy by ${top1.student_name.split(' ')[0]}` : 'Awaiting first completion'}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-sm border border-redhat-gray-border shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase">
                <span>Clean Integrity Submissions</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black font-mono text-emerald-600 mt-2">
                {cleanRecordsCount}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Zero security strikes or tab switches recorded
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-sm border border-redhat-gray-border shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase">
                <span>Fastest Completion</span>
                <Clock className="w-4 h-4 text-neutral-600" />
              </div>
              <div className="text-3xl font-black font-mono text-redhat-black mt-2">
                {top1
                  ? `${Math.floor((top1.time_taken_seconds || 0) / 60)}m ${(top1.time_taken_seconds || 0) % 60}s`
                  : '--'}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Allocated exam window: 60 minutes
              </div>
            </div>
          </div>

          {/* TOP 3 PODIUM SPOTLIGHT CARDS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black font-display uppercase tracking-tight text-redhat-black">
                  Top 3 Honor Podium
                </h2>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                Tie-breaker: Score &gt; Speed &gt; Integrity
              </span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="bg-white border border-dashed border-redhat-gray-border rounded-sm p-8 text-center">
                <Trophy className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-neutral-700">Awaiting Student Submissions</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Once candidates submit their test, the podium and rankings will update instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 2nd Place: Silver Runner-Up */}
                <div className="order-2 md:order-1 bg-linear-to-b from-slate-50 to-white border-2 border-slate-300 rounded-sm p-5 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute -top-3 right-4 bg-slate-200 border border-slate-400 text-slate-800 text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full shadow-2xs flex items-center space-x-1">
                    <Medal className="w-3 h-3 text-slate-600" />
                    <span>2nd Place</span>
                  </div>

                  {top2 ? (
                    <>
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 text-slate-800 font-mono font-black text-sm flex items-center justify-center">
                            #2
                          </div>
                          <div>
                            <div className="font-black text-redhat-black text-sm leading-snug">
                              {top2.student_name}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500">
                              {top2.student_roll_no}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xs border border-slate-200 mb-3 space-y-1.5">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[11px] uppercase font-bold text-neutral-500">Score:</span>
                            <span className="text-xl font-black font-mono text-redhat-black">
                              {top2.score} <span className="text-xs text-neutral-400">/ 60</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Accuracy:</span>
                            <span className="font-mono font-bold text-neutral-800">
                              {((top2.score / (top2.total_marks || 60)) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Time Taken:</span>
                            <span className="font-mono font-bold text-neutral-800">
                              {Math.floor((top2.time_taken_seconds || 0) / 60)}m {(top2.time_taken_seconds || 0) % 60}s
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Started:</span>
                            <span className="font-mono font-bold text-neutral-700">
                              {formatTimeOnlyIST(top2.created_at)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Submitted:</span>
                            <span className="font-mono font-bold text-neutral-700">
                              {formatTimeOnlyIST(top2.submitted_at || top2.created_at)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-neutral-500">Integrity:</span>
                            <span className={`font-mono font-bold ${top2.violations_count > 0 ? 'text-redhat-red' : 'text-emerald-700'}`}>
                              {top2.violations_count > 0 ? `${top2.violations_count} violation(s)` : 'Clean Record'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAudit(top2.id, 'report')}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <FileText className="w-3 h-3 text-slate-600" />
                        <span>View Quiz Report</span>
                      </button>
                    </>
                  ) : (
                    <div className="py-8 text-center text-neutral-400 text-xs font-mono">
                      No 2nd place candidate yet
                    </div>
                  )}
                </div>

                {/* 1st Place: Gold Champion (Prominent) */}
                <div className="order-1 md:order-2 bg-linear-to-b from-amber-50/70 via-white to-white border-2 border-amber-400 rounded-sm p-6 shadow-md relative flex flex-col justify-between md:-translate-y-2">
                  <div className="absolute -top-3.5 right-4 bg-amber-400 border border-amber-500 text-amber-950 text-[11px] font-black uppercase font-mono px-3 py-0.5 rounded-full shadow-xs flex items-center space-x-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-900" />
                    <span>Gold Champion #1</span>
                  </div>

                  {top1 ? (
                    <>
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-amber-400 border-2 border-amber-500 text-amber-950 font-mono font-black text-base flex items-center justify-center shadow-xs">
                            🥇
                          </div>
                          <div>
                            <div className="font-black text-redhat-black text-base leading-tight">
                              {top1.student_name}
                            </div>
                            <div className="text-xs font-mono text-neutral-600 font-bold">
                              {top1.student_roll_no}
                            </div>
                            {(top1.student_email || top1.student_phone) && (
                              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                {top1.student_email || top1.student_phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-amber-50/50 p-3.5 rounded-xs border border-amber-200 mb-4 space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs uppercase font-black text-neutral-600">Champion Score:</span>
                            <span className="text-2xl font-black font-mono text-redhat-red">
                              {top1.score} <span className="text-sm text-neutral-500">/ 60 marks</span>
                            </span>
                          </div>
                          <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-redhat-red h-full rounded-full"
                              style={{ width: `${Math.min(100, (top1.score / (top1.total_marks || 60)) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs pt-1">
                            <span className="text-neutral-600">Accuracy:</span>
                            <span className="font-mono font-black text-redhat-black">
                              {((top1.score / (top1.total_marks || 60)) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-600">Completion Time:</span>
                            <span className="font-mono font-black text-redhat-black">
                              {Math.floor((top1.time_taken_seconds || 0) / 60)}m {(top1.time_taken_seconds || 0) % 60}s
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-600">Started:</span>
                            <span className="font-mono font-bold text-redhat-black">
                              {formatTimeOnlyIST(top1.created_at)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-600">Submitted:</span>
                            <span className="font-mono font-bold text-redhat-black">
                              {formatTimeOnlyIST(top1.submitted_at || top1.created_at)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-amber-200">
                            <span className="text-neutral-600">Proctoring Telemetry:</span>
                            <span className={`font-mono font-bold ${top1.violations_count > 0 ? 'text-redhat-red' : 'text-emerald-700'}`}>
                              {top1.violations_count > 0 ? `${top1.violations_count} violation(s)` : '100% Clean Record'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAudit(top1.id, 'report')}
                        className="w-full py-2 bg-redhat-red hover:bg-redhat-red-dark text-white text-xs font-black uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Champion Quiz Report</span>
                      </button>
                    </>
                  ) : (
                    <div className="py-8 text-center text-neutral-400 text-xs font-mono">
                      Awaiting submissions
                    </div>
                  )}
                </div>

                {/* 3rd Place: Bronze */}
                <div className="order-3 md:order-3 bg-linear-to-b from-amber-900/5 to-white border-2 border-amber-700/30 rounded-sm p-5 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute -top-3 right-4 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full shadow-2xs flex items-center space-x-1">
                    <Medal className="w-3 h-3 text-amber-700" />
                    <span>3rd Place</span>
                  </div>

                  {top3 ? (
                    <>
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-mono font-black text-sm flex items-center justify-center">
                            #3
                          </div>
                          <div>
                            <div className="font-black text-redhat-black text-sm leading-snug">
                              {top3.student_name}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500">
                              {top3.student_roll_no}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xs border border-amber-200/50 mb-3 space-y-1.5">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[11px] uppercase font-bold text-neutral-500">Score:</span>
                            <span className="text-xl font-black font-mono text-redhat-black">
                              {top3.score} <span className="text-xs text-neutral-400">/ 60</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Accuracy:</span>
                            <span className="font-mono font-bold text-neutral-800">
                              {((top3.score / (top3.total_marks || 60)) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Time Taken:</span>
                            <span className="font-mono font-bold text-neutral-800">
                              {Math.floor((top3.time_taken_seconds || 0) / 60)}m {(top3.time_taken_seconds || 0) % 60}s
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Started:</span>
                            <span className="font-mono font-bold text-neutral-700">
                              {formatTimeOnlyIST(top3.created_at)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Submitted:</span>
                            <span className="font-mono font-bold text-neutral-700">
                              {formatTimeOnlyIST(top3.submitted_at || top3.created_at)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-amber-100">
                            <span className="text-neutral-500">Integrity:</span>
                            <span className={`font-mono font-bold ${top3.violations_count > 0 ? 'text-redhat-red' : 'text-emerald-700'}`}>
                              {top3.violations_count > 0 ? `${top3.violations_count} violation(s)` : 'Clean Record'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAudit(top3.id, 'report')}
                        className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <FileText className="w-3 h-3 text-amber-700" />
                        <span>View Quiz Report</span>
                      </button>
                    </>
                  ) : (
                    <div className="py-8 text-center text-neutral-400 text-xs font-mono">
                      No 3rd place candidate yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Table Controls (Search & Quick Filters) */}
          <div className="bg-white p-4 border border-redhat-gray-border rounded-sm shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search candidate, roll no, email..."
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-redhat-gray-border rounded-sm text-xs font-mono focus:outline-hidden focus:border-redhat-red"
              />
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-2">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700">Filter Standings:</span>
              <select
                value={leaderboardFilter}
                onChange={(e) => setLeaderboardFilter(e.target.value as any)}
                className="text-xs border border-redhat-gray-border rounded-sm px-2.5 py-1.5 font-bold text-neutral-800 focus:outline-hidden"
              >
                <option value="all">All Ranked Candidates ({leaderboard.length})</option>
                <option value="top10">Top 10 Spotlight</option>
                <option value="clean">Clean Integrity Records Only ({cleanRecordsCount})</option>
                <option value="disqualified">Disqualified Only</option>
              </select>
            </div>
          </div>

          {/* Full Ranked Leaderboard Table with Start/End Times */}
          <div className="bg-white border border-redhat-gray-border rounded-sm shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-redhat-black text-white text-xs uppercase font-black tracking-wider border-b-2 border-redhat-red">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Candidate Details</th>
                  <th className="py-3.5 px-4 text-center">Score (Max 60)</th>
                  <th className="py-3.5 px-4 text-center">Duration &amp; Timestamps</th>
                  <th className="py-3.5 px-4 text-center">Integrity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Quiz Report &amp; Audit</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-redhat-gray-border">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">
                      {isLoading ? 'Loading ranked leaderboard...' : 'No candidates match the specified filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((item, index) => {
                    const isEven = index % 2 === 0;
                    const rowBg = item.disqualified
                      ? 'bg-red-50/50'
                      : isEven
                      ? 'bg-white'
                      : 'bg-neutral-50/60';

                    // Rank badge decoration
                    let rankBadge = (
                      <span className="font-mono font-bold text-neutral-600 text-sm">
                        #{item.rank}
                      </span>
                    );
                    if (item.rank === 1 && !item.disqualified) {
                      rankBadge = (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-mono font-black text-xs shadow-2xs">
                          🥇 1
                        </span>
                      );
                    } else if (item.rank === 2 && !item.disqualified) {
                      rankBadge = (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-mono font-black text-xs shadow-2xs">
                          🥈 2
                        </span>
                      );
                    } else if (item.rank === 3 && !item.disqualified) {
                      rankBadge = (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-mono font-black text-xs shadow-2xs">
                          🥉 3
                        </span>
                      );
                    }

                    const pct = item.total_marks > 0
                      ? ((item.score / item.total_marks) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <tr key={item.id} className={`${rowBg} hover:bg-red-50/30 transition-colors`}>
                        <td className="py-3.5 px-4 text-center">{rankBadge}</td>
                        <td className="py-3.5 px-4 font-bold text-redhat-black">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                              {item.student_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-redhat-black">{item.student_name}</div>
                              <div className="text-[11px] font-mono text-neutral-500 font-normal">
                                Roll No: <span className="font-bold text-neutral-700">{item.student_roll_no}</span>
                                {item.student_email && ` • ${item.student_email}`}
                                {item.student_phone && ` • ${item.student_phone}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-black text-sm text-redhat-black">
                            {item.score} <span className="text-[10px] text-neutral-400">/ {item.total_marks}</span>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500 font-bold mt-0.5">
                            {pct}% Accuracy
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <div className="font-bold text-neutral-800 text-xs flex items-center justify-center space-x-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>
                              {Math.floor((item.time_taken_seconds || 0) / 60)}m {(item.time_taken_seconds || 0) % 60}s
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5" title={`Start: ${formatDateTimeIST(item.created_at)} | End: ${formatDateTimeIST(item.submitted_at || item.created_at)}`}>
                            <span className="text-neutral-700 font-semibold">{formatTimeOnlyIST(item.created_at)}</span>
                            <span className="text-neutral-400 mx-1">&rarr;</span>
                            <span className="text-neutral-700 font-semibold">{formatTimeOnlyIST(item.submitted_at || item.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                              item.violations_count > 0
                                ? 'bg-red-100 text-redhat-red border border-red-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {item.violations_count === 0 ? 'Clean (0)' : `${item.violations_count} Strikes`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.disqualified ? (
                            <span className="inline-block bg-red-900 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Disqualified
                            </span>
                          ) : item.status === 'auto_submitted' ? (
                            <span className="inline-block bg-orange-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Auto-submitted
                            </span>
                          ) : item.status === 'incomplete' ? (
                            <span className="inline-block bg-amber-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Incomplete
                            </span>
                          ) : item.status === 'submitted' ? (
                            <span className="inline-block bg-emerald-700 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-block bg-neutral-200 text-neutral-800 font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAudit(item.id, 'report')}
                            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-red-50 hover:text-redhat-red text-neutral-800 rounded-xs font-bold text-[11px] inline-flex items-center space-x-1.5 transition-colors cursor-pointer border border-neutral-300"
                            title="Inspect candidate's question-by-question answer sheet & timing"
                          >
                            <FileText className="w-3.5 h-3.5 text-redhat-red" />
                            <span>Quiz Report</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CANDIDATE TELEMETRY & AUDIT VIEW                  */}
      {/* ======================================================== */}
      {adminTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Red/Black Metric Cards */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Submissions */}
              <div className="bg-redhat-black text-white p-5 rounded-sm border-l-4 border-l-redhat-red shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase">
                  <span>Total Candidates</span>
                  <Users className="w-4 h-4 text-redhat-red" />
                </div>
                <div className="text-3xl font-black font-mono mt-2">{metrics.totalSubmissions}</div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {metrics.completedCount} completed ({metrics.completionRate}%)
                </div>
              </div>

              {/* Average Score */}
              <div className="bg-white p-5 rounded-sm border border-redhat-gray-border shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase">
                  <span>Average Score</span>
                  <Award className="w-4 h-4 text-redhat-black" />
                </div>
                <div className="text-3xl font-black font-mono text-redhat-black mt-2">
                  {metrics.avgScore} <span className="text-sm text-neutral-400">/ 60 marks</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Active Question Bank: 60 items (60 Marks)
                </div>
              </div>

              {/* Total Violations Logged */}
              <div className="bg-white p-5 rounded-sm border border-redhat-gray-border shadow-xs">
                <div className="flex items-center justify-between text-redhat-red text-xs font-bold uppercase">
                  <span>Violations Logged</span>
                  <ShieldAlert className="w-4 h-4 text-redhat-red" />
                </div>
                <div className="text-3xl font-black font-mono text-redhat-red mt-2">
                  {metrics.totalViolations}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Across all candidate sessions
                </div>
              </div>

              {/* Disqualification / Flag Rate */}
              <div className="bg-white p-5 rounded-sm border border-redhat-gray-border shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase">
                  <span>Disqualified / Flagged</span>
                  <AlertTriangle className="w-4 h-4 text-redhat-red" />
                </div>
                <div className="text-3xl font-black font-mono text-redhat-black mt-2">
                  {metrics.disqualifiedCount}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Violated threshold of {activeQuiz?.max_violations || 3} strikes
                </div>
              </div>
            </div>
          )}

          {/* Table Controls (Search & Status Filter) */}
          <div className="bg-white p-4 border border-redhat-gray-border rounded-sm shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Name or Roll No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-redhat-gray-border rounded-sm text-xs font-mono focus:outline-hidden focus:border-redhat-red"
              />
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs border border-redhat-gray-border rounded-sm px-2.5 py-1.5 font-bold text-neutral-800 focus:outline-hidden"
              >
                <option value="all">All Candidates</option>
                <option value="submitted">Completed Only</option>
                <option value="auto_submitted">Auto-submitted Only</option>
                <option value="incomplete">Incomplete Only</option>
                <option value="disqualified">Disqualified Only</option>
              </select>
            </div>
          </div>

          {/* Submissions Data Table with Start/End Times */}
          <div className="bg-white border border-redhat-gray-border rounded-sm shadow-xs overflow-x-auto mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-redhat-red text-white text-xs uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Violations</th>
                  <th className="py-3 px-4 text-center">Time &amp; Timestamps</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-redhat-gray-border">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      {isLoading ? 'Loading candidates...' : 'No candidate submissions found.'}
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub, index) => {
                    const isEven = index % 2 === 0;
                    const rowBg = isEven ? 'bg-white' : 'bg-redhat-gray-light/60';

                    return (
                      <tr key={sub.id} className={`${rowBg} hover:bg-red-50/30 transition-colors`}>
                        <td className="py-3 px-4 font-mono font-bold text-redhat-black">
                          {sub.student_roll_no}
                        </td>
                        <td className="py-3 px-4 font-bold text-redhat-black">
                          <div>{sub.student_name}</div>
                          {(sub.student_email || sub.student_phone) && (
                            <div className="text-[11px] font-normal text-neutral-500 font-mono mt-0.5">
                              {sub.student_email} {sub.student_phone ? `• ${sub.student_phone}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {sub.score} / {sub.total_marks}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold ${
                              sub.violations_count > 0
                                ? 'bg-red-100 text-redhat-red'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {sub.violations_count || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="font-bold text-neutral-700">
                            {Math.floor((sub.time_taken_seconds || 0) / 60)}m{' '}
                            {(sub.time_taken_seconds || 0) % 60}s
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {formatTimeOnlyIST(sub.created_at)} &rarr; {formatTimeOnlyIST(sub.submitted_at || sub.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {sub.disqualified ? (
                            <span className="inline-block bg-red-900 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Disqualified
                            </span>
                          ) : sub.status === 'auto_submitted' ? (
                            <span className="inline-block bg-orange-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Auto-submitted
                            </span>
                          ) : sub.status === 'incomplete' ? (
                            <span className="inline-block bg-amber-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Incomplete
                            </span>
                          ) : sub.status === 'submitted' ? (
                            <span className="inline-block bg-emerald-700 text-white font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-block bg-neutral-200 text-neutral-800 font-mono text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold">
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenAudit(sub.id, 'report')}
                            className="p-1.5 text-neutral-600 hover:text-redhat-red transition-colors inline-flex items-center space-x-1 font-bold cursor-pointer"
                            title="View Full Question-by-Question Report & Snapshots"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CANDIDATE AUDIT & FULL QUIZ REPORT MODAL                 */}
      {/* ======================================================== */}
      {selectedSubId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white border-2 border-redhat-black rounded-sm max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-redhat-black text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-redhat-red">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono tracking-widest text-redhat-red uppercase font-black bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded-xs">
                    OFFICIAL EXAMINATION REPORT
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
                    • {auditDetails?.submission.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black font-display uppercase tracking-wider text-white mt-1">
                  {auditDetails?.submission.student_name}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Roll No: <span className="text-white font-bold">{auditDetails?.submission.student_roll_no}</span>
                  {auditDetails?.submission.student_email && ` • Email: ${auditDetails?.submission.student_email}`}
                  {auditDetails?.submission.student_phone && ` • Phone: ${auditDetails?.submission.student_phone}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSubId(null);
                  setAuditDetails(null);
                }}
                className="text-neutral-400 hover:text-white p-1.5 cursor-pointer bg-neutral-900 hover:bg-neutral-800 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exam Timing & Score Summary Card */}
            {auditDetails && (
              <div className="bg-neutral-900 text-white p-4 border-b border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="border-l-2 border-amber-400 pl-2.5">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>Started At</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {formatDateTimeIST(auditDetails.submission.created_at)}
                  </div>
                </div>

                <div className="border-l-2 border-emerald-400 pl-2.5">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Submitted At</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {formatDateTimeIST(auditDetails.submission.submitted_at || auditDetails.submission.created_at)}
                  </div>
                </div>

                <div className="border-l-2 border-sky-400 pl-2.5">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    <span>Total Duration</span>
                  </div>
                  <div className="text-xs font-mono font-black text-white mt-0.5">
                    {Math.floor((auditDetails.submission.time_taken_seconds || 0) / 60)}m{' '}
                    {(auditDetails.submission.time_taken_seconds || 0) % 60}s
                  </div>
                </div>

                <div className="border-l-2 border-redhat-red pl-2.5">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center space-x-1">
                    <Award className="w-3 h-3 text-redhat-red" />
                    <span>Final Score</span>
                  </div>
                  <div className="text-sm font-mono font-black text-redhat-red mt-0.5">
                    {auditDetails.submission.score} / {auditDetails.submission.total_marks || 60}{' '}
                    <span className="text-[10px] text-neutral-400 font-normal">
                      ({(((auditDetails.submission.score || 0) / (auditDetails.submission.total_marks || 60)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-redhat-gray-border bg-neutral-100 px-4 pt-2 gap-2 text-xs">
              <button
                onClick={() => setModalTab('report')}
                className={`py-2 px-3 font-bold uppercase flex items-center space-x-1.5 border-b-2 cursor-pointer transition-colors ${
                  modalTab === 'report'
                    ? 'border-redhat-red text-redhat-red bg-white rounded-t-sm shadow-2xs'
                    : 'border-transparent text-neutral-600 hover:text-redhat-black'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Quiz Report &amp; Answer Sheet ({auditDetails?.questions?.length || 0})</span>
              </button>

              <button
                onClick={() => setModalTab('timeline')}
                className={`py-2 px-3 font-bold uppercase flex items-center space-x-1.5 border-b-2 cursor-pointer transition-colors ${
                  modalTab === 'timeline'
                    ? 'border-redhat-red text-redhat-red bg-white rounded-t-sm shadow-2xs'
                    : 'border-transparent text-neutral-600 hover:text-redhat-black'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Cheating Violations ({auditDetails?.violations?.length || 0})</span>
              </button>

              <button
                onClick={() => setModalTab('snapshots')}
                className={`py-2 px-3 font-bold uppercase flex items-center space-x-1.5 border-b-2 cursor-pointer transition-colors ${
                  modalTab === 'snapshots'
                    ? 'border-redhat-red text-redhat-red bg-white rounded-t-sm shadow-2xs'
                    : 'border-transparent text-neutral-600 hover:text-redhat-black'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Webcam Snapshots ({auditDetails?.snapshots?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-neutral-50/50">
              {auditLoading ? (
                <div className="text-center py-16 text-neutral-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-redhat-red mb-2" />
                  <span>Loading candidate question breakdown and audit timeline...</span>
                </div>
              ) : auditDetails ? (
                <>
                  {/* ======================================================== */}
                  {/* MODAL TAB 1: FULL QUIZ REPORT & ANSWER SHEET             */}
                  {/* ======================================================== */}
                  {modalTab === 'report' && (
                    <div className="space-y-5 animate-in fade-in-50 duration-150">
                      {/* Detailed Question Counters */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3 text-center">
                          <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center justify-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct Answers</span>
                          </div>
                          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
                            {reportStats.correct}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                            +{reportStats.correct} Marks
                          </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-center">
                          <div className="text-[10px] uppercase font-bold text-redhat-red flex items-center justify-center space-x-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect Answers</span>
                          </div>
                          <div className="text-2xl font-black font-mono text-redhat-red mt-1">
                            {reportStats.incorrect}
                          </div>
                          <div className="text-[10px] text-red-600 font-mono mt-0.5">
                            0 Marks
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 text-center">
                          <div className="text-[10px] uppercase font-bold text-amber-700 flex items-center justify-center space-x-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Unanswered / Skipped</span>
                          </div>
                          <div className="text-2xl font-black font-mono text-amber-800 mt-1">
                            {reportStats.unanswered}
                          </div>
                          <div className="text-[10px] text-amber-600 font-mono mt-0.5">
                            0 Marks
                          </div>
                        </div>

                        <div className="bg-neutral-100 border border-neutral-300 rounded-sm p-3 text-center">
                          <div className="text-[10px] uppercase font-bold text-neutral-700 flex items-center justify-center space-x-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Attempt Rate</span>
                          </div>
                          <div className="text-2xl font-black font-mono text-neutral-800 mt-1">
                            {reportStats.total > 0
                              ? Math.round((reportStats.attempted / reportStats.total) * 100)
                              : 0}%
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            {reportStats.attempted} / {reportStats.total} Questions
                          </div>
                        </div>
                      </div>

                      {/* Filter Answer Chips */}
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 pt-1">
                        <span className="text-xs font-bold text-neutral-600 mr-1">Filter View:</span>
                        <button
                          onClick={() => setReportQuestionFilter('all')}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                            reportQuestionFilter === 'all'
                              ? 'bg-redhat-black text-white'
                              : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          All Questions ({analyzedQuestions.length})
                        </button>

                        <button
                          onClick={() => setReportQuestionFilter('correct')}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center space-x-1 ${
                            reportQuestionFilter === 'correct'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Correct ({reportStats.correct})</span>
                        </button>

                        <button
                          onClick={() => setReportQuestionFilter('incorrect')}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center space-x-1 ${
                            reportQuestionFilter === 'incorrect'
                              ? 'bg-redhat-red text-white'
                              : 'bg-red-50 border border-red-300 text-redhat-red hover:bg-red-100'
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Incorrect ({reportStats.incorrect})</span>
                        </button>

                        <button
                          onClick={() => setReportQuestionFilter('unanswered')}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center space-x-1 ${
                            reportQuestionFilter === 'unanswered'
                              ? 'bg-amber-700 text-white'
                              : 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Unanswered ({reportStats.unanswered})</span>
                        </button>
                      </div>

                      {/* Question Cards List */}
                      <div className="space-y-4">
                        {filteredQuestions.length === 0 ? (
                          <div className="text-center py-10 bg-white border border-neutral-200 rounded-sm text-neutral-500">
                            No questions match the selected filter.
                          </div>
                        ) : (
                          filteredQuestions.map((item) => {
                            const q = item.question;
                            const options = q.options || [];

                            return (
                              <div
                                key={q.id}
                                className={`p-4 rounded-sm border transition-shadow bg-white shadow-2xs ${
                                  item.isCorrect
                                    ? 'border-emerald-300'
                                    : item.isUnanswered
                                    ? 'border-amber-300'
                                    : 'border-red-300'
                                }`}
                              >
                                {/* Question Header */}
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-black text-xs text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-xs">
                                      Q{item.index} of {analyzedQuestions.length}
                                    </span>
                                    <span className="text-[11px] text-neutral-500 font-mono">
                                      ({q.marks || 1} Mark)
                                    </span>
                                  </div>

                                  <div>
                                    {item.isCorrect ? (
                                      <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                        <span>Correct (+1)</span>
                                      </span>
                                    ) : item.isUnanswered ? (
                                      <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-amber-200">
                                        <HelpCircle className="w-3 h-3 text-amber-700" />
                                        <span>Not Answered (0)</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center space-x-1 bg-red-100 text-redhat-red font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-red-200">
                                        <XCircle className="w-3 h-3 text-redhat-red" />
                                        <span>Incorrect (0)</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Question Text */}
                                <p className="text-xs sm:text-sm font-bold text-redhat-black mb-3">
                                  {q.text}
                                </p>

                                {/* Options Breakdown */}
                                {options.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {options.map((opt, oIdx) => {
                                      const isCorrectOpt = String(q.correct_answer || '').trim() === String(opt).trim();
                                      const isSelectedOpt = String(item.studentAns || '').trim() === String(opt).trim();

                                      let optStyle = 'bg-neutral-50 border-neutral-200 text-neutral-700';
                                      let optBadge: React.ReactNode = null;

                                      if (isSelectedOpt && isCorrectOpt) {
                                        optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500';
                                        optBadge = (
                                          <span className="text-[10px] font-mono text-emerald-700 uppercase font-black ml-auto pl-2 flex items-center space-x-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>Student Selected (Correct)</span>
                                          </span>
                                        );
                                      } else if (isSelectedOpt && !isCorrectOpt) {
                                        optStyle = 'bg-red-50 border-red-500 text-red-950 font-bold ring-1 ring-red-500';
                                        optBadge = (
                                          <span className="text-[10px] font-mono text-red-700 uppercase font-black ml-auto pl-2 flex items-center space-x-1">
                                            <XCircle className="w-3 h-3 text-redhat-red" />
                                            <span>Student Selected (Wrong)</span>
                                          </span>
                                        );
                                      } else if (!isSelectedOpt && isCorrectOpt) {
                                        optStyle = 'bg-emerald-50/40 border-dashed border-2 border-emerald-500 text-emerald-900 font-semibold';
                                        optBadge = (
                                          <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold ml-auto pl-2 flex items-center space-x-1">
                                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                                            <span>Correct Answer</span>
                                          </span>
                                        );
                                      }

                                      return (
                                        <div
                                          key={oIdx}
                                          className={`p-2.5 rounded-xs border flex items-center justify-between ${optStyle}`}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <span className="font-mono font-bold text-neutral-400 text-[11px] shrink-0">
                                              {String.fromCharCode(65 + oIdx)}.
                                            </span>
                                            <span className="leading-snug">{opt}</span>
                                          </div>
                                          {optBadge}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="bg-neutral-50 p-3 rounded-xs border border-neutral-200 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-neutral-500 font-bold uppercase text-[10px]">Student's Answer:</span>
                                      <span className={`font-mono font-bold ${item.isCorrect ? 'text-emerald-700' : 'text-redhat-red'}`}>
                                        {item.studentAns || '(No Answer)'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-neutral-200 pt-1.5">
                                      <span className="text-neutral-500 font-bold uppercase text-[10px]">Correct Answer:</span>
                                      <span className="font-mono font-bold text-emerald-800">
                                        {String(q.correct_answer)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MODAL TAB 2: ANTI-CHEATING VIOLATION TIMELINE            */}
                  {/* ======================================================== */}
                  {modalTab === 'timeline' && (
                    <div className="space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-redhat-black flex items-center space-x-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-redhat-red" />
                          <span>Chronological Incident Timeline ({auditDetails.violations.length} logged)</span>
                        </h4>
                      </div>

                      {auditDetails.violations.length === 0 ? (
                        <div className="p-6 bg-white border border-emerald-200 rounded-sm text-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                          <h5 className="font-bold text-emerald-900 text-sm">100% Clean Session</h5>
                          <p className="text-neutral-500 text-xs mt-1">
                            No integrity strikes, tab switches, or screenshot shortcuts were recorded for this candidate.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-redhat-gray-border rounded-xs divide-y divide-neutral-200 bg-white">
                          {auditDetails.violations.map((v, i) => (
                            <div key={i} className="p-3 flex items-center justify-between hover:bg-neutral-50">
                              <div>
                                <span className="font-bold text-redhat-red font-mono mr-2 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-2xs text-[11px]">
                                  [{v.type}]
                                </span>
                                <span className="text-neutral-800 font-medium">
                                  {v.meta?.action || v.meta?.reason || v.meta?.key || 'Security incident recorded'}
                                </span>
                              </div>
                              <span className="text-neutral-500 font-mono text-[11px] shrink-0 pl-3">
                                {formatDateTimeIST(v.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MODAL TAB 3: PROCTOR WEBCAM SNAPSHOTS                    */}
                  {/* ======================================================== */}
                  {modalTab === 'snapshots' && (
                    <div className="space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-redhat-black flex items-center space-x-1.5">
                          <Camera className="w-3.5 h-3.5 text-neutral-700" />
                          <span>Webcam Captures ({auditDetails.snapshots.length} available)</span>
                        </h4>
                      </div>

                      {auditDetails.snapshots.length === 0 ? (
                        <div className="p-6 bg-white border border-neutral-200 rounded-sm text-center text-neutral-500">
                          <Camera className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-xs">No webcam snapshots recorded (camera authentication was disabled).</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {auditDetails.snapshots.map((snap, i) => (
                            <div key={i} className="border border-neutral-300 rounded-xs overflow-hidden bg-black text-center shadow-2xs">
                              <img
                                src={snap.image_url}
                                alt={`Capture ${i + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              <div className="text-[10px] text-white p-1 bg-neutral-900 font-mono">
                                {formatTimeOnlyIST(snap.timestamp)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-redhat-gray-light border-t border-redhat-gray-border flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-mono">
                Candidate ID: {auditDetails?.submission.id}
              </span>
              <button
                onClick={() => {
                  setSelectedSubId(null);
                  setAuditDetails(null);
                }}
                className="px-5 py-2 bg-redhat-black hover:bg-neutral-800 text-white text-xs font-bold uppercase rounded-sm cursor-pointer shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ CONFIGURATION MODAL */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveConfig}
            className="bg-white border-2 border-redhat-red rounded-sm max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-redhat-gray-border">
              <h3 className="text-base font-black text-redhat-black font-display uppercase tracking-tight">
                Quiz &amp; Proctoring Rules
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-neutral-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  Exam Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={durationInput}
                  onChange={(e) => setDurationInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-redhat-gray-border rounded-sm font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  Max Violations Threshold (Auto-Disqualify)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxViolationsInput}
                  onChange={(e) => setMaxViolationsInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-redhat-gray-border rounded-sm font-mono text-sm"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Students exceeding this number of strikes will be automatically disqualified and submitted.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-neutral-700">Shuffle Questions &amp; Options:</span>
                <input
                  type="checkbox"
                  checked={shuffleInput}
                  onChange={(e) => setShuffleInput(e.target.checked)}
                  className="w-4 h-4 accent-redhat-red cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-700">Allow Question Backtracking:</span>
                <input
                  type="checkbox"
                  checked={backtrackInput}
                  onChange={(e) => setBacktrackInput(e.target.checked)}
                  className="w-4 h-4 accent-redhat-red cursor-pointer"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-4 border-t border-redhat-gray-border">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="flex-1 py-2.5 border border-redhat-gray-border rounded-sm text-xs font-bold text-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-redhat-red hover:bg-redhat-red-dark text-white text-xs font-black uppercase tracking-wider rounded-sm shadow-sm cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
