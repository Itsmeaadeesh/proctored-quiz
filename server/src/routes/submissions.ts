import { Router, Request, Response } from 'express';
import { store } from '../db/store';

const router = Router();

// Submit answers and compute final score
router.post('/:submissionId/submit', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { answers, timeSpentSeconds } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers payload is required.' });
    }

    const updated = await store.submitAnswers(
      submissionId,
      answers,
      timeSpentSeconds || 0
    );

    if (!updated) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const violations = await store.getViolationsForSubmission(submissionId);

    return res.json({
      success: true,
      submission: updated,
      violationsCount: violations.length,
      message: updated.disqualified
        ? 'Quiz submitted under disqualification.'
        : 'Quiz submitted successfully.',
    });
  } catch (err: any) {
    console.error('Error submitting quiz answers:', err);
    return res.status(500).json({ error: 'Failed to process submission.' });
  }
});

// Get individual submission summary
router.get('/:submissionId', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const submission = await store.getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const violations = await store.getViolationsForSubmission(submissionId);

    return res.json({
      submission,
      violations,
    });
  } catch (err: any) {
    console.error('Error getting submission:', err);
    return res.status(500).json({ error: 'Failed to fetch submission.' });
  }
});

export default router;
