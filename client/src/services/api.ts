import {
  User,
  Quiz,
  Question,
  Submission,
  ViolationType,
  AdminMetrics,
  Violation,
  ProctorSnapshot,
} from '../types/quiz';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Auth
  async loginStudent(rollNo: string, name: string, email: string, phone: string): Promise<{ user: User; quizId: string; quizTitle: string }> {
    const res = await fetch(`${BASE_URL}/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNo, name, email, phone }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(data.error || 'Failed to authenticate student');
    }
    return res.json();
  },

  async loginAdmin(passcode?: string): Promise<{ user: User; role: 'admin' }> {
    const res = await fetch(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode || '' }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Admin login failed' }));
      throw new Error(data.error || 'Admin login failed');
    }
    return res.json();
  },

  // Quiz
  async getActiveQuiz(): Promise<{ quiz: Quiz; questionCount: number; totalMarks: number }> {
    const res = await fetch(`${BASE_URL}/quiz/active`);
    if (!res.ok) throw new Error('Could not fetch active quiz');
    return res.json();
  },

  async startQuiz(
    quizId: string,
    userId: string,
    userName?: string,
    userRollNo?: string,
    userEmail?: string,
    userPhone?: string
  ): Promise<{
    submission: Submission;
    quiz: Quiz;
    questions: Question[];
  }> {
    const res = await fetch(`${BASE_URL}/quiz/${quizId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, userRollNo, userEmail, userPhone }),
    });
    if (!res.ok) throw new Error('Could not start quiz session');
    return res.json();
  },

  // Violations
  async recordViolation(
    submissionId: string,
    userId: string,
    type: ViolationType,
    meta?: Record<string, any>
  ): Promise<{
    success: boolean;
    violationsCount: number;
    isDisqualified: boolean;
    reason?: string;
  }> {
    const res = await fetch(`${BASE_URL}/violations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, userId, type, meta }),
    });
    if (!res.ok) throw new Error('Failed to log violation');
    return res.json();
  },

  async recordSnapshot(
    submissionId: string,
    userId: string,
    imageUrl: string,
    flag: 'normal' | 'no_face' | 'multiple_faces' | 'low_light' = 'normal'
  ): Promise<{ success: boolean; snapshotId: string }> {
    const res = await fetch(`${BASE_URL}/violations/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, userId, imageUrl, flag }),
    });
    if (!res.ok) throw new Error('Failed to record snapshot');
    return res.json();
  },

  // Submissions
  async submitQuiz(
    submissionId: string,
    answers: Record<string, string | string[]>,
    timeSpentSeconds: number
  ): Promise<{
    success: boolean;
    submission: Submission;
    violationsCount: number;
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/submissions/${submissionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, timeSpentSeconds }),
    });
    if (!res.ok) throw new Error('Failed to submit quiz');
    return res.json();
  },

  async getSubmission(submissionId: string): Promise<{ submission: Submission; violations: Violation[] }> {
    const res = await fetch(`${BASE_URL}/submissions/${submissionId}`);
    if (!res.ok) throw new Error('Could not fetch submission details');
    return res.json();
  },

  getAdminHeaders(): HeadersInit {
    const passcode =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('rha_admin_passcode') || ''
        : '';
    return {
      'Content-Type': 'application/json',
      'x-admin-passcode': passcode,
    };
  },

  // Admin
  async getAdminMetrics(): Promise<AdminMetrics> {
    const res = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: api.getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Could not fetch metrics');
    return res.json();
  },

  async getAdminSubmissions(): Promise<Submission[]> {
    const res = await fetch(`${BASE_URL}/admin/submissions`, {
      headers: api.getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Could not fetch submissions');
    return res.json();
  },

  async getSubmissionDetails(submissionId: string): Promise<{
    submission: Submission;
    violations: Violation[];
    snapshots: ProctorSnapshot[];
    questions: Question[];
  }> {
    const res = await fetch(`${BASE_URL}/admin/submissions/${submissionId}/details`, {
      headers: api.getAdminHeaders(),
    });
    if (!res.ok) throw new Error('Could not fetch submission audit details');
    return res.json();
  },

  async updateQuizSettings(
    quizId: string,
    settings: {
      duration_minutes?: number;
      max_violations?: number;
      shuffle_questions?: boolean;
      allow_backtracking?: boolean;
    }
  ): Promise<{ success: boolean; quiz: Quiz }> {
    const res = await fetch(`${BASE_URL}/admin/quiz/${quizId}`, {
      method: 'PUT',
      headers: api.getAdminHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Could not update quiz settings');
    return res.json();
  },

  getExportCsvUrl(): string {
    const passcode =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('rha_admin_passcode') || ''
        : '';
    return `${BASE_URL}/admin/export-csv?passcode=${encodeURIComponent(passcode)}`;
  },
};
