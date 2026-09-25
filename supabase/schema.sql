-- =========================================================================
-- Supabase / PostgreSQL Schema for Proctored Quiz Taker
-- Event: RHA DAY 26 (Red Hat Academy Day 26)
-- Institution: Gyan Ganga Institute of Technology & Sciences (GGITS)
-- =========================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT,
    roll_no TEXT UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on roll_no and email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_roll_no ON public.users(roll_no);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 15,
    max_violations INT NOT NULL DEFAULT 3,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    allow_backtracking BOOLEAN NOT NULL DEFAULT true,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'mcq_single' CHECK (type IN ('mcq_single', 'mcq_multiple', 'short_answer')),
    options JSONB, -- Array of string options, e.g. ["RHEL 9", "Ubuntu", "Fedora", "CentOS"]
    correct_answer JSONB NOT NULL, -- String or array of correct string answers
    marks INT NOT NULL DEFAULT 1,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);

-- 4. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_name TEXT,
    student_roll_no TEXT,
    student_email TEXT,
    student_phone TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- Map: { [question_id]: selectedOption | answerText }
    score NUMERIC NOT NULL DEFAULT 0,
    total_marks NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'disqualified', 'flagged_for_review')),
    disqualified BOOLEAN NOT NULL DEFAULT false,
    disqualification_reason TEXT,
    time_taken_seconds INT DEFAULT 0,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_quiz_user ON public.submissions(quiz_id, user_id);

-- 5. VIOLATIONS TABLE (Anti-cheating event log)
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g. FULLSCREEN_EXIT, TAB_SWITCH, WINDOW_BLUR, PRINT_SCREEN, DEVTOOLS_KEY, CLIPBOARD_COPY, CLIPBOARD_PASTE
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    meta JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_violations_submission_id ON public.violations(submission_id);
CREATE INDEX IF NOT EXISTS idx_violations_type ON public.violations(type);

-- 6. PROCTOR SNAPSHOTS TABLE (Webcam periodic verification captures)
CREATE TABLE IF NOT EXISTS public.proctor_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    image_url TEXT NOT NULL,
    flag TEXT DEFAULT 'normal' CHECK (flag IN ('normal', 'no_face', 'multiple_faces', 'low_light'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_submission ON public.proctor_snapshots(submission_id);

-- =========================================================================
-- Row Level Security (RLS) Policies
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctor_snapshots ENABLE ROW LEVEL SECURITY;

-- Read policies for public/authenticated quiz taking
CREATE POLICY "Quizzes are viewable by everyone" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Questions are viewable by authenticated users" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can create submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own submissions" ON public.submissions FOR UPDATE USING (true);
CREATE POLICY "Submissions viewable" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Violations insertable" ON public.violations FOR INSERT WITH CHECK (true);
CREATE POLICY "Violations viewable" ON public.violations FOR SELECT USING (true);
CREATE POLICY "Snapshots insertable" ON public.proctor_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Snapshots viewable" ON public.proctor_snapshots FOR SELECT USING (true);
