/**
 * Local CRE Webhook Server
 * Allows Vercel frontend to trigger CRE matching via HTTP
 * 
 * Usage:
 *   node cre-webhook-server.js
 *   Then Vercel calls: POST http://localhost:4001/trigger-matching
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import express from 'express';
import cors from 'cors';

const execAsync = promisify(exec);
const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CRE Webhook Server' });
});

// Trigger CRE matching
app.post('/trigger-matching', async (req, res) => {
  console.log('🔔 Webhook received: Triggering CRE matching...');
  
  try {
    const command = `cd c:\\Users\\thame\\chain.link\\privotc-cre\\my-workflow && cre workflow simulate . --project-root . --target privotc-staging --trigger-index 2 --non-interactive`;
    
    console.log('⚙️  Running CRE simulation...');
    const { stdout, stderr } = await execAsync(command, { 
      shell: 'powershell.exe',
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });
    
    // Parse output for key info
    const tradesReceived = stdout.match(/Received (\d+) trade/)?.[1] || '0';
    const matchesFound = stdout.match(/Found (\d+) matches/)?.[1] || '0';
    const matchPosted = stdout.includes('Match posted: status 200');
    
    console.log(`✅ CRE completed: ${tradesReceived} trades, ${matchesFound} matches`);
    
    res.json({
      success: true,
      tradesReceived: parseInt(tradesReceived),
      matchesFound: parseInt(matchesFound),
      matchPosted,
      timestamp: new Date().toISOString(),
      logs: stdout.split('\n').filter(line => 
        line.includes('[USER LOG]') || 
        line.includes('Received') || 
        line.includes('Found') ||
        line.includes('Match posted')
      ).slice(-20) // Last 20 relevant log lines
    });
    
  } catch (error) {
    console.error('❌ CRE simulation failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      stderr: error.stderr
    });
  }
});

// Get current orderbook depth
app.get('/orderbook', async (req, res) => {
  // This would require parsing orderbook state from simulation
  // For now, return placeholder
  res.json({
    message: 'Run /trigger-matching to see orderbook depth'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 CRE Webhook Server running on http://localhost:${PORT}`);
  console.log(`\n📡 Vercel can now trigger matching by calling:`);
  console.log(`   POST http://localhost:${PORT}/trigger-matching`);
  console.log(`\n💡 Keep this running while testing!\n`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down webhook server...');
  process.exit(0);
});
