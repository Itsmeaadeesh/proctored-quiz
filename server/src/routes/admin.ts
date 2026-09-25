import { Router, Request, Response } from 'express';
import { store } from '../db/store';

const router = Router();

// Secure Admin Passcode Authentication Middleware
router.use((req: Request, res: Response, next) => {
  const passcode = (req.headers['x-admin-passcode'] as string) || (req.query.passcode as string);
  const expected = process.env.ADMIN_PASSCODE || 'RHAGGITS1234@1234*#ZYX';
  if (!passcode || passcode.trim() !== expected) {
    return res.status(401).json({ error: 'Unauthorized: Valid coordinator passcode is required.' });
  }
  next();
});

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

// 2b. Official Ranked Leaderboard
router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const submissions = await store.getAllSubmissions();

    // Tie-breaker ranking logic:
    // 1. Non-disqualified candidates ranked above disqualified
    // 2. Completed / Auto-submitted ranked above Incomplete
    // 3. Highest Score descending
    // 4. Shortest Time Taken ascending (faster completion wins)
    // 5. Fewest Violations ascending
    const ranked = submissions
      .filter((s) => s.status !== 'in_progress')
      .sort((a, b) => {
        if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
        const aInc = a.status === 'incomplete';
        const bInc = b.status === 'incomplete';
        if (aInc !== bInc) return aInc ? 1 : -1;
        if (b.score !== a.score) return b.score - a.score;
        const aTime = a.time_taken_seconds || 3600;
        const bTime = b.time_taken_seconds || 3600;
        if (aTime !== bTime) return aTime - bTime;
        return (a.violations_count || 0) - (b.violations_count || 0);
      })
      .map((s, idx) => ({
        rank: idx + 1,
        ...s,
      }));

    return res.json(ranked);
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    return res.status(500).json({ error: 'Could not fetch leaderboard.' });
  }
});

// 2c. Export Official Leaderboard CSV
router.get('/export-leaderboard-csv', async (_req: Request, res: Response) => {
  try {
    const submissions = await store.getAllSubmissions();
    const ranked = submissions
      .filter((s) => s.status !== 'in_progress')
      .sort((a, b) => {
        if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
        const aInc = a.status === 'incomplete';
        const bInc = b.status === 'incomplete';
        if (aInc !== bInc) return aInc ? 1 : -1;
        if (b.score !== a.score) return b.score - a.score;
        const aTime = a.time_taken_seconds || 3600;
        const bTime = b.time_taken_seconds || 3600;
        if (aTime !== bTime) return aTime - bTime;
        return (a.violations_count || 0) - (b.violations_count || 0);
      });

    let csv = 'Rank,Roll Number,Student Name,College Email,Phone Number,Score,Total Marks,Percentage,Time Taken,Violations Count,Status,Disqualified,Submitted At\n';
    ranked.forEach((s, idx) => {
      const mins = Math.floor((s.time_taken_seconds || 0) / 60);
      const secs = (s.time_taken_seconds || 0) % 60;
      const timeStr = `${mins}m ${secs}s`;
      const pct = s.total_marks > 0 ? ((s.score / s.total_marks) * 100).toFixed(1) + '%' : '0%';
      let statusStr = s.disqualified ? 'Disqualified' : s.status === 'auto_submitted' ? 'Auto-submitted' : s.status === 'incomplete' ? 'Incomplete' : 'Completed';

      const row = [
        idx + 1,
        `"${s.student_roll_no || ''}"`,
        `"${s.student_name || ''}"`,
        `"${s.student_email || ''}"`,
        `"${s.student_phone || ''}"`,
        s.score,
        s.total_marks,
        pct,
        `"${timeStr}"`,
        s.violations_count || 0,
        `"${statusStr}"`,
        s.disqualified ? 'YES' : 'NO',
        `"${s.submitted_at || s.created_at}"`,
      ].join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="RHA_DAY_26_Official_Leaderboard.csv"');
    return res.send(csv);
  } catch (err: any) {
    console.error('Error generating leaderboard CSV:', err);
    return res.status(500).json({ error: 'Could not generate leaderboard CSV.' });
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
      let displayStatus = 'In Progress';
      if (s.disqualified) {
        displayStatus = 'Disqualified';
      } else if (s.status === 'auto_submitted') {
        displayStatus = 'Auto-submitted';
      } else if (s.status === 'incomplete') {
        displayStatus = 'Incomplete';
      } else if (s.status === 'submitted') {
        displayStatus = 'Completed';
      }

      const row = [
        `"${s.student_roll_no || ''}"`,
        `"${s.student_name || ''}"`,
        `"${s.student_email || ''}"`,
        `"${s.student_phone || ''}"`,
        s.score,
        s.total_marks,
        percentage,
        s.violations_count || 0,
        `"${displayStatus}"`,
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
