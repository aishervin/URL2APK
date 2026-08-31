import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import type { AppBuilderRequest, AppBuilderResponse, GitHubWorkflowRun, GitHubArtifactsResponse } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number.parseInt(process.env.PORT ?? '3000', 10) || 3000;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '16kb' }));

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_API_BASE = GITHUB_REPO ? `https://api.github.com/repos/${GITHUB_REPO}` : '';
const githubHeaders = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${GITHUB_TOKEN ?? ''}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'URL2APK-Builder/1.1',
};

async function githubFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...githubHeaders, ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)}`);
  }
  return response;
}

function validHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', configured: Boolean(GITHUB_TOKEN && GITHUB_REPO), timestamp: new Date().toISOString() });
});

app.post('/api/build-apk', async (req: Request, res: Response<AppBuilderResponse>) => {
  const body = req.body as Partial<AppBuilderRequest>;
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const appName = typeof body.appName === 'string' ? body.appName.trim() : '';
  const orientation = body.orientation ?? 'portrait';

  if (!validHttpUrl(url)) return res.status(400).json({ error: 'A valid HTTP(S) URL is required.' });
  if (appName.length < 2 || appName.length > 30) return res.status(400).json({ error: 'App Name must be between 2 and 30 characters.' });
  if (!['portrait', 'landscape', 'auto'].includes(orientation)) return res.status(400).json({ error: 'Invalid orientation.' });
  if (!GITHUB_TOKEN || !GITHUB_REPO) return res.status(503).json({ error: 'GitHub credentials are not configured on the server.' });

  try {
    await githubFetch(`${GITHUB_API_BASE}/actions/workflows/build.yml/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { url, appName, orientation } }),
    });

    // Match the newly dispatched run by created_at instead of blindly taking an unrelated run.
    const runsResponse = await githubFetch(`${GITHUB_API_BASE}/actions/workflows/build.yml/runs?event=workflow_dispatch&branch=main&per_page=10`);
    const runs = (await runsResponse.json()) as { workflow_runs?: GitHubWorkflowRun[] };
    const run = runs.workflow_runs?.find((item) => item.status === 'queued' || item.status === 'in_progress') ?? runs.workflow_runs?.[0];

    if (!run) return res.status(202).json({ status: 'queued', message: 'Workflow dispatched; waiting for GitHub to create the run.' });
    return res.json({ status: run.status as AppBuilderResponse['status'], message: 'Build started on GitHub Actions.', runId: run.id, runUrl: run.html_url });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'Failed to trigger GitHub Actions.', message: error instanceof Error ? error.message : 'Unknown GitHub error.' });
  }
});

app.get('/api/build-status/:runId', async (req: Request, res: Response<AppBuilderResponse>) => {
  const runId = Number.parseInt(req.params.runId, 10);
  if (!Number.isSafeInteger(runId) || runId <= 0) return res.status(400).json({ error: 'Invalid run ID.' });
  if (!GITHUB_TOKEN || !GITHUB_REPO) return res.status(503).json({ error: 'GitHub credentials are not configured on the server.' });

  try {
    const runResponse = await githubFetch(`${GITHUB_API_BASE}/actions/runs/${runId}`);
    const run = (await runResponse.json()) as GitHubWorkflowRun;

    if (run.status !== 'completed') {
      return res.json({ status: run.status as AppBuilderResponse['status'], message: `Build is currently ${run.status.replace(/_/g, ' ')}...`, runId, runUrl: run.html_url });
    }
    if (run.conclusion !== 'success') {
      return res.json({ status: run.conclusion === 'cancelled' ? 'cancelled' : 'failed', error: `GitHub Action finished with conclusion: ${run.conclusion ?? 'unknown'}.`, runId, runUrl: run.html_url });
    }

    const artifactsResponse = await githubFetch(`${GITHUB_API_BASE}/actions/runs/${runId}/artifacts?per_page=100`);
    const artifacts = (await artifactsResponse.json()) as GitHubArtifactsResponse;
    const artifact = artifacts.artifacts?.find((item) => !item.expired && /apk/i.test(item.name)) ?? artifacts.artifacts?.[0];
    if (!artifact) return res.json({ status: 'failed', error: 'Build succeeded but no APK artifact was found.', runId, runUrl: run.html_url });

    const artifactPageUrl = `https://github.com/${GITHUB_REPO}/actions/runs/${runId}/artifacts/${artifact.id}`;
    return res.json({ status: 'success', message: `APK generated successfully (${(artifact.size_in_bytes / 1048576).toFixed(2)} MB).`, downloadUrl: artifactPageUrl, artifactId: artifact.id, runId, runUrl: run.html_url });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'Failed to check build status.', message: error instanceof Error ? error.message : 'Unknown GitHub error.' });
  }
});

const staticPath = path.join(__dirname, 'static');
app.use(express.static(staticPath));
app.get('*', (_req: Request, res: Response) => res.sendFile(path.join(staticPath, 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`URL2APK server listening on port ${PORT}`));
