const router = require('express').Router();
const auditLogger = require('../layers/auditLogger');
const { authenticate } = require('../middleware/authenticate');

router.get('/logs', authenticate, (req, res) => {
  const { limit = 50, offset = 0, operation, tableName, username, status, startDate, endDate } = req.query;
  const result = auditLogger.getLogs({
    limit: Math.min(parseInt(limit) || 50, 200),
    offset: parseInt(offset) || 0,
    operation, tableName, username, status, startDate, endDate
  });
  res.json(result);
});

router.get('/logs/:id', authenticate, (req, res) => {
  const log = auditLogger.getLogById(parseInt(req.params.id));
  if (!log) return res.status(404).json({ error: 'Log entry not found' });
  res.json(log);
});

router.get('/verify/:id', authenticate, (req, res) => {
  res.json(auditLogger.verifyLog(parseInt(req.params.id)));
});

module.exports = router;