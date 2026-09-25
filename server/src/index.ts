import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import violationRoutes from './routes/violations';
import submissionRoutes from './routes/submissions';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// High limit for base64 proctor snapshot uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    event: 'RHA DAY 26',
    institution: 'Gyan Ganga Institute of Technology & Sciences (GGITS)',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server only in standalone mode (not in Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Red Hat Proctored Quiz API Server running on port ${PORT}`);
    console.log(`📍 Event: RHA DAY 26 | Gyan Ganga Institute of Technology & Sciences`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

export default app;

