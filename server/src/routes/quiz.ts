import { Router, Request, Response } from 'express';
import { store } from '../db/store';
import { SanitizedQuestion } from '../types';

const router = Router();

// Helper to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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

    // Find student in memory/db
    const user = (await store.getAllSubmissions()).find((s) => s.user_id === userId);
    // Or fetch through store
    const studentUser = {
      id: userId,
      name: req.body.userName || 'Student',
      roll_no: req.body.userRollNo || 'ROLL-TEMP',
      role: 'student' as const,
      created_at: new Date().toISOString(),
    };

    const submission = await store.startSubmission(quizId, studentUser);

    // Fetch questions sanitized (never send correct_answer to client)
    let questions = (await store.getQuestions(quizId, true)) as SanitizedQuestion[];

    if (quiz.shuffle_questions) {
      // Shuffle questions
      questions = shuffleArray(questions);
      // Shuffle options for MCQ questions
      questions = questions.map((q) => {
        if (q.options && q.options.length > 0) {
          return {
            ...q,
            options: shuffleArray(q.options),
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
    console.error('Error starting quiz:', err);
    return res.status(500).json({ error: 'Failed to start quiz session.' });
  }
});

export default router;
