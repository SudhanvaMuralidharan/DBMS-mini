const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'blockchain-audit-dbms-secret-2024';
const JWT_EXPIRES = '24h';
const ROLES = ['viewer', 'analyst', 'admin'];

class AccessControl {
  async createUser(username, password, role = 'viewer', email = '') {
    if (!ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
    const hash = await bcrypt.hash(password, 10);
    const stmt = database.db.prepare('INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, hash, role, email);
    return result.lastInsertRowid;
  }

  async authenticate(username, password) {
    const user = database.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;
    database.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    return user;
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  getUsers() {
    return database.db.prepare('SELECT id, username, role, email, created_at, last_login FROM users ORDER BY id').all();
  }

  getUserById(id) {
    return database.db.prepare('SELECT id, username, role, email, created_at, last_login FROM users WHERE id = ?').get(id);
  }
}

module.exports = new AccessControl();