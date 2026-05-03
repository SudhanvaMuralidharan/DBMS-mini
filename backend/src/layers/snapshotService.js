const fs = require('fs');
const path = require('path');
const database = require('../config/database');
const auditLogger = require('./auditLogger');

const DATA_DIR = path.join(__dirname, '../../data');
const BACKUP_PATH = path.join(DATA_DIR, 'audit_dbms_backup.db');

class SnapshotService {
  async commit(user, ipAddress) {
    try {
      await database.db.backup(BACKUP_PATH);
      
      auditLogger.log({
        operation: 'COMMIT',
        tableName: 'SYSTEM',
        userId: user.id,
        username: user.username,
        query: 'sql commit',
        status: 'SUCCESS',
        ipAddress
      });
      
      return { success: true, message: 'Database state committed successfully.' };
    } catch (err) {
      throw new Error(`Commit failed: ${err.message}`);
    }
  }

  async revert(user, ipAddress) {
    if (!fs.existsSync(BACKUP_PATH)) {
      throw new Error('No commit found to revert to.');
    }

    try {
      database.db.close();
      
      fs.copyFileSync(BACKUP_PATH, path.join(DATA_DIR, 'audit_dbms.db'));
      
      const Database = require('better-sqlite3');
      database.db = new Database(path.join(DATA_DIR, 'audit_dbms.db'));
      database.db.pragma('journal_mode = WAL');
      database.db.pragma('foreign_keys = ON');

      auditLogger.log({
        operation: 'REVERT',
        tableName: 'SYSTEM',
        userId: user.id,
        username: user.username,
        query: 'sql revert',
        status: 'SUCCESS',
        ipAddress
      });

      return { success: true, message: 'Database reverted to last commit.' };
    } catch (err) {
      throw new Error(`Revert failed: ${err.message}`);
    }
  }
}

module.exports = new SnapshotService();
