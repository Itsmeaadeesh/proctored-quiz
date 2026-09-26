import { Router, Request, Response } from 'express';
import { store } from '../db/store';

const router = Router();

// Submit answers and compute final score
router.post('/:submissionId/submit', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { answers, timeSpentSeconds, status } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers payload is required.' });
    }

    const updated = await store.submitAnswers(
      submissionId,
      answers,
      timeSpentSeconds || 0,
      status
    );

    if (!updated) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    // Strip score & answer keys so students cannot see marks even via DevTools inspection
    const studentSafeSubmission = {
      id: updated.id,
      quiz_id: updated.quiz_id,
      user_id: updated.user_id,
      student_name: updated.student_name,
      student_roll_no: updated.student_roll_no,
      student_email: updated.student_email,
      student_phone: updated.student_phone,
      status: updated.status,
      disqualified: updated.disqualified,
      disqualification_reason: updated.disqualification_reason,
      time_taken_seconds: updated.time_taken_seconds,
      created_at: updated.created_at,
      submitted_at: updated.submitted_at,
      total_marks: updated.total_marks,
    };

    return res.json({
      success: true,
      submission: studentSafeSubmission,
      message: updated.disqualified
        ? 'Quiz submitted under disqualification.'
        : 'Quiz submitted successfully.',
    });
  } catch (err: any) {
    console.error('Error submitting quiz answers:', err);
    return res.status(500).json({ error: 'Failed to process submission.' });
  }
});

// Save draft answers periodically or upon option click
router.post('/:submissionId/draft', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { answers } = req.body;

    if (answers && typeof answers === 'object') {
      await store.saveDraftAnswers(submissionId, answers);
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error saving draft answers:', err);
    return res.status(500).json({ error: 'Failed to save draft answers.' });
  }
});

// Get individual submission summary (Participant receipt - strictly withholding score & answers)
router.get('/:submissionId', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const submission = await store.getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    // Strip score & answer keys so students cannot see marks even via DevTools inspection
    const studentSafeSubmission = {
      id: submission.id,
      quiz_id: submission.quiz_id,
      user_id: submission.user_id,
      student_name: submission.student_name,
      student_roll_no: submission.student_roll_no,
      student_email: submission.student_email,
      student_phone: submission.student_phone,
      status: submission.status,
      disqualified: submission.disqualified,
      disqualification_reason: submission.disqualification_reason,
      time_taken_seconds: submission.time_taken_seconds,
      created_at: submission.created_at,
      submitted_at: submission.submitted_at,
      total_marks: submission.total_marks,
    };

    return res.json({
      submission: studentSafeSubmission,
    });
  } catch (err: any) {
    console.error('Error getting submission:', err);
    return res.status(500).json({ error: 'Failed to fetch submission.' });
  }
});

export default router;
