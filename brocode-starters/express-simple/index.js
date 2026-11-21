const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Express API - VibeCode</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 3rem; text-align: center; }
        .card { background: #1e293b; padding: 2rem; border-radius: 12px; display: inline-block; margin-top: 1.5rem; text-align: left; }
        code { background: #334155; padding: 0.2rem 0.4rem; border-radius: 4px; color: #38bdf8; }
        a { color: #38bdf8; text-decoration: none; }
      </style>
    </head>
    <body>
      <h1>🚀 Express.js Server Running in WebContainers</h1>
      <p>This backend API is executing natively inside your browser!</p>
      <div class="card">
        <h3>Available Endpoints:</h3>
        <ul style="margin-top: 0.5rem; line-height: 1.8;">
          <li><code>GET /</code> - HTML Welcome page</li>
          <li><code>GET /api/status</code> - <a href="/api/status" target="_blank">Health & System Status</a></li>
          <li><code>GET /api/items</code> - <a href="/api/items" target="_blank">Sample Data</a></li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: 'WebContainer (In-Browser Node.js)'
  });
});

app.get('/api/items', (req, res) => {
  res.json([
    { id: 1, name: 'Learn WebContainers', completed: true },
    { id: 2, name: 'Build In-Browser IDE', completed: true },
    { id: 3, name: 'Add AI Code Completion', completed: true },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
