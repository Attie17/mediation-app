// Simple standalone test server to verify POST route logic
import express from 'express';

const app = express();
app.use(express.json());

// Test POST route
app.post('/test', (req, res) => {
  console.log('✅ POST /test hit!');
  res.json({ message: 'POST route working!', body: req.body });
});

app.listen(4001, () => {
  console.log('Test server running on port 4001');
  console.log('Test with: curl -X POST http://localhost:4001/test -H "Content-Type: application/json" -d "{}"');
});