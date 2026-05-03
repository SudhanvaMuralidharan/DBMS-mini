const database = require('../config/database');
const accessControl = require('../layers/accessControl');

async function seedDatabase() {
  const isSeeded = database.db.prepare('SELECT value FROM system_config WHERE key = ?').get('seeded');
  if (isSeeded && isSeeded.value === 'true') {
    return;
  }

  // Users
  const adminExists = database.db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    await accessControl.createUser('admin',   'admin123',   'admin',   'admin@auditdbms.io');
    await accessControl.createUser('analyst', 'analyst123', 'analyst', 'analyst@auditdbms.io');
    await accessControl.createUser('viewer',  'viewer123',  'viewer',  'viewer@auditdbms.io');
    console.log('[Seed] Default users created');
  }

  // Patients
  if (!database.db.prepare('SELECT id FROM patients LIMIT 1').get()) {
    const ins = database.db.prepare('INSERT INTO patients (patient_id,name,date_of_birth,diagnosis,medication,physician) VALUES (?,?,?,?,?,?)');
    [
      ['P-001','Eleanor Vance','1962-03-14','Hypertension','Lisinopril 10mg','Dr. Ramesh'],
      ['P-002','Marcus Chen','1978-07-22','Type 2 Diabetes','Metformin 500mg','Dr. Patel'],
      ['P-003','Sofia Reyes','1990-11-05','Asthma','Albuterol inhaler','Dr. Williams'],
      ['P-004','James Okafor','1955-01-30','Coronary Artery Disease','Aspirin 81mg','Dr. Ramesh'],
      ['P-005','Priya Sharma','1988-06-18','Anxiety Disorder','Sertraline 50mg','Dr. Lee'],
    ].forEach(r => ins.run(...r));
    console.log('[Seed] Patients seeded');
  }

  // Financial records
  if (!database.db.prepare('SELECT id FROM financial_records LIMIT 1').get()) {
    const ins = database.db.prepare('INSERT INTO financial_records (record_id,account_number,transaction_type,amount,currency,counterparty,status) VALUES (?,?,?,?,?,?,?)');
    [
      ['TXN-001','ACC-8821','WIRE_TRANSFER', 125000.00,'USD','Apex Trading LLC','COMPLETED'],
      ['TXN-002','ACC-3345','ACH_DEBIT',       4200.50,'USD','Utility Corp','COMPLETED'],
      ['TXN-003','ACC-8821','CHECK_DEPOSIT',  87500.00,'USD','Client Payment','PENDING'],
      ['TXN-004','ACC-7712','WIRE_TRANSFER', 500000.00,'USD','Meridian Bank','FLAGGED'],
      ['TXN-005','ACC-3345','ACH_CREDIT',      6800.00,'USD','Payroll Processing','COMPLETED'],
    ].forEach(r => ins.run(...r));
    console.log('[Seed] Financial records seeded');
  }

  // Employees
  if (!database.db.prepare('SELECT id FROM employees LIMIT 1').get()) {
    const ins = database.db.prepare('INSERT INTO employees (employee_id,name,department,role,salary) VALUES (?,?,?,?,?)');
    [
      ['EMP-001','Alice Mercer','Engineering','Senior Engineer',145000],
      ['EMP-002','Bob Hendricks','Finance','CFO',280000],
      ['EMP-003','Clara Nwosu','Healthcare','Chief Medical Officer',320000],
      ['EMP-004','David Park','Security','CISO',195000],
      ['EMP-005','Emma Liu','Engineering','Data Architect',160000],
    ].forEach(r => ins.run(...r));
    console.log('[Seed] Employees seeded');
  }

  database.db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)').run('seeded', 'true');
}

module.exports = { seedDatabase };