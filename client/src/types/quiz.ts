export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  roll_no: string;
  email?: string;
  role: UserRole;
  created_at: string;
}

export type QuestionType = 'mcq_single' | 'mcq_multiple' | 'short_answer';

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correct_answer?: string | string[];
  marks: number;
  order_index: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  max_violations: number;
  shuffle_questions: boolean;
  allow_backtracking: boolean;
  is_active: boolean;
  created_at: string;
}

export type SubmissionStatus = 'in_progress' | 'submitted' | 'disqualified' | 'flagged_for_review';

export interface Submission {
  id: string;
  quiz_id: string;
  user_id: string;
  student_name: string;
  student_roll_no: string;
  answers: Record<string, string | string[]>;
  score: number;
  total_marks: number;
  status: SubmissionStatus;
  disqualified: boolean;
  disqualification_reason?: string;
  time_taken_seconds: number;
  violations_count: number;
  submitted_at?: string;
  created_at: string;
}

export type ViolationType =
  | 'FULLSCREEN_EXIT'
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'PRINT_SCREEN'
  | 'DEVTOOLS_SHORTCUT'
  | 'CLIPBOARD_PASTE'
  | 'CLIPBOARD_COPY'
  | 'CLIPBOARD_CUT'
  | 'CONTEXT_MENU'
  | 'ZOOM_ATTEMPT'
  | 'NO_FACE_DETECTED'
  | 'MULTIPLE_FACES_DETECTED';

export interface Violation {
  id: string;
  submission_id: string;
  user_id: string;
  type: ViolationType;
  timestamp: string;
  meta?: Record<string, any>;
}

export interface ProctorSnapshot {
  id: string;
  submission_id: string;
  user_id: string;
  timestamp: string;
  image_url: string;
  flag: 'normal' | 'no_face' | 'multiple_faces' | 'low_light';
}

export interface AdminMetrics {
  totalSubmissions: number;
  completedCount: number;
  disqualifiedCount: number;
  totalViolations: number;
  avgScore: number;
  completionRate: number;
  activeQuizzes: number;
}
