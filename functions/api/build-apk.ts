function getGitHubConfig(request: Request, env: any) {
  const token = request.headers.get('x-github-token') || env.GITHUB_TOKEN || '';
  const repo = request.headers.get('x-github-repo') || env.GITHUB_REPO || '';
  const apiBase = repo ? `https://api.github.com/repos/${repo}` : '';
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'URL2APK-Cloudflare/1.1',
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

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  try {
    const body = (await request.json()) as any;
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    const appName = typeof body?.appName === 'string' ? body.appName.trim() : '';
    const orientation = body?.orientation ?? 'portrait';
    const { token, repo, apiBase, headers } = getGitHubConfig(request, env);

    if (!validHttpUrl(url)) {
      return Response.json({ error: 'A valid HTTP(S) URL is required.' }, { status: 400 });
    }
    if (appName.length < 2 || appName.length > 30) {
      return Response.json({ error: 'App Name must be between 2 and 30 characters.' }, { status: 400 });
    }
    if (!['portrait', 'landscape', 'auto'].includes(orientation)) {
      return Response.json({ error: 'Invalid orientation.' }, { status: 400 });
    }
    if (!token || !repo) {
      return Response.json({ error: 'GitHub credentials (Token & Repository) are required. Please configure them in Settings.' }, { status: 401 });
    }

    await githubFetch(`${apiBase}/actions/workflows/build.yml/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { url, appName, orientation } }),
    }, headers);

    const runsResponse = await githubFetch(`${apiBase}/actions/workflows/build.yml/runs?event=workflow_dispatch&branch=main&per_page=10`, {}, headers);
    const runs = (await runsResponse.json()) as { workflow_runs?: any[] };
    const run = runs.workflow_runs?.find((item) => item.status === 'queued' || item.status === 'in_progress') ?? runs.workflow_runs?.[0];

    if (!run) {
      return Response.json({ status: 'queued', message: 'Workflow dispatched; waiting for GitHub to create the run.' }, { status: 202 });
    }
    return Response.json({ status: run.status, message: 'Build started on GitHub Actions.', runId: run.id, runUrl: run.html_url });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to trigger GitHub Actions.' }, { status: 401 });
  }
};
