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
} from 'lucide-react';

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

  // Selected student audit modal
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
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

  const handleOpenAudit = async (subId: string) => {
    setSelectedSubId(subId);
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

  // Top 3 Podium Candidates (from overall non-disqualified ranked entries)
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
            Gyan Ganga Institute of Technology &amp; Sciences &bull; Real-time Proctored Leaderboard &amp; Audit Logs
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
                            <span className="text-neutral-500">Integrity:</span>
                            <span className={`font-mono font-bold ${top2.violations_count > 0 ? 'text-redhat-red' : 'text-emerald-700'}`}>
                              {top2.violations_count > 0 ? `${top2.violations_count} violation(s)` : 'Clean Record'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAudit(top2.id)}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Submission</span>
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
                            <span className="text-neutral-600">Proctoring Telemetry:</span>
                            <span className={`font-mono font-bold ${top1.violations_count > 0 ? 'text-redhat-red' : 'text-emerald-700'}`}>
                              {top1.violations_count > 0 ? `${top1.violations_count} violation(s)` : '100% Clean Record'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAudit(top1.id)}
                        className="w-full py-2 bg-redhat-red hover:bg-redhat-red-dark text-white text-xs font-black uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Champion Audit</span>
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
                            <span className="text-neutral-500">Integrity:</span>
                            <span className={`font-mono font-bold ${top3.violations_count > 0 ? 'text-redhat-red' : 'text-emerald-700'}`}>
                              {top3.violations_count > 0 ? `${top3.violations_count} violation(s)` : 'Clean Record'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAudit(top3.id)}
                        className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Submission</span>
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

          {/* Full Ranked Leaderboard Table */}
          <div className="bg-white border border-redhat-gray-border rounded-sm shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-redhat-black text-white text-xs uppercase font-black tracking-wider border-b-2 border-redhat-red">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Candidate Information</th>
                  <th className="py-3.5 px-4 text-center">Score (Max 60)</th>
                  <th className="py-3.5 px-4 text-center">Time Spent</th>
                  <th className="py-3.5 px-4 text-center">Integrity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Audit</th>
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
                            {pct}%
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-neutral-700 font-medium">
                          {Math.floor((item.time_taken_seconds || 0) / 60)}m{' '}
                          {(item.time_taken_seconds || 0) % 60}s
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
                            onClick={() => handleOpenAudit(item.id)}
                            className="p-1.5 text-neutral-600 hover:text-redhat-red transition-colors inline-flex items-center space-x-1 font-bold cursor-pointer"
                            title="Inspect detailed student timeline & proctoring snapshots"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Audit</span>
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

          {/* Submissions Data Table */}
          <div className="bg-white border border-redhat-gray-border rounded-sm shadow-xs overflow-x-auto mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-redhat-red text-white text-xs uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Violations</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Audit</th>
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
                        <td className="py-3 px-4 font-mono text-neutral-600">
                          {Math.floor((sub.time_taken_seconds || 0) / 60)}m{' '}
                          {(sub.time_taken_seconds || 0) % 60}s
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
                            onClick={() => handleOpenAudit(sub.id)}
                            className="p-1.5 text-neutral-600 hover:text-redhat-red transition-colors inline-flex items-center space-x-1 font-bold cursor-pointer"
                            title="View Detailed Student Timeline & Snapshots"
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

      {/* STUDENT AUDIT DRAWER / MODAL */}
      {selectedSubId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-redhat-black rounded-sm max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-redhat-black text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-redhat-red">
              <div>
                <h3 className="text-base font-black font-display uppercase tracking-wider text-white">
                  Candidate Integrity Audit &bull; {auditDetails?.submission.student_name}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Roll No: {auditDetails?.submission.student_roll_no} &bull; Score: {auditDetails?.submission.score}/{auditDetails?.submission.total_marks}
                  {auditDetails?.submission.student_email && ` • Email: ${auditDetails?.submission.student_email}`}
                  {auditDetails?.submission.student_phone && ` • Phone: ${auditDetails?.submission.student_phone}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSubId(null);
                  setAuditDetails(null);
                }}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {auditLoading ? (
                <div className="text-center py-12 text-neutral-500">
                  Loading candidate incident logs and snapshots...
                </div>
              ) : auditDetails ? (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-4 bg-redhat-gray-light p-4 rounded-xs border border-redhat-gray-border text-center">
                    <div>
                      <div className="text-neutral-500 uppercase font-bold">Total Violations</div>
                      <div className="text-xl font-black text-redhat-red font-mono">
                        {auditDetails.violations.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 uppercase font-bold">Snapshots Captured</div>
                      <div className="text-xl font-black text-neutral-800 font-mono">
                        {auditDetails.snapshots.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 uppercase font-bold">Submission Status</div>
                      <div className="text-sm font-bold mt-1 text-redhat-black uppercase">
                        {auditDetails.submission.disqualified ? 'Disqualified' : auditDetails.submission.status}
                      </div>
                    </div>
                  </div>

                  {/* Anti-Cheating Violation Timeline */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-redhat-black mb-2 flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-redhat-red" />
                      <span>Chronological Incident Timeline</span>
                    </h4>

                    {auditDetails.violations.length === 0 ? (
                      <p className="text-neutral-500 p-3 bg-neutral-50 rounded-xs">
                        No integrity violations recorded for this candidate. Clean session!
                      </p>
                    ) : (
                      <div className="border border-redhat-gray-border rounded-xs divide-y divide-neutral-200">
                        {auditDetails.violations.map((v, i) => (
                          <div key={i} className="p-2.5 flex items-center justify-between bg-white">
                            <div>
                              <span className="font-bold text-redhat-red font-mono mr-2">
                                [{v.type}]
                              </span>
                              <span className="text-neutral-700">
                                {v.meta?.action || v.meta?.reason || v.meta?.key || 'Security incident recorded'}
                              </span>
                            </div>
                            <span className="text-neutral-400 font-mono text-[11px]">
                              {new Date(v.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Proctor Webcam Snapshots Gallery */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-redhat-black mb-2 flex items-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Webcam Verification Captures</span>
                    </h4>

                    {auditDetails.snapshots.length === 0 ? (
                      <p className="text-neutral-500 p-3 bg-neutral-50 rounded-xs">
                        No snapshots available (camera was either disabled or unmounted).
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {auditDetails.snapshots.map((snap, i) => (
                          <div key={i} className="border border-neutral-300 rounded-xs overflow-hidden bg-black text-center">
                            <img
                              src={snap.image_url}
                              alt={`Capture ${i + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            <div className="text-[10px] text-white p-1 bg-neutral-900 font-mono">
                              {new Date(snap.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-redhat-gray-light border-t border-redhat-gray-border flex justify-end">
              <button
                onClick={() => {
                  setSelectedSubId(null);
                  setAuditDetails(null);
                }}
                className="px-4 py-2 bg-redhat-black text-white text-xs font-bold uppercase rounded-sm cursor-pointer"
              >
                Close Audit
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
