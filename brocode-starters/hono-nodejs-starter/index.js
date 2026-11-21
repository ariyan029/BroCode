import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head><title>Hono Starter</title></head>
    <body style="font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 3rem; text-align: center;">
      <h1 style="color: #ea580c;">🔥 Hono Server Running in WebContainers</h1>
      <p>Ultra-fast web framework on in-browser Node.js runtime.</p>
      <p><a href="/api/hello" style="color: #fdba74;">Visit /api/hello JSON endpoint</a></p>
    </body>
    </html>
  `);
});

app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono on VibeCode!', timestamp: new Date().toISOString() });
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Hono listening on http://localhost:${info.port}`);
});
