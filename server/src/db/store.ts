import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_QUIZ, DEFAULT_QUESTIONS } from '../data/defaultQuiz';
import {
  User,
  Quiz,
  Question,
  SanitizedQuestion,
  Submission,
  SubmissionStatus,
  Violation,
  ProctorSnapshot,
} from '../types';

class DataStore {
  private supabase: SupabaseClient | null = null;
  private isSupabaseEnabled: boolean = false;

  // In-memory fallback / local state
  private users: Map<string, User> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
  private questions: Map<string, Question> = new Map();
  private submissions: Map<string, Submission> = new Map();
  private violations: Violation[] = [];
  private snapshots: ProctorSnapshot[] = [];

  constructor() {
    this.initSupabase();
    this.initDefaultData();
  }

  private initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isSupabaseEnabled = true;
        console.log('✅ Supabase client initialized successfully.');
      } catch (err) {
        console.warn('⚠️ Supabase init failed, falling back to in-memory store:', err);
        this.isSupabaseEnabled = false;
      }
    } else {
      console.log('ℹ️ Running in Standalone In-Memory mode (Supabase credentials not configured).');
    }
  }

  private initDefaultData() {
    // 1. Default Admin User
    const adminUser: User = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'GGITS Red Hat Coordinator',
      roll_no: 'ADMIN-RHA',
      email: 'admin@ggits.ac.in',
      phone: '0000000000',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);
    this.users.set(adminUser.roll_no.toUpperCase(), adminUser);

    // 2. Default Quiz
    this.quizzes.set(DEFAULT_QUIZ.id, DEFAULT_QUIZ);

    // 3. Default Questions
    DEFAULT_QUESTIONS.forEach((q) => {
      this.questions.set(q.id, q);
    });
  }

  // --- USER OPERATIONS ---
  async getOrCreateStudent(
    rollNo: string,
    name: string,
    email?: string,
    phone?: string
  ): Promise<User> {
    const key = rollNo.trim().toUpperCase();
    const existing = this.users.get(key);
    if (existing) {
      if (name && existing.name !== name) {
        existing.name = name;
      }
      if (email && existing.email !== email) {
        existing.email = email;
      }
      if (phone && existing.phone !== phone) {
        existing.phone = phone;
      }
      return existing;
    }

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('users')
          .select('*')
          .eq('roll_no', key)
          .single();

        if (data && !error) {
          const user: User = {
            id: data.id,
            name: data.name,
            roll_no: data.roll_no,
            email: data.email,
            phone: data.phone,
            role: data.role,
            created_at: data.created_at,
          };
          this.users.set(user.id, user);
          this.users.set(key, user);
          return user;
        }

        const newUser: User = {
          id: uuidv4(),
          roll_no: key,
          name: name.trim(),
          email: email?.trim(),
          phone: phone?.trim(),
          role: 'student',
          created_at: new Date().toISOString(),
        };

        await this.supabase.from('users').insert({
          id: newUser.id,
          roll_no: newUser.roll_no,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
        });

        this.users.set(newUser.id, newUser);
        this.users.set(key, newUser);
        return newUser;
      } catch (err) {
        console.warn('Supabase getOrCreateStudent error, using memory fallback:', err);
      }
    }

    const newUser: User = {
      id: uuidv4(),
      roll_no: key,
      name: name.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      role: 'student',
      created_at: new Date().toISOString(),
    };
    this.users.set(newUser.id, newUser);
    this.users.set(key, newUser);
    return newUser;
  }

  async getAdminUser(): Promise<User> {
    const admin = this.users.get('00000000-0000-0000-0000-000000000001');
    if (admin) return admin;
    const defaultAdmin: User = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'GGITS Red Hat Coordinator',
      roll_no: 'ADMIN-RHA',
      email: 'admin@ggits.ac.in',
      phone: '0000000000',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    this.users.set(defaultAdmin.id, defaultAdmin);
    return defaultAdmin;
  }

  async verifyAdmin(passcode?: string): Promise<User | null> {
    const expected = process.env.ADMIN_PASSCODE || 'RHAGGITS1234@1234*#ZYX';
    if (passcode && passcode.trim() === expected) {
      return this.getAdminUser();
    }
    return null;
  }

  // --- QUIZ OPERATIONS ---
  async getActiveQuiz(): Promise<Quiz> {
    return Array.from(this.quizzes.values())[0] || DEFAULT_QUIZ;
  }

  async getQuiz(quizId: string): Promise<Quiz | null> {
    return this.quizzes.get(quizId) || null;
  }

  async updateQuiz(quizId: string, updates: Partial<Quiz>): Promise<Quiz | null> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) return null;
    Object.assign(quiz, updates);
    return quiz;
  }

  // --- QUESTION OPERATIONS ---
  async getQuestions(quizId: string, sanitize = true): Promise<(Question | SanitizedQuestion)[]> {
    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_index', { ascending: true });
        if (!error && data && data.length > 0) {
          const list = data as Question[];
          list.forEach((q) => this.questions.set(q.id, q));
          if (!sanitize) return list;
          return list.map(({ correct_answer, ...rest }) => rest);
        }
      } catch (e) {
        console.warn('Supabase getQuestions error:', e);
      }
    }
    const list = Array.from(this.questions.values()).filter((q) => q.quiz_id === quizId);
    if (!sanitize) {
      return list;
    }
    return list.map(({ correct_answer, ...rest }) => rest);
  }

  async addQuestion(question: Omit<Question, 'id'>): Promise<Question> {
    const id = uuidv4();
    const newQ: Question = { ...question, id };
    this.questions.set(id, newQ);

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        await this.supabase.from('questions').insert(newQ);
      } catch (e) {
        console.warn('Supabase addQuestion sync error:', e);
      }
    }
    return newQ;
  }

  private mapDbSubmission(data: any): Submission {
    if (!data) return data;
    const sub = { ...data } as Submission;
    if (sub.disqualification_reason === 'AUTO_SUBMITTED') {
      sub.status = 'auto_submitted';
    } else if (sub.disqualification_reason === 'INCOMPLETE') {
      sub.status = 'incomplete';
    }
    return sub;
  }

  // --- SUBMISSION OPERATIONS ---
  async startSubmission(quizId: string, user: User): Promise<Submission> {
    const quiz = await this.getQuiz(quizId);
    const durationMinutes = quiz?.duration_minutes || 60;
    const maxWindowSeconds = durationMinutes * 60;

    // Check if an in-progress or existing submission exists
    let existing = Array.from(this.submissions.values()).find(
      (s) => s.quiz_id === quizId && s.user_id === user.id
    );

    if (!existing && this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('submissions')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          existing = this.mapDbSubmission(data);
          this.submissions.set(existing.id, existing);
        }
      } catch (e) {}
    }

    if (existing) {
      // 1. Enforce one attempt: if submission is already finished
      if (
        existing.status === 'submitted' ||
        existing.status === 'auto_submitted' ||
        existing.status === 'disqualified' ||
        existing.status === 'incomplete'
      ) {
        const err: any = new Error(
          'You have already attempted or completed this examination. Only one attempt is permitted.'
        );
        err.code = 'ATTEMPT_LIMIT_REACHED';
        err.submission = existing;
        throw err;
      }

      // 2. Enforce strict 60-minute window from start time
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(existing.created_at).getTime()) / 1000
      );
      if (elapsedSeconds >= maxWindowSeconds) {
        existing.status = 'incomplete';
        existing.time_taken_seconds = maxWindowSeconds;
        existing.disqualification_reason = 'INCOMPLETE';

        if (this.isSupabaseEnabled && this.supabase) {
          try {
            await this.supabase
              .from('submissions')
              .update({
                status: 'flagged_for_review',
                disqualification_reason: 'INCOMPLETE',
                time_taken_seconds: maxWindowSeconds,
              })
              .eq('id', existing.id);
          } catch (e) {}
        }

        const err: any = new Error(
          'Your 60-minute examination window has expired. Re-entry is not permitted.'
        );
        err.code = 'WINDOW_EXPIRED';
        err.submission = existing;
        throw err;
      }

      return existing;
    }

    const quizQuestions = await this.getQuestions(quizId, false);
    const totalMarks = quizQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const submission: Submission = {
      id: uuidv4(),
      quiz_id: quizId,
      user_id: user.id,
      student_name: user.name,
      student_roll_no: user.roll_no,
      student_email: user.email,
      student_phone: user.phone,
      answers: {},
      score: 0,
      total_marks: totalMarks || 60,
      status: 'in_progress',
      disqualified: false,
      time_taken_seconds: 0,
      violations_count: 0,
      created_at: new Date().toISOString(),
    };

    this.submissions.set(submission.id, submission);

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        await this.supabase.from('submissions').insert({
          id: submission.id,
          quiz_id: submission.quiz_id,
          user_id: submission.user_id,
          student_name: submission.student_name,
          student_roll_no: submission.student_roll_no,
          student_email: submission.student_email,
          student_phone: submission.student_phone,
          answers: submission.answers,
          score: submission.score,
          total_marks: submission.total_marks,
          status: submission.status,
          disqualified: submission.disqualified,
        });
      } catch (err) {
        console.warn('Supabase insert submission error:', err);
      }
    }

    return submission;
  }

  async getSubmission(submissionId: string): Promise<Submission | null> {
    const cached = this.submissions.get(submissionId);
    if (cached) return cached;

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .single();
        if (data && !error) {
          const sub = this.mapDbSubmission(data);
          this.submissions.set(sub.id, sub);
          return sub;
        }
      } catch (err) {
        console.warn('Supabase getSubmission error:', err);
      }
    }
    return null;
  }

  async submitAnswers(
    submissionId: string,
    answers: Record<string, string | string[]>,
    timeSpentSeconds: number,
    statusOverride?: SubmissionStatus
  ): Promise<Submission | null> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) return null;

    submission.answers = answers;
    submission.time_taken_seconds = timeSpentSeconds;

    // Calculate score across all questions
    const questions = (await this.getQuestions(submission.quiz_id, false)) as Question[];

    let score = 0;
    questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
        if (q.type === 'short_answer') {
          const expected = String(q.correct_answer).trim().toLowerCase();
          const given = String(studentAns).trim().toLowerCase();
          if (expected === given) {
            score += q.marks;
          }
        } else if (q.type === 'mcq_multiple') {
          const expected = Array.isArray(q.correct_answer)
            ? q.correct_answer.sort()
            : [q.correct_answer];
          const given = Array.isArray(studentAns)
            ? studentAns.sort()
            : [studentAns];
          if (JSON.stringify(expected) === JSON.stringify(given)) {
            score += q.marks;
          }
        } else {
          // mcq_single
          if (String(q.correct_answer).trim() === String(studentAns).trim()) {
            score += q.marks;
          }
        }
      }
    });

    submission.score = score;
    submission.submitted_at = new Date().toISOString();

    if (!submission.disqualified) {
      submission.status = statusOverride || 'submitted';
    }

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        let dbStatus = submission.status;
        let dbDisqualReason = submission.disqualification_reason;

        if (submission.status === 'auto_submitted') {
          dbStatus = 'submitted';
          dbDisqualReason = 'AUTO_SUBMITTED';
        } else if (submission.status === 'incomplete') {
          dbStatus = 'flagged_for_review';
          dbDisqualReason = 'INCOMPLETE';
        }

        await this.supabase
          .from('submissions')
          .update({
            answers: submission.answers,
            score: submission.score,
            status: dbStatus,
            disqualification_reason: dbDisqualReason,
            time_taken_seconds: submission.time_taken_seconds,
            submitted_at: submission.submitted_at,
          })
          .eq('id', submission.id);
      } catch (err) {
        console.warn('Supabase update submission error:', err);
      }
    }

    return submission;
  }

  // --- VIOLATIONS OPERATIONS ---
  async recordViolation(
    submissionId: string,
    userId: string,
    type: Violation['type'],
    meta: Record<string, any> = {}
  ): Promise<{ violation: Violation; submission: Submission | null; isDisqualified: boolean }> {
    const violation: Violation = {
      id: uuidv4(),
      submission_id: submissionId,
      user_id: userId,
      type,
      timestamp: new Date().toISOString(),
      meta,
    };

    this.violations.push(violation);

    const submission = await this.getSubmission(submissionId);
    let isDisqualified = false;

    if (submission) {
      submission.violations_count = (submission.violations_count || 0) + 1;

      const quiz = this.quizzes.get(submission.quiz_id) || DEFAULT_QUIZ;
      if (submission.violations_count >= quiz.max_violations && !submission.disqualified) {
        submission.disqualified = true;
        submission.status = 'disqualified';
        submission.disqualification_reason = `Exceeded maximum allowable violations threshold (${quiz.max_violations} incidents recorded)`;
        isDisqualified = true;
      }
    }

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        await this.supabase.from('violations').insert(violation);
        if (submission) {
          await this.supabase
            .from('submissions')
            .update({
              violations_count: submission.violations_count,
              disqualified: submission.disqualified,
              status: submission.status,
              disqualification_reason: submission.disqualification_reason,
            })
            .eq('id', submission.id);
        }
      } catch (err) {
        console.warn('Supabase violation recording error:', err);
      }
    }

    return { violation, submission: submission || null, isDisqualified };
  }

  async getViolationsForSubmission(submissionId: string): Promise<Violation[]> {
    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('violations')
          .select('*')
          .eq('submission_id', submissionId)
          .order('timestamp', { ascending: true });
        if (!error && data) {
          return data as Violation[];
        }
      } catch (err) {
        console.warn('Supabase getViolations error:', err);
      }
    }
    return this.violations.filter((v) => v.submission_id === submissionId);
  }

  // --- PROCTOR SNAPSHOTS ---
  async recordSnapshot(
    submissionId: string,
    userId: string,
    imageUrl: string,
    flag: ProctorSnapshot['flag'] = 'normal'
  ): Promise<ProctorSnapshot> {
    const snapshot: ProctorSnapshot = {
      id: uuidv4(),
      submission_id: submissionId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      image_url: imageUrl,
      flag,
    };
    this.snapshots.push(snapshot);

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        await this.supabase.from('proctor_snapshots').insert(snapshot);
      } catch (err) {
        console.warn('Supabase snapshot insert error:', err);
      }
    }

    return snapshot;
  }

  async getSnapshotsForSubmission(submissionId: string): Promise<ProctorSnapshot[]> {
    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('proctor_snapshots')
          .select('*')
          .eq('submission_id', submissionId)
          .order('timestamp', { ascending: true });
        if (!error && data) {
          return data as ProctorSnapshot[];
        }
      } catch (err) {
        console.warn('Supabase getSnapshots error:', err);
      }
    }
    return this.snapshots.filter((s) => s.submission_id === submissionId);
  }

  // --- ADMIN STATS & LISTS ---
  async getAllSubmissions(quizId?: string): Promise<Submission[]> {
    if (this.isSupabaseEnabled && this.supabase) {
      try {
        let query = this.supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false });
        if (quizId) {
          query = query.eq('quiz_id', quizId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return (data as any[]).map((d) => this.mapDbSubmission(d));
        }
      } catch (err) {
        console.warn('Supabase getAllSubmissions error:', err);
      }
    }
    const list = Array.from(this.submissions.values());
    if (quizId) {
      return list.filter((s) => s.quiz_id === quizId);
    }
    return list;
  }

  async getAdminMetrics(quizId?: string) {
    const subs = await this.getAllSubmissions(quizId);
    const totalSubmissions = subs.length;
    const completed = subs.filter((s) => s.status === 'submitted' || s.status === 'auto_submitted');
    const disqualified = subs.filter((s) => s.disqualified);
    
    let totalViolations = this.violations.length;
    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { count, error } = await this.supabase
          .from('violations')
          .select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
          totalViolations = count;
        }
      } catch (e) {}
    }

    const avgScore =
      completed.length > 0
        ? Math.round(
            (completed.reduce((acc, s) => acc + s.score, 0) / completed.length) * 10
          ) / 10
        : 0;

    const completionRate =
      totalSubmissions > 0
        ? Math.round((completed.length / totalSubmissions) * 100)
        : 0;

    return {
      totalSubmissions,
      completedCount: completed.length,
      disqualifiedCount: disqualified.length,
      totalViolations,
      avgScore,
      completionRate,
      activeQuizzes: this.quizzes.size,
    };
  }
}

export const store = new DataStore();
