import { Router, Request, Response } from 'express';
import { store } from '../db/store';

const router = Router();

// Student Login / Verification
router.post('/student-login', async (req: Request, res: Response) => {
  try {
    const { rollNo, name, email } = req.body;

    if (!rollNo || !name) {
      return res.status(400).json({ error: 'Roll number and student name are required.' });
    }

    const user = await store.getOrCreateStudent(rollNo, name, email);
    const activeQuiz = await store.getActiveQuiz();

    return res.json({
      user,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      message: 'Student authenticated successfully.',
    });
  } catch (err: any) {
    console.error('Error in student-login:', err);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
});

// Admin Direct Login (Passcode-free coordinator access)
router.post('/admin-login', async (_req: Request, res: Response) => {
  try {
    const user = await store.getAdminUser();

    return res.json({
      user,
      role: 'admin',
      message: 'Admin access granted.',
    });
  } catch (err: any) {
    console.error('Error in admin-login:', err);
    return res.status(500).json({ error: 'Admin login failed.' });
  }
});

export default router;
