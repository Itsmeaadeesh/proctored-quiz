import { Router, Request, Response } from 'express';
import { store } from '../db/store';

const router = Router();

// Student Login / Verification
router.post('/student-login', async (req: Request, res: Response) => {
  try {
    const { rollNo, name, email, phone } = req.body;

    if (!rollNo || !name || !email || !phone) {
      return res.status(400).json({
        error: 'Roll number, candidate full name, email address, and phone number are all compulsory.',
      });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const user = await store.getOrCreateStudent(rollNo, name, email, cleanPhone);
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

// Admin Authentication with Secure Passcode
router.post('/admin-login', async (req: Request, res: Response) => {
  try {
    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({ error: 'Coordinator passcode is required.' });
    }

    const user = await store.verifyAdmin(passcode);
    if (!user) {
      return res.status(401).json({ error: 'Invalid coordinator passcode.' });
    }

    return res.json({
      user,
      role: 'admin',
      message: 'Admin access granted.',
    });
  } catch (err: any) {
    console.error('Error in admin-login:', err);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
});

export default router;
