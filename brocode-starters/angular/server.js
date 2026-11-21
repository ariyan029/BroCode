const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Angular Starter</title></head>
      <body style="font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 3rem; text-align: center;">
        <h1 style="color: #dd0031;">🅰️ Angular / Express Starter on VibeCode</h1>
        <p>Container ready for frontend/backend experimentation.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
