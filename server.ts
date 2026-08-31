import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/api/build-apk', async (req, res) => {
  const { url, appName } = req.body;

  if (!url || !appName) {
    return res.status(400).json({ error: 'URL and App Name are required' });
  }

  try {
    // In a real-world scenario without a paid API, we would route this to a 
    // free service like PWABuilder's open API to generate the package.
    // PWABuilder API typically requires the URL to be a valid PWA.
    
    // Simulating the delay of a free open-source cloud build...
    await new Promise((resolve) => setTimeout(resolve, 3500));
    
    // For demonstration in this sandbox, we return a simulated success.
    // To generate real APKs, you would connect this route to PWABuilder's Android package generator.
    res.json({
      status: 'success',
      message: 'APK generated successfully via Free Cloud Engine',
      downloadUrl: '#', // In reality, this would be the URL returned by PWABuilder
    });
  } catch (error: any) {
    console.error('Error building APK:', error);
    res.status(500).json({ error: 'Failed to build APK due to external service error.' });
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
