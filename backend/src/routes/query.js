const router = require('express').Router();
const transactionProcessor = require('../layers/transactionProcessor');
const { authenticate } = require('../middleware/authenticate');

const snapshotService = require('../layers/snapshotService');

router.post('/execute', authenticate, (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql?.trim()) return res.status(400).json({ error: 'SQL query required' });
    const result = transactionProcessor.execute(sql.trim(), req.user, req.ip);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/commit', authenticate, async (req, res) => {
  try {
    const result = await snapshotService.commit(req.user, req.ip);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/revert', authenticate, async (req, res) => {
  try {
    const result = await snapshotService.revert(req.user, req.ip);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/schema', authenticate, (req, res) => {
  try {
    const schema = transactionProcessor.getSchema();
    res.json(schema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;