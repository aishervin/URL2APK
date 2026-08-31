import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;

const headers = {
  'Accept': 'application/vnd.github.v3+json',
  'Authorization': `token ${GITHUB_TOKEN}`,
  'User-Agent': 'Web2APK-Builder'
};

app.post('/api/build-apk', async (req, res) => {
  const { url, appName } = req.body;

  if (!url || !appName) {
    return res.status(400).json({ error: 'URL and App Name are required' });
  }

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(503).json({ error: 'GitHub credentials missing in environment variables.' });
  }

  try {
    // 1. Trigger the workflow
    const dispatchRes = await fetch(`${GITHUB_API_BASE}/actions/workflows/build.yml/dispatches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: 'main',
        inputs: { url, appName }
      })
    });

    if (!dispatchRes.ok) {
      const err = await dispatchRes.text();
      console.error('Dispatch failed:', err);
      return res.status(500).json({ error: 'Failed to trigger build on GitHub.' });
    }

    // 2. Wait a brief moment for GitHub to create the run
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Fetch the latest run
    const runsRes = await fetch(`${GITHUB_API_BASE}/actions/workflows/build.yml/runs?per_page=1`, { headers });
    const runsData = await runsRes.json() as any;

    if (!runsData.workflow_runs || runsData.workflow_runs.length === 0) {
      return res.status(500).json({ error: 'Workflow triggered but could not find the run ID.' });
    }

    const runId = runsData.workflow_runs[0].id;

    res.json({
      status: 'pending',
      message: 'Build started on GitHub Actions',
      runId: runId
    });
  } catch (error: any) {
    console.error('Error building APK:', error);
    res.status(500).json({ error: 'Internal server error while communicating with GitHub.' });
  }
});

app.get('/api/build-status/:runId', async (req, res) => {
  const { runId } = req.params;

  try {
    const runRes = await fetch(`${GITHUB_API_BASE}/actions/runs/${runId}`, { headers });
    const runData = await runRes.json() as any;

    if (runData.status !== 'completed') {
      return res.json({
        status: runData.status, // "queued" or "in_progress"
        message: `Build is currently ${runData.status.replace('_', ' ')}...`
      });
    }

    if (runData.conclusion !== 'success') {
      return res.json({
        status: 'failed',
        error: `GitHub Action failed with conclusion: ${runData.conclusion}`
      });
    }

    // Fetch artifacts
    const artifactsRes = await fetch(`${GITHUB_API_BASE}/actions/runs/${runId}/artifacts`, { headers });
    const artifactsData = await artifactsRes.json() as any;

    if (!artifactsData.artifacts || artifactsData.artifacts.length === 0) {
      return res.json({
        status: 'failed',
        error: 'Build succeeded but no APK artifact was found.'
      });
    }

    const artifactUrl = artifactsData.artifacts[0].archive_download_url;

    res.json({
      status: 'success',
      message: 'APK generated successfully!',
      downloadUrl: `/api/download-artifact?url=${encodeURIComponent(artifactUrl)}` // Proxy the download
    });

  } catch (error: any) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Internal server error while checking status.' });
  }
});

// We need to proxy the artifact download because the URL expires and requires authentication
app.get('/api/download-artifact', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send('URL required');

  try {
    const downloadRes = await fetch(url, { headers });
    if (!downloadRes.ok) {
      return res.status(downloadRes.status).send('Failed to download artifact from GitHub');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=app-release.zip');
    downloadRes.body.pipe(res);
  } catch (err) {
    res.status(500).send('Error streaming artifact');
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
