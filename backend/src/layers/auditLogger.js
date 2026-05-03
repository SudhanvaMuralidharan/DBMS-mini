const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const blockchain = require('../blockchain/Blockchain');
const { generateHash } = require('../blockchain/HashGenerator');

class AuditLogger {
  log({ operation, tableName, userId, username, query, beforeState, afterState, rowCount, status, errorMessage, ipAddress }) {
    const transactionId = uuidv4();
    const timestamp = new Date().toISOString();

    const blockData = {
      transactionId,
      operation,
      tableName: tableName || null,
      userId: userId || null,
      username: username || 'system',
      queryHash: generateHash(query || ''),
      beforeHash: generateHash(JSON.stringify(beforeState || null)),
      afterHash: generateHash(JSON.stringify(afterState || null)),
      rowCount: rowCount || 0,
      status: status || 'SUCCESS',
      timestamp,
      ipAddress: ipAddress || null
    };

    const block = blockchain.addBlock(blockData);

    database.db.prepare(`
      INSERT INTO audit_logs
        (transaction_id, operation, table_name, user_id, username, query,
         before_state, after_state, row_count, status, error_message,
         ip_address, block_index, block_hash, timestamp)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      transactionId, operation, tableName || null, userId || null,
      username || 'system', query || null,
      JSON.stringify(beforeState || null), JSON.stringify(afterState || null),
      rowCount || 0, status || 'SUCCESS', errorMessage || null,
      ipAddress || null, block.index, block.hash, timestamp
    );

    return { transactionId, blockIndex: block.index, blockHash: block.hash };
  }

  getLogs({ limit = 50, offset = 0, operation, tableName, username, status, startDate, endDate } = {}) {
    const conds = [];
    const params = [];
    if (operation)  { conds.push('operation = ?');       params.push(operation); }
    if (tableName)  { conds.push('table_name = ?');      params.push(tableName); }
    if (username)   { conds.push('username LIKE ?');     params.push(`%${username}%`); }
    if (status)     { conds.push('status = ?');          params.push(status); }
    if (startDate)  { conds.push('timestamp >= ?');      params.push(startDate); }
    if (endDate)    { conds.push('timestamp <= ?');      params.push(endDate); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = database.db.prepare(`SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    const { count } = database.db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${where}`).get(...params);
    return { logs: rows, total: count };
  }

  getLogById(id) {
    return database.db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id);
  }

  verifyLog(id) {
    const log = this.getLogById(id);
    if (!log) return { verified: false, error: 'Log not found' };
    const block = blockchain.getBlock(log.block_index);
    if (!block) return { verified: false, error: 'Block not found in chain' };
    const blockIntact = block.hash === log.block_hash;
    const { generateBlockHash } = require('../blockchain/HashGenerator');
    const recomputed = generateBlockHash(block);
    const hashValid = recomputed === block.hash;
    return {
      verified: blockIntact && hashValid,
      blockIntact,
      hashValid,
      log,
      block,
      storedHash: log.block_hash,
      blockActualHash: block.hash,
      recomputedHash: recomputed
    };
  }
}

module.exports = new AuditLogger();