// Simple test to verify if chat.js is working with AI processing
import express from 'express';
import { pool } from './src/db.js';
import aiService from './src/services/aiService.js';

const app = express();

app.get('/test-ai-integration', async (req, res) => {
  try {
    console.log('Testing AI integration...');
    
    // Test 1: AI service is accessible
    const healthCheck = await aiService.healthCheck();
    console.log('AI service health:', healthCheck);
    
    // Test 2: Can call AI functions
    const testAnalysis = await aiService.analyzeTone('This is a test message');
    console.log('Test tone analysis:', testAnalysis);
    
    // Test 3: Can access database
    const dbTest = await pool.query('SELECT COUNT(*) FROM ai_insights');
    console.log('Database accessible, insights count:', dbTest.rows[0].count);
    
    res.json({
      ok: true,
      ai_service: healthCheck,
      test_analysis: testAnalysis,
      db_insights_count: dbTest.rows[0].count
    });
    
  } catch (error) {
    console.error('AI integration test failed:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`AI integration test server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}/test-ai-integration`);
});