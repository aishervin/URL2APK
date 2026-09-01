export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get('url');
  const queryToken = urlObj.searchParams.get('token');
  const envToken = env.GITHUB_TOKEN || '';
  const token = queryToken || envToken;

  if (!targetUrl) {
    return new Response('URL required', { status: 400 });
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'URL2APK-Cloudflare/1.1',
  };

  try {
    const downloadRes = await fetch(targetUrl, { headers, redirect: 'manual' });
    if (downloadRes.status === 302 || downloadRes.status === 301) {
      const location = downloadRes.headers.get('location');
      if (!location) throw new Error('No redirect location found');
      const finalRes = await fetch(location);
      if (!finalRes.ok) throw new Error('Failed to download from blob storage');
      
      return new Response(finalRes.body, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename=URL2APK.zip',
        },
      });
    }

    if (!downloadRes.ok) {
      return new Response('Failed to download artifact from GitHub', { status: downloadRes.status });
    }

    return new Response(downloadRes.body, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=URL2APK.zip',
      },
    });
  } catch (err) {
    console.error('Download error:', err);
    return new Response('Error streaming artifact', { status: 500 });
  }
};
