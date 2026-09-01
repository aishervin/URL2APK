const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const staticPath = path.join(__dirname, 'static');\napp.use(express.static(staticPath));\napp.get('*', (_req: Request, res: Response) => res.sendFile(path.join(staticPath, 'index.html')));",
  `async function startServer() {
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
  
  app.listen(PORT, '0.0.0.0', () => console.log(\`URL2APK server listening on port \${PORT}\`));
}
startServer();`
);

code = code.replace(
  "app.listen(PORT, '0.0.0.0', () => console.log(`URL2APK server listening on port ${PORT}`));",
  ""
);

fs.writeFileSync('server.ts', code);
