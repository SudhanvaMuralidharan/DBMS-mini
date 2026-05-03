const router = require('express').Router();
const accessControl = require('../layers/accessControl');
const { authenticate, requireRole } = require('../middleware/authenticate');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const user = await accessControl.authenticate(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = accessControl.generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  const user = accessControl.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.get('/users', authenticate, requireRole('admin'), (req, res) => {
  res.json(accessControl.getUsers());
});

router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role, email } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const id = await accessControl.createUser(username, password, role || 'viewer', email || '');
    res.status(201).json({ id, username, role: role || 'viewer' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;