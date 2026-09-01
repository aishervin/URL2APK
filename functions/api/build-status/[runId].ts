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

export const onRequestGet = async (context: any) => {
  const { request, env, params } = context;
  const runIdStr = params.runId as string;
  const runId = Number.parseInt(runIdStr, 10);
  
  if (!Number.isSafeInteger(runId) || runId <= 0) {
    return Response.json({ error: 'Invalid run ID.' }, { status: 400 });
  }

  const { token, repo, apiBase, headers } = getGitHubConfig(request, env);
  if (!token || !repo) {
    return Response.json({ error: 'GitHub credentials are not configured.' }, { status: 401 });
  }

  try {
    const runResponse = await githubFetch(`${apiBase}/actions/runs/${runId}`, {}, headers);
    const run = (await runResponse.json()) as any;

    if (run.status !== 'completed') {
      return Response.json({
        status: run.status,
        message: `Build is currently ${run.status.replace(/_/g, ' ')}...`,
        runId,
        runUrl: run.html_url
      });
    }

    if (run.conclusion !== 'success') {
      return Response.json({
        status: run.conclusion === 'cancelled' ? 'cancelled' : 'failed',
        error: `GitHub Action finished with conclusion: ${run.conclusion ?? 'unknown'}.`,
        runId,
        runUrl: run.html_url
      });
    }

    const artifactsResponse = await githubFetch(`${apiBase}/actions/runs/${runId}/artifacts?per_page=100`, {}, headers);
    const artifacts = (await artifactsResponse.json()) as any;
    const artifact = artifacts.artifacts?.find((item: any) => !item.expired && /apk/i.test(item.name)) ?? artifacts.artifacts?.[0];

    if (!artifact) {
      return Response.json({ status: 'failed', error: 'Build succeeded but no APK artifact was found.', runId, runUrl: run.html_url });
    }

    const downloadUrl = `/api/download-artifact?url=${encodeURIComponent(artifact.archive_download_url)}&token=${encodeURIComponent(token)}`;
    return Response.json({
      status: 'success',
      message: `APK generated successfully (${(artifact.size_in_bytes / 1048576).toFixed(2)} MB).`,
      downloadUrl,
      directApkUrl: `https://raw.githubusercontent.com/${repo}/main/downloads/URL2APK-latest.apk`,
      artifactId: artifact.id,
      runId,
      runUrl: run.html_url
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to check build status.' }, { status: 401 });
  }
};
