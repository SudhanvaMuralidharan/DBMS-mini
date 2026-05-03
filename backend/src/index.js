require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');
const { seedDatabase } = require('./utils/seedData');
const { db } = require('./config/database');
const blockchain = require('./blockchain/Blockchain');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/query',      require('./routes/query'));
app.use('/api/audit',      require('./routes/audit'));
app.use('/api/blockchain', require('./routes/blockchain'));

// Aggregate stats
app.get('/api/stats', authenticate, (req, res) => {
  const totalLogs   = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;
  const todayLogs   = db.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE DATE(timestamp)=DATE('now')").get().c;
  const operations  = db.prepare('SELECT operation, COUNT(*) as count FROM audit_logs GROUP BY operation ORDER BY count DESC').all();
  const recentLogs  = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 8').all();
  const userCount   = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const chainStats  = blockchain.getStats();
  const byStatus    = db.prepare('SELECT status, COUNT(*) as count FROM audit_logs GROUP BY status').all();
  res.json({ totalLogs, todayLogs, operations, recentLogs, userCount, chainStats, byStatus });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

async function start() {
  initializeDatabase();
  await seedDatabase();
  app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`));
}

start().catch(console.error);