export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  const token = (request.headers.get('x-github-token')) || env.GITHUB_TOKEN || '';
  const repo = (request.headers.get('x-github-repo')) || env.GITHUB_REPO || '';
  
  return Response.json({
    status: 'ok',
    configured: Boolean(token && repo),
    timestamp: new Date().toISOString()
  });
};
