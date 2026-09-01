const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const target = `// We need to proxy the artifact download because the URL expires and requires authentication
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
});`;
const replacement = `// We need to proxy the artifact download because the URL expires and requires authentication
app.get('/api/download-artifact', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send('URL required');

  try {
    const downloadRes = await fetch(url, { headers, redirect: 'manual' });
    
    if (downloadRes.status === 302 || downloadRes.status === 301) {
      const location = downloadRes.headers.get('location');
      if (!location) throw new Error('No redirect location found');
      
      const finalRes = await fetch(location);
      if (!finalRes.ok) throw new Error('Failed to download from blob storage');
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=app-release.zip');
      
      const { Readable } = require('stream');
      Readable.fromWeb(finalRes.body).pipe(res);
      return;
    }

    if (!downloadRes.ok) {
      return res.status(downloadRes.status).send('Failed to download artifact from GitHub');
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=app-release.zip');
    const { Readable } = require('stream');
    Readable.fromWeb(downloadRes.body).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Error streaming artifact');
  }
});`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
