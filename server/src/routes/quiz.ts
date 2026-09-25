import { Router, Request, Response } from 'express';
import { store } from '../db/store';
import { SanitizedQuestion } from '../types';

const router = Router();

// Deterministic 32-bit PRNG (Mulberry32) for reproducible per-student randomization
function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get active quiz info (without questions)
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const quiz = await store.getActiveQuiz();
    const questions = await store.getQuestions(quiz.id, true);

    return res.json({
      quiz,
      questionCount: questions.length,
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
    });
  } catch (err: any) {
    console.error('Error fetching active quiz:', err);
    return res.status(500).json({ error: 'Could not fetch quiz info.' });
  }
});

// Start or Resume Quiz session
router.post('/:quizId/start', async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required to start quiz.' });
    }

    const quiz = await store.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    const studentUser = {
      id: userId,
      name: req.body.userName || 'Student',
      roll_no: req.body.userRollNo || 'ROLL-TEMP',
      email: req.body.userEmail || '',
      phone: req.body.userPhone || '',
      role: 'student' as const,
      created_at: new Date().toISOString(),
    };

    const submission = await store.startSubmission(quizId, studentUser);

    // Fetch questions sanitized (never send correct_answer to client)
    let questions = (await store.getQuestions(quizId, true)) as SanitizedQuestion[];

    if (quiz.shuffle_questions) {
      // Seed based on submission id and user id: unique per student, consistent on refresh
      const studentSeed = stringToSeed(`${submission.id}_${submission.user_id}`);
      const rng = mulberry32(studentSeed);

      // Randomize question order per student
      questions = seededShuffle(questions, rng);

      // Randomize option order per question per student
      questions = questions.map((q) => {
        if (q.options && q.options.length > 0) {
          const qRng = mulberry32(stringToSeed(`${submission.id}_${q.id}`));
          return {
            ...q,
            options: seededShuffle(q.options, qRng),
          };
        }
        return q;
      });
    }

    return res.json({
      submission,
      quiz,
      questions,
    });
  } catch (err: any) {
    if (err.code === 'ATTEMPT_LIMIT_REACHED' || err.code === 'WINDOW_EXPIRED') {
      return res.status(403).json({
        error: err.message,
        code: err.code,
        submission: err.submission,
        locked: true,
      });
    }
    console.error('Error starting quiz:', err);
    return res.status(500).json({ error: 'Failed to start quiz session.' });
  }
});

export default router;
