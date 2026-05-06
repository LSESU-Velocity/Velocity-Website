import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeHandler from '../api/analyze.ts';
import analyzeStreamHandler from '../api/analyze-stream.ts';
import generateArtifactsHandler from '../api/generate-artifacts.ts';
import mutateWidgetHandler from '../api/mutate-widget.ts';
import automationIntakeChatHandler from '../api/automation-intake-chat.ts';
import automationIntakeEmailStartHandler from '../api/automation-intake-email-start.ts';
import automationIntakeEmailStatusHandler from '../api/automation-intake-email-status.ts';
import automationIntakeEmailVerifyHandler from '../api/automation-intake-email-verify.ts';
import automationIntakeSubmitHandler from '../api/automation-intake-submit.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const port = Number(process.env.LOCAL_API_PORT || 8787);
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.all('/api/analyze', async (req, res) => {
  await analyzeHandler(req as any, res as any);
});

app.all('/api/analyze-stream', async (req, res) => {
  await analyzeStreamHandler(req as any, res as any);
});

app.all('/api/generate-artifacts', async (req, res) => {
  await generateArtifactsHandler(req as any, res as any);
});

app.all('/api/mutate-widget', async (req, res) => {
  await mutateWidgetHandler(req as any, res as any);
});

app.all('/api/automation-intake-chat', async (req, res) => {
  await automationIntakeChatHandler(req as any, res as any);
});

app.all('/api/automation-intake-email-start', async (req, res) => {
  await automationIntakeEmailStartHandler(req as any, res as any);
});

app.all('/api/automation-intake-email-status', async (req, res) => {
  await automationIntakeEmailStatusHandler(req as any, res as any);
});

app.all('/api/automation-intake-email-verify', async (req, res) => {
  await automationIntakeEmailVerifyHandler(req as any, res as any);
});

app.all('/api/automation-intake-submit', async (req, res) => {
  await automationIntakeSubmitHandler(req as any, res as any);
});

app.listen(port, () => {
  console.log(`Local API server listening on http://localhost:${port}`);
});
