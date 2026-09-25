import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_QUIZ, DEFAULT_QUESTIONS } from '../data/defaultQuiz';
import {
  User,
  Quiz,
  Question,
  SanitizedQuestion,
  Submission,
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
  async getOrCreateStudent(rollNo: string, name: string, email?: string): Promise<User> {
    const key = rollNo.trim().toUpperCase();
    const existing = this.users.get(key);
    if (existing) {
      if (name && existing.name !== name) {
        existing.name = name;
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
          role: 'student',
          created_at: new Date().toISOString(),
        };

        await this.supabase.from('users').insert({
          id: newUser.id,
          roll_no: newUser.roll_no,
          name: newUser.name,
          email: newUser.email,
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

  // --- SUBMISSION OPERATIONS ---
  async startSubmission(quizId: string, user: User): Promise<Submission> {
    // Check if an in-progress or existing submission exists
    const existing = Array.from(this.submissions.values()).find(
      (s) => s.quiz_id === quizId && s.user_id === user.id
    );

    if (existing) {
      return existing;
    }

    const quizQuestions = Array.from(this.questions.values()).filter(
      (q) => q.quiz_id === quizId
    );
    const totalMarks = quizQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const submission: Submission = {
      id: uuidv4(),
      quiz_id: quizId,
      user_id: user.id,
      student_name: user.name,
      student_roll_no: user.roll_no,
      answers: {},
      score: 0,
      total_marks: totalMarks,
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
    return this.submissions.get(submissionId) || null;
  }

  async submitAnswers(
    submissionId: string,
    answers: Record<string, string | string[]>,
    timeSpentSeconds: number
  ): Promise<Submission | null> {
    const submission = this.submissions.get(submissionId);
    if (!submission) return null;

    submission.answers = answers;
    submission.time_taken_seconds = timeSpentSeconds;

    // Calculate score
    const questions = Array.from(this.questions.values()).filter(
      (q) => q.quiz_id === submission.quiz_id
    );

    let score = 0;
    questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (studentAns !== undefined && studentAns !== null) {
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
      submission.status = 'submitted';
    }

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        await this.supabase
          .from('submissions')
          .update({
            answers: submission.answers,
            score: submission.score,
            status: submission.status,
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

    const submission = this.submissions.get(submissionId);
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
        if (submission && isDisqualified) {
          await this.supabase
            .from('submissions')
            .update({
              disqualified: true,
              status: 'disqualified',
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
    return this.snapshots.filter((s) => s.submission_id === submissionId);
  }

  // --- ADMIN STATS & LISTS ---
  async getAllSubmissions(quizId?: string): Promise<Submission[]> {
    const list = Array.from(this.submissions.values());
    if (quizId) {
      return list.filter((s) => s.quiz_id === quizId);
    }
    return list;
  }

  async getAdminMetrics(quizId?: string) {
    const subs = await this.getAllSubmissions(quizId);
    const totalSubmissions = subs.length;
    const completed = subs.filter((s) => s.status === 'submitted');
    const disqualified = subs.filter((s) => s.disqualified);
    const totalViolations = this.violations.length;

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
