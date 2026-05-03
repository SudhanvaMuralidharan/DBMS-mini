import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import SQLTerminal from '../components/SQLTerminal';

const QUICK_QUERIES = [
  { label: 'List patients', sql: 'SELECT * FROM patients' },
  { label: 'Financial records', sql: 'SELECT * FROM financial_records' },
  { label: 'Employees', sql: 'SELECT * FROM employees' },
  { label: 'Flagged transactions', sql: "SELECT * FROM financial_records WHERE status = 'FLAGGED'" },
  { label: 'Add patient', sql: "INSERT INTO patients (patient_id, name, date_of_birth, diagnosis, medication, physician)\nVALUES ('P-006', 'New Patient', '1985-05-20', 'Migraine', 'Ibuprofen', 'Dr. Smith')" },
  { label: 'Update salary', sql: "UPDATE employees SET salary = 155000 WHERE employee_id = 'EMP-001'" },
];

function fmtVal(v) {
  if (v === null || v === undefined) return <span style={{ color: 'var(--text-dim)' }}>NULL</span>;
  return String(v);
}

export default function QueryPage() {
  const { user } = useAuth();
  const [sql, setSql] = useState('SELECT * FROM patients');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState([]);
  const [history, setHistory] = useState([]);

  const refreshSchema = () => {
    api.get('/api/query/schema').then(r => setSchema(r.data)).catch(() => {});
  };

  useEffect(() => {
    refreshSchema();
  }, []);

  const execute = async () => {
    if (!sql.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post('/api/query/execute', { sql });
      setResult(data);
      setHistory(h => [{ sql, ts: new Date().toISOString(), op: data.operation, rows: data.rowCount }, ...h.slice(0, 9)]);
      refreshSchema();
    } catch (err) {
      setError(err.response?.data?.error || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') execute();
  };

  const rows = Array.isArray(result?.data) ? result.data : [];
  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <>
      <div className="page-header">
        <h1>Query Editor</h1>
        <div className="page-subtitle">Execute SQL · All queries are logged to the blockchain</div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Schema panel */}
          <div>
            <div className="card">
              <div className="card-header"><span className="card-title">Tables</span></div>
              <div style={{ padding: '8px 0' }}>
                {schema.map(t => (
                  <div key={t.name} style={{ padding: '6px 14px', borderBottom: '1px solid var(--border-soft)' }}>
                    <div
                      className="text-sm"
                      style={{ color: 'var(--accent)', cursor: 'pointer', marginBottom: 3 }}
                      onClick={() => setSql(`SELECT * FROM ${t.name}`)}
                    >
                      {t.name}
                    </div>
                    <div className="text-xs text-muted">{t.rowCount} rows</div>
                    {t.columns.map(c => (
                      <div key={c.name} className="text-xs text-muted" style={{ paddingLeft: 8, marginTop: 1 }}>
                        · {c.name} <span style={{ color: 'var(--text-dim)' }}>{c.type}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor panel */}
          <div>
            <div className="card mb-16">
              <div className="card-header">
                <span className="card-title">SQL Statement</span>
                <div className="flex gap-8">
                  {QUICK_QUERIES.map(q => (
                    <button key={q.label} className="btn btn-outline btn-sm" onClick={() => setSql(q.sql)}>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-body">
                <textarea
                  className="sql-editor"
                  value={sql}
                  onChange={e => setSql(e.target.value)}
                  onKeyDown={handleKey}
                  spellCheck={false}
                  placeholder="SELECT * FROM patients -- Ctrl+Enter to execute"
                  rows={5}
                />
                <div className="flex-between mt-12">
                  <span className="text-xs text-muted">
                    Role: <span className="text-accent">{user.role}</span>
                    {user.role === 'viewer' && ' · Read-only access'}
                  </span>
                  <div className="flex gap-8">
                    <button className="btn btn-outline" onClick={() => { setSql(''); setResult(null); setError(''); }}>Clear</button>
                    <button className="btn btn-primary" onClick={execute} disabled={loading}>
                      {loading ? 'Executing...' : '▶ Execute (Ctrl+↵)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {result && (
              <div className="card mb-16">
                <div className="card-header">
                  <span className="card-title">Result</span>
                  <div className="flex gap-8">
                    <Badge value={result.operation} />
                    <span className="text-xs text-muted">{result.rowCount} row{result.rowCount !== 1 ? 's' : ''}</span>
                    {result.auditTrail && (
                      <span className="text-xs text-muted">
                        · Block #{result.auditTrail.blockIndex}
                      </span>
                    )}
                  </div>
                </div>
                {result.operation !== 'SELECT' ? (
                  <div className="card-body">
                    <div className="alert alert-success">
                      Query executed successfully. {result.rowCount} row(s) affected.
                      Logged to blockchain block #{result.auditTrail?.blockIndex}.
                    </div>
                    {typeof result.data === 'object' && !Array.isArray(result.data) && (
                      <div className="detail-row">
                        <div className="detail-label">Last Insert ID</div>
                        <div className="detail-value mono">{result.data.lastInsertRowid || '—'}</div>
                      </div>
                    )}
                  </div>
                ) : rows.length === 0 ? (
                  <div className="empty-state">Query returned no rows</div>
                ) : (
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i}>
                            {cols.map(c => (
                              <td key={c} className="mono truncate">{fmtVal(row[c])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <SQLTerminal onRefreshSchema={refreshSchema} />

            {history.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="card-title">Query History</span></div>
                <div style={{ padding: '4px 0' }}>
                  {history.map((h, i) => (
                    <div
                      key={i}
                      style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}
                      onClick={() => setSql(h.sql)}
                    >
                      <div className="flex-between">
                        <span className="text-xs text-muted">{new Date(h.ts).toLocaleTimeString()}</span>
                        <div className="flex gap-8">
                          <Badge value={h.op} />
                          <span className="text-xs text-muted">{h.rows} rows</span>
                        </div>
                      </div>
                      <div className="mono text-sm" style={{ marginTop: 3, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.sql}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}