import { Router, Request, Response } from 'express';
import { store } from '../db/store';

const router = Router();

// 1. Overview Metrics
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await store.getAdminMetrics();
    return res.json(metrics);
  } catch (err: any) {
    console.error('Error fetching admin metrics:', err);
    return res.status(500).json({ error: 'Could not fetch metrics.' });
  }
});

// 2. All Submissions list
router.get('/submissions', async (_req: Request, res: Response) => {
  try {
    const submissions = await store.getAllSubmissions();
    return res.json(submissions);
  } catch (err: any) {
    console.error('Error fetching submissions:', err);
    return res.status(500).json({ error: 'Could not fetch submissions.' });
  }
});

// 3. Single Student Detailed Audit & Timeline
router.get('/submissions/:submissionId/details', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const submission = await store.getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const violations = await store.getViolationsForSubmission(submissionId);
    const snapshots = await store.getSnapshotsForSubmission(submissionId);
    const questions = await store.getQuestions(submission.quiz_id, false);

    return res.json({
      submission,
      violations,
      snapshots,
      questions,
    });
  } catch (err: any) {
    console.error('Error fetching submission details:', err);
    return res.status(500).json({ error: 'Could not fetch submission details.' });
  }
});

// 4. Export Results as CSV
router.get('/export-csv', async (_req: Request, res: Response) => {
  try {
    const submissions = await store.getAllSubmissions();

    // Generate CSV Header
    let csv =
      'Roll Number,Student Name,College Email,Phone Number,Score,Total Marks,Percentage,Violations Count,Status,Time Spent (Seconds),Disqualified,Submitted At\n';

    submissions.forEach((s) => {
      const percentage =
        s.total_marks > 0 ? ((s.score / s.total_marks) * 100).toFixed(1) + '%' : '0%';
      const row = [
        `"${s.student_roll_no || ''}"`,
        `"${s.student_name || ''}"`,
        `"${s.student_email || ''}"`,
        `"${s.student_phone || ''}"`,
        s.score,
        s.total_marks,
        percentage,
        s.violations_count || 0,
        `"${s.status}"`,
        s.time_taken_seconds || 0,
        s.disqualified ? 'YES' : 'NO',
        `"${s.submitted_at || s.created_at}"`,
      ].join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="RHA_DAY_26_Results.csv"');
    return res.send(csv);
  } catch (err: any) {
    console.error('Error generating CSV export:', err);
    return res.status(500).json({ error: 'Could not generate CSV export.' });
  }
});

// 5. Update Quiz Configuration
router.put('/quiz/:quizId', async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { duration_minutes, max_violations, shuffle_questions, allow_backtracking, title } = req.body;

    const updated = await store.updateQuiz(quizId, {
      ...(duration_minutes !== undefined && { duration_minutes: Number(duration_minutes) }),
      ...(max_violations !== undefined && { max_violations: Number(max_violations) }),
      ...(shuffle_questions !== undefined && { shuffle_questions: Boolean(shuffle_questions) }),
      ...(allow_backtracking !== undefined && { allow_backtracking: Boolean(allow_backtracking) }),
      ...(title && { title: String(title) }),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    return res.json({ success: true, quiz: updated });
  } catch (err: any) {
    console.error('Error updating quiz config:', err);
    return res.status(500).json({ error: 'Could not update quiz settings.' });
  }
});

// 6. Add Question to Quiz
router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { quizId, text, type, options, correct_answer, marks } = req.body;

    if (!quizId || !text || !correct_answer) {
      return res.status(400).json({ error: 'quizId, text, and correct_answer are required.' });
    }

    const newQuestion = await store.addQuestion({
      quiz_id: quizId,
      text,
      type: type || 'mcq_single',
      options: options || [],
      correct_answer,
      marks: marks ? Number(marks) : 2,
      order_index: Date.now(),
    });

    return res.json({ success: true, question: newQuestion });
  } catch (err: any) {
    console.error('Error adding question:', err);
    return res.status(500).json({ error: 'Failed to add question.' });
  }
});

export default router;
