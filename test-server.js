const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.send('OK');
});

// Test API route
app.post('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test API works', data: req.body });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});