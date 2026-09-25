import { Router, Request, Response } from 'express';
import { store } from '../db/store';
import { ViolationType } from '../types';

const router = Router();

// Log an anti-cheating violation incident
router.post('/', async (req: Request, res: Response) => {
  try {
    const { submissionId, userId, type, meta } = req.body;

    if (!submissionId || !userId || !type) {
      return res.status(400).json({ error: 'Missing required violation parameters.' });
    }

    const { violation, submission, isDisqualified } = await store.recordViolation(
      submissionId,
      userId,
      type as ViolationType,
      meta || {}
    );

    return res.json({
      success: true,
      violation,
      violationsCount: submission?.violations_count || 0,
      isDisqualified,
      reason: submission?.disqualification_reason,
    });
  } catch (err: any) {
    console.error('Error logging violation:', err);
    return res.status(500).json({ error: 'Failed to record violation.' });
  }
});

// Save a proctor webcam snapshot
router.post('/snapshot', async (req: Request, res: Response) => {
  try {
    const { submissionId, userId, imageUrl, flag } = req.body;

    if (!submissionId || !userId || !imageUrl) {
      return res.status(400).json({ error: 'Missing snapshot parameters.' });
    }

    const snapshot = await store.recordSnapshot(submissionId, userId, imageUrl, flag || 'normal');

    return res.json({
      success: true,
      snapshotId: snapshot.id,
    });
  } catch (err: any) {
    console.error('Error recording snapshot:', err);
    return res.status(500).json({ error: 'Failed to save snapshot.' });
  }
});

export default router;
