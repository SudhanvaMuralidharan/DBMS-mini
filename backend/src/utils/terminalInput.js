const readline = require('readline');
const transactionProcessor = require('../layers/transactionProcessor');
const sse = require('./sse');

/**
 * Starts the interactive SQL command line interface in the backend terminal.
 */
function startTerminalInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'SQL> '
  });

  // Display initial welcome and help message
  console.log('\n======================================================');
  console.log('  Blockchain DBMS Terminal Sync Console Active');
  console.log('  Type any SQL command at the SQL> prompt.');
  console.log('  Your command execution will sync with the frontend!');
  console.log('  Type "exit" or "quit" to close this prompt.');
  console.log('======================================================\n');

  rl.prompt();

  rl.on('line', (line) => {
    const sql = line.trim();
    
    // Ignore empty lines
    if (!sql) {
      rl.prompt();
      return;
    }

    const lowerSql = sql.toLowerCase();
    if (lowerSql === 'exit' || lowerSql === 'quit') {
      console.log('[Terminal] Stopping console input stream.');
      rl.close();
      return;
    }

    try {
      // Mock an admin user representing the terminal CLI executor
      const user = { id: 0, username: 'terminal-admin', role: 'admin' };
      const ipAddress = '127.0.0.1';

      // Execute SQL query via standard transaction processor
      const result = transactionProcessor.execute(sql, user, ipAddress);

      // Pretty print to the backend console terminal
      console.log('\n\x1b[32m✔ SQL Command Executed Successfully!\x1b[0m');
      console.log(`Operation:  ${result.operation}`);
      console.log(`Rows count: ${result.rowCount}`);
      
      if (result.auditTrail) {
        console.log(`Blockchain: Block #${result.auditTrail.blockIndex} created | Hash: ${result.auditTrail.blockHash.substring(0, 16)}...`);
      }

      if (Array.isArray(result.data)) {
        if (result.data.length > 0) {
          console.log('\nResults:');
          console.table(result.data);
        } else {
          console.log('\nResult: Empty set returned.');
        }
      } else {
        console.log('\nResult:', result.data);
      }
      console.log();

      // Broadcast success to all SSE clients
      sse.broadcast('terminal-query', {
        sql,
        success: true,
        operation: result.operation,
        data: result.data,
        rowCount: result.rowCount,
        auditTrail: result.auditTrail,
        ts: new Date().toISOString()
      });

    } catch (err) {
      console.error('\n\x1b[31m❌ SQL Execution Error:\x1b[0m');
      console.error(err.message);
      console.log();

      // Broadcast failure to all SSE clients
      sse.broadcast('terminal-query', {
        sql,
        success: false,
        error: err.message,
        ts: new Date().toISOString()
      });
    }

    // Keep the CLI prompt active
    rl.prompt();
  });

  rl.on('SIGINT', () => {
    rl.question('Exit DBMS Terminal sync? (y/n) ', (answer) => {
      if (answer.match(/^y(es)?$/i)) {
        rl.close();
      } else {
        rl.prompt();
      }
    });
  });
}

module.exports = {
  startTerminalInput
};
