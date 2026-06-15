import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load the root .env regardless of the process working directory.
// The server is launched from the `server/` workspace, so a bare
// `dotenv/config` would look for `server/.env` and miss the root file.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { breakdownAssignment } from './openai/breakdown.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Take raw assignment text + a due date and return an AI-generated breakdown
 * into prioritized tasks. Does not persist anything yet.
 *
 * Request body:  { rawText: string, dueDate?: string }
 * Response body: { title: string, tasks: [...] }
 */
app.post('/api/assignments/breakdown', async (req, res) => {
  const { rawText, dueDate } = req.body ?? {};

  if (typeof rawText !== 'string' || !rawText.trim()) {
    return res.status(400).json({ error: 'rawText is required and must be a non-empty string.' });
  }

  try {
    const result = await breakdownAssignment({ rawText, dueDate });
    return res.status(200).json(result);
  } catch (err) {
    console.error('Failed to break down assignment:', err);

    if (err.message?.includes('OPENAI_API_KEY')) {
      return res.status(500).json({ error: 'Server is missing its OpenAI configuration.' });
    }
    return res.status(502).json({ error: 'Failed to generate an assignment breakdown.' });
  }
});

app.listen(PORT, () => {
  console.log(`Assignment Breakdown server listening on http://localhost:${PORT}`);
});
