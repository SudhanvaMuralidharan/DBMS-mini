const router = require('express').Router();
const blockchain = require('../blockchain/Blockchain');
const { authenticate, requireRole } = require('../middleware/authenticate');

router.get('/chain', authenticate, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const reversed = [...blockchain.chain].reverse();
  const slice = reversed.slice((page - 1) * limit, page * limit);
  res.json({ chain: slice, total: blockchain.chain.length, page, limit });
});

router.get('/validate', authenticate, (req, res) => {
  res.json(blockchain.isChainValid());
});

router.get('/stats', authenticate, (req, res) => {
  res.json(blockchain.getStats());
});

router.get('/block/:index', authenticate, (req, res) => {
  const block = blockchain.getBlock(parseInt(req.params.index));
  if (!block) return res.status(404).json({ error: 'Block not found' });
  res.json(block);
});

// Admin-only demo: simulate tampering for demo purposes
router.post('/tamper/:index', authenticate, requireRole('admin'), (req, res) => {
  const idx = parseInt(req.params.index);
  if (idx <= 0) return res.status(400).json({ error: 'Cannot tamper genesis block' });
  const ok = blockchain.tamperBlock(idx, req.body || { _DEMO_TAMPER: 'DATA ALTERED' });
  if (!ok) return res.status(404).json({ error: 'Block not found' });
  res.json({ message: `Block ${idx} tampered. Run /validate to detect.`, blockIndex: idx });
});

module.exports = router;