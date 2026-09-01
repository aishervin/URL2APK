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
const PORT = 3000;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '16kb' }));

function getGitHubConfig(req: Request) {
  const token = (req.headers['x-github-token'] as string)?.trim() || process.env.GITHUB_TOKEN;
  const repo = (req.headers['x-github-repo'] as string)?.trim() || process.env.GITHUB_REPO;
  const apiBase = repo ? `https://api.github.com/repos/${repo}` : '';
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token ?? ''}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'URL2APK-Builder/1.1',
  };
  return { token, repo, apiBase, headers };
}

async function githubFetch(url: string, options: RequestInit = {}, headers: Record<string, string>) {
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    let errorMsg = `GitHub API ${response.status}: ${body.slice(0, 300)}`;
    if (response.status === 401) {
      errorMsg = 'GitHub API 401 Unauthorized: Invalid or expired GitHub Personal Access Token. Please check your token in Settings.';
    } else if (response.status === 404) {
      errorMsg = 'GitHub API 404 Not Found: Repository or workflow build.yml not found. Please check your "owner/repo" setting.';
    }
    throw new Error(errorMsg);
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

app.get('/api/health', (req: Request, res: Response) => {
  const { token, repo } = getGitHubConfig(req);
  res.json({ status: 'ok', configured: Boolean(token && repo), timestamp: new Date().toISOString() });
});

app.post('/api/build-apk', async (req: Request, res: Response<AppBuilderResponse>) => {
  const body = req.body as Partial<AppBuilderRequest>;
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const appName = typeof body.appName === 'string' ? body.appName.trim() : '';
  const orientation = body.orientation ?? 'portrait';
  const { token, repo, apiBase, headers } = getGitHubConfig(req);

  if (!validHttpUrl(url)) return res.status(400).json({ error: 'A valid HTTP(S) URL is required.' });
  if (appName.length < 2 || appName.length > 30) return res.status(400).json({ error: 'App Name must be between 2 and 30 characters.' });
  if (!['portrait', 'landscape', 'auto'].includes(orientation)) return res.status(400).json({ error: 'Invalid orientation.' });
  if (!token || !repo) return res.status(401).json({ error: 'GitHub credentials (Token & Repository) are required. Please configure them in Settings.' });

  try {
    await githubFetch(`${apiBase}/actions/workflows/build.yml/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { url, appName, orientation } }),
    }, headers);

    const runsResponse = await githubFetch(`${apiBase}/actions/workflows/build.yml/runs?event=workflow_dispatch&branch=main&per_page=10`, {}, headers);
    const runs = (await runsResponse.json()) as { workflow_runs?: GitHubWorkflowRun[] };
    const run = runs.workflow_runs?.find((item) => item.status === 'queued' || item.status === 'in_progress') ?? runs.workflow_runs?.[0];

    if (!run) return res.status(202).json({ status: 'queued', message: 'Workflow dispatched; waiting for GitHub to create the run.' });
    return res.json({ status: run.status as AppBuilderResponse['status'], message: 'Build started on GitHub Actions.', runId: run.id, runUrl: run.html_url });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: error instanceof Error ? error.message : 'Failed to trigger GitHub Actions.' });
  }
});

app.get('/api/build-status/:runId', async (req: Request, res: Response<AppBuilderResponse>) => {
  const runId = Number.parseInt(req.params.runId, 10);
  if (!Number.isSafeInteger(runId) || runId <= 0) return res.status(400).json({ error: 'Invalid run ID.' });
  const { token, repo, apiBase, headers } = getGitHubConfig(req);
  if (!token || !repo) return res.status(401).json({ error: 'GitHub credentials are not configured.' });

  try {
    const runResponse = await githubFetch(`${apiBase}/actions/runs/${runId}`, {}, headers);
    const run = (await runResponse.json()) as GitHubWorkflowRun;

    if (run.status !== 'completed') {
      return res.json({ status: run.status as AppBuilderResponse['status'], message: `Build is currently ${run.status.replace(/_/g, ' ')}...`, runId, runUrl: run.html_url });
    }
    if (run.conclusion !== 'success') {
      return res.json({ status: run.conclusion === 'cancelled' ? 'cancelled' : 'failed', error: `GitHub Action finished with conclusion: ${run.conclusion ?? 'unknown'}.`, runId, runUrl: run.html_url });
    }

    const artifactsResponse = await githubFetch(`${apiBase}/actions/runs/${runId}/artifacts?per_page=100`, {}, headers);
    const artifacts = (await artifactsResponse.json()) as GitHubArtifactsResponse;
    const artifact = artifacts.artifacts?.find((item) => !item.expired && /apk/i.test(item.name)) ?? artifacts.artifacts?.[0];
    if (!artifact) return res.json({ status: 'failed', error: 'Build succeeded but no APK artifact was found.', runId, runUrl: run.html_url });

    const downloadUrl = `/api/download-artifact?url=${encodeURIComponent(artifact.archive_download_url)}&token=${encodeURIComponent(token)}`;
    return res.json({ status: 'success', message: `APK generated successfully (${(artifact.size_in_bytes / 1048576).toFixed(2)} MB).`, downloadUrl, directApkUrl: `https://raw.githubusercontent.com/${repo}/main/downloads/URL2APK-latest.apk`, artifactId: artifact.id, runId, runUrl: run.html_url });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: error instanceof Error ? error.message : 'Failed to check build status.' });
  }
});


app.get('/api/download-artifact', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const queryToken = req.query.token as string;
  const { headers } = getGitHubConfig(req);
  const downloadHeaders = queryToken ? { ...headers, Authorization: `Bearer ${queryToken}` } : headers;

  if (!url) {
    res.status(400).send('URL required');
    return;
  }
  try {
    const downloadRes = await fetch(url, { headers: downloadHeaders, redirect: 'manual' });
    if (downloadRes.status === 302 || downloadRes.status === 301) {
      const location = downloadRes.headers.get('location');
      if (!location) throw new Error('No redirect location found');
      const finalRes = await fetch(location);
      if (!finalRes.ok) throw new Error('Failed to download from blob storage');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=URL2APK.zip');
      const { Readable } = await import('stream');
      Readable.fromWeb(finalRes.body as any).pipe(res);
      return;
    }
    if (!downloadRes.ok) {
      res.status(downloadRes.status).send('Failed to download artifact from GitHub');
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=URL2APK.zip');
    const { Readable } = await import('stream');
    Readable.fromWeb(downloadRes.body as any).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Error streaming artifact');
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const staticPath = path.join(process.cwd(), 'dist');
    app.use(express.static(staticPath));
    app.get('*', (_req: Request, res: Response) => res.sendFile(path.join(staticPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`URL2APK server listening on port ${PORT}`));
}
startServer();
