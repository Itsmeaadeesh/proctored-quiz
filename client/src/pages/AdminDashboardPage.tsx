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
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'auto_submitted' | 'incomplete' | 'disqualified'>('all');
  const [isLoading, setIsLoading] = useState(true);

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
  const [durationInput, setDurationInput] = useState(15);
  const [maxViolationsInput, setMaxViolationsInput] = useState(3);
  const [shuffleInput, setShuffleInput] = useState(true);
  const [backtrackInput, setBacktrackInput] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, subs, qData] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminSubmissions(),
        api.getActiveQuiz(),
      ]);
      setMetrics(m);
      setSubmissions(subs);
      setActiveQuiz(qData.quiz);
      setDurationInput(qData.quiz.duration_minutes);
      setMaxViolationsInput(qData.quiz.max_violations);
      setShuffleInput(qData.quiz.shuffle_questions);
      setBacktrackInput(qData.quiz.allow_backtracking);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setIsLoading(false);
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
      loadData();
      alert('Quiz settings updated successfully.');
    } catch (err) {
      console.error('Failed to update config:', err);
      alert('Could not update quiz settings.');
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchSearch =
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_roll_no.toLowerCase().includes(searchTerm.toLowerCase());
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

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-redhat-gray-border gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-redhat-red uppercase font-black">
            ADMINISTRATOR OVERSIGHT CONSOLE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-redhat-black tracking-tight">
            RHA DAY 26 Examination Proctor
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Gyan Ganga Institute of Technology & Sciences &bull; Real-time Anti-Cheating Telemetry
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="py-2.5 px-4 bg-white border border-redhat-gray-border hover:bg-neutral-50 text-redhat-black text-xs font-bold uppercase rounded-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-600" />
            <span>Settings</span>
          </button>

          <a
            href={api.getExportCsvUrl()}
            download
            className="py-2.5 px-4 bg-redhat-red hover:bg-redhat-red-dark text-white text-xs font-black uppercase tracking-wider rounded-sm flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Red/Black Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
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
              <CheckCircle className="w-4 h-4 text-neutral-700" />
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
      <div className="bg-white p-4 border border-redhat-gray-border rounded-sm shadow-2xs mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
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

      {/* Submissions Data Table (Styled with Red Hat Red header per branding) */}
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
                className="text-neutral-400 hover:text-white p-1"
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
                        No integrity violations recorded for this candidate.
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
                className="px-4 py-2 bg-redhat-black text-white text-xs font-bold uppercase rounded-sm"
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
                className="text-neutral-500 hover:text-black"
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
                className="flex-1 py-2.5 border border-redhat-gray-border rounded-sm text-xs font-bold text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-redhat-red hover:bg-redhat-red-dark text-white text-xs font-black uppercase tracking-wider rounded-sm shadow-sm"
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
