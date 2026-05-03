const database = require('../config/database');
const auditLogger = require('./auditLogger');

const WRITE_OPS = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
const ALL_OPS = ['SELECT', ...WRITE_OPS];
const SYSTEM_TABLES = ['users', 'audit_logs'];

class TransactionProcessor {
  parseOp(sql) {
    const upper = sql.trim().toUpperCase();
    return ALL_OPS.find(op => upper.startsWith(op)) || null;
  }

  extractTable(sql) {
    const patterns = [/FROM\s+["']?(\w+)["']?/i, /INTO\s+["']?(\w+)["']?/i,
                      /UPDATE\s+["']?(\w+)["']?/i, /TABLE\s+["']?(\w+)["']?/i];
    for (const p of patterns) {
      const m = sql.match(p);
      if (m) return m[1].toLowerCase();
    }
    return null;
  }

  validate(sql, role) {
    const operation = this.parseOp(sql);
    if (!operation) return { valid: false, error: 'Unsupported SQL operation' };
    const tableName = this.extractTable(sql);
    if (tableName && SYSTEM_TABLES.includes(tableName) && role !== 'admin') {
      return { valid: false, error: `Access denied: system table '${tableName}' is protected` };
    }
    if (role === 'viewer' && operation !== 'SELECT') {
      return { valid: false, error: 'Viewers have read-only access' };
    }
    if (operation === 'DROP' && role !== 'admin') {
      return { valid: false, error: 'DROP requires admin privileges' };
    }
    if (/;.*[^\s]/s.test(sql.trim())) {
      const stmts = sql.split(';').filter(s => s.trim());
      if (stmts.length > 1) return { valid: false, error: 'Multiple statements not allowed' };
    }
    return { valid: true, operation, tableName };
  }

  _captureState(tableName, operation) {
    if (!tableName || operation === 'SELECT' || operation === 'CREATE') return null;
    try {
      return database.db.prepare(`SELECT * FROM ${tableName} LIMIT 200`).all();
    } catch { return null; }
  }

  execute(sql, user, ipAddress) {
    const validation = this.validate(sql, user.role);
    if (!validation.valid) {
      auditLogger.log({ operation: 'DENIED', tableName: this.extractTable(sql),
        userId: user.id, username: user.username, query: sql,
        status: 'DENIED', errorMessage: validation.error, ipAddress });
      throw new Error(validation.error);
    }

    const { operation, tableName } = validation;
    const beforeState = this._captureState(tableName, operation);

    try {
      let result, afterState = null, rowCount = 0;
      if (operation === 'SELECT') {
        result = database.db.prepare(sql).all();
        rowCount = result.length;
      } else {
        const info = database.db.prepare(sql).run();
        rowCount = info.changes;
        result = { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
        afterState = this._captureState(tableName, operation);
      }

      const audit = auditLogger.log({ operation, tableName, userId: user.id,
        username: user.username, query: sql, beforeState, afterState,
        rowCount, status: 'SUCCESS', ipAddress });

      return { success: true, operation, data: result, rowCount, auditTrail: audit };
    } catch (err) {
      auditLogger.log({ operation, tableName, userId: user.id, username: user.username,
        query: sql, beforeState, status: 'ERROR', errorMessage: err.message, ipAddress });
      throw err;
    }
  }

  getSchema() {
    const tables = database.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    return tables.map(({ name }) => {
      const cols = database.db.prepare(`PRAGMA table_info(${name})`).all();
      const count = database.db.prepare(`SELECT COUNT(*) as c FROM ${name}`).get().c;
      return { name, columns: cols, rowCount: count };
    });
  }
}

module.exports = new TransactionProcessor();