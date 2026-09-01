const fs = require('fs');
let code = fs.readFileSync('myrepo/server.ts', 'utf8');

const targetStatus = `    const artifactPageUrl = \`https://github.com/\${GITHUB_REPO}/actions/runs/\${runId}/artifacts/\${artifact.id}\`;
    return res.json({ status: 'success', message: \`APK generated successfully (\${(artifact.size_in_bytes / 1048576).toFixed(2)} MB).\`, downloadUrl: artifactPageUrl, artifactId: artifact.id, runId, runUrl: run.html_url });`;

const replacementStatus = `    const downloadUrl = \`/api/download-artifact?url=\${encodeURIComponent(artifact.archive_download_url)}\`;
    return res.json({ status: 'success', message: \`APK generated successfully (\${(artifact.size_in_bytes / 1048576).toFixed(2)} MB).\`, downloadUrl, artifactId: artifact.id, runId, runUrl: run.html_url });`;

code = code.replace(targetStatus, replacementStatus);

const downloadRoute = `
app.get('/api/download-artifact', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).send('URL required');
    return;
  }
  try {
    const downloadRes = await fetch(url, { headers: githubHeaders, redirect: 'manual' });
    if (downloadRes.status === 302 || downloadRes.status === 301) {
      const location = downloadRes.headers.get('location');
      if (!location) throw new Error('No redirect location found');
      const finalRes = await fetch(location);
      if (!finalRes.ok) throw new Error('Failed to download from blob storage');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=app-release.zip');
      const { Readable } = await import('stream');
      Readable.fromWeb(finalRes.body as any).pipe(res);
      return;
    }
    if (!downloadRes.ok) {
      res.status(downloadRes.status).send('Failed to download artifact from GitHub');
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=app-release.zip');
    const { Readable } = await import('stream');
    Readable.fromWeb(downloadRes.body as any).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Error streaming artifact');
  }
});
`;

code = code.replace('const staticPath = path.join(__dirname, \'static\');', downloadRoute + '\nconst staticPath = path.join(__dirname, \'static\');');

fs.writeFileSync('myrepo/server.ts', code);
