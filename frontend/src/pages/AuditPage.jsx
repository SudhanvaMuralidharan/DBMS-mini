import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import HashDisplay from '../components/common/HashDisplay';

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function LogModal({ log, onClose }) {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/audit/verify/${log.id}`);
      setVerification(data);
    } catch { setVerification({ verified: false, error: 'Verification failed' }); }
    setLoading(false);
  };

  let before = null, after = null;
  try { before = log.before_state ? JSON.parse(log.before_state) : null; } catch {}
  try { after = log.after_state ? JSON.parse(log.after_state) : null; } catch {}

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Audit Log #{log.id}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-row"><div className="detail-label">Transaction ID</div><div className="detail-value mono text-xs">{log.transaction_id}</div></div>
          <div className="detail-row"><div className="detail-label">Timestamp</div><div className="detail-value mono">{fmtTime(log.timestamp)}</div></div>
          <div className="detail-row"><div className="detail-label">Operation</div><div className="detail-value"><Badge value={log.operation} /></div></div>
          <div className="detail-row"><div className="detail-label">Table</div><div className="detail-value mono">{log.table_name || '—'}</div></div>
          <div className="detail-row"><div className="detail-label">User</div><div className="detail-value mono">{log.username}</div></div>
          <div className="detail-row"><div className="detail-label">Status</div><div className="detail-value"><Badge value={log.status} /></div></div>
          <div className="detail-row"><div className="detail-label">Rows Affected</div><div className="detail-value mono">{log.row_count}</div></div>
          <div className="detail-row"><div className="detail-label">Block Index</div><div className="detail-value mono">#{log.block_index}</div></div>
          <div className="detail-row"><div className="detail-label">Block Hash</div><div className="detail-value"><HashDisplay hash={log.block_hash} /></div></div>
          {log.query && (
            <div className="detail-row">
              <div className="detail-label">Query</div>
              <div className="detail-value"><pre style={{ fontFamily: 'var(--mono)', fontSize: 11, whiteSpace: 'pre-wrap', color: 'var(--accent)' }}>{log.query}</pre></div>
            </div>
          )}
          {log.error_message && (
            <div className="detail-row"><div className="detail-label">Error</div><div className="detail-value text-error">{log.error_message}</div></div>
          )}

          <div style={{ marginTop: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={verify} disabled={loading}>
              {loading ? 'Verifying...' : '🔍 Verify Blockchain Integrity'}
            </button>
          </div>

          {verification && (
            <div className={`alert ${verification.verified ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12 }}>
              {verification.verified
                ? '✓ Block hash verified. Log entry is intact and untampered.'
                : `✗ Integrity check failed: ${verification.error || 'Hash mismatch detected — possible tampering!'}`
              }
              {verification.recomputedHash && !verification.verified && (
                <div style={{ marginTop: 8 }}>
                  <div className="text-xs">Stored hash: <span className="mono">{verification.storedHash?.slice(0, 20)}...</span></div>
                  <div className="text-xs">Actual block hash: <span className="mono">{verification.blockActualHash?.slice(0, 20)}...</span></div>
                  <div className="text-xs">Recomputed hash: <span className="mono">{verification.recomputedHash?.slice(0, 20)}...</span></div>
                </div>
              )}
            </div>
          )}

          {(before || after) && (
            <div style={{ marginTop: 16 }}>
              <div className="card-title mb-12">State Diff</div>
              <div className="grid-2">
                {before && (
                  <div>
                    <div className="text-xs text-muted mb-12">Before ({Array.isArray(before) ? before.length : 1} rows)</div>
                    <pre style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', overflow: 'auto', maxHeight: 140, background: 'var(--bg)', padding: 8, borderRadius: 3 }}>
                      {JSON.stringify(Array.isArray(before) ? before[0] : before, null, 2)}
                    </pre>
                  </div>
                )}
                {after && (
                  <div>
                    <div className="text-xs text-muted mb-12">After ({Array.isArray(after) ? after.length : 1} rows)</div>
                    <pre style={{ fontSize: 10, color: 'var(--success)', fontFamily: 'var(--mono)', overflow: 'auto', maxHeight: 140, background: 'var(--bg)', padding: 8, borderRadius: 3 }}>
                      {JSON.stringify(Array.isArray(after) ? after[0] : after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ operation: '', status: '', limit: 50, offset: 0 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.operation) params.operation = filters.operation;
      if (filters.status) params.status = filters.status;
      params.limit = filters.limit;
      params.offset = filters.offset;
      const { data } = await api.get('/api/audit/logs', { params });
      setLogs(data.logs);
      setTotal(data.total);
    } catch { }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, offset: 0 }));

  return (
    <>
      <div className="page-header">
        <h1>Audit Logs</h1>
        <div className="page-subtitle">Every transaction, cryptographically recorded · {total} total entries</div>
      </div>
      <div className="page-body">
        <div className="filters-bar">
          <select className="form-select" value={filters.operation} onChange={e => setFilter('operation', e.target.value)}>
            <option value="">All Operations</option>
            {['SELECT','INSERT','UPDATE','DELETE','CREATE','DROP','ALTER','DENIED'].map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <select className="form-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {['SUCCESS','ERROR','DENIED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={fetchLogs}>↺ Refresh</button>
          <span className="text-muted text-xs" style={{ marginLeft: 'auto' }}>
            {filters.offset + 1}–{Math.min(filters.offset + filters.limit, total)} of {total}
          </span>
        </div>

        <div className="card">
          {loading && <div className="loading">Loading logs...</div>}
          {!loading && logs.length === 0 && <div className="empty-state">No audit logs found.</div>}
          {!loading && logs.length > 0 && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Operation</th>
                    <th>Table</th>
                    <th>Rows</th>
                    <th>Status</th>
                    <th>Block</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(log)}>
                      <td className="mono text-muted text-xs">{log.id}</td>
                      <td className="mono text-xs">{fmtTime(log.timestamp)}</td>
                      <td className="mono">{log.username}</td>
                      <td><Badge value={log.operation} /></td>
                      <td className="mono text-muted">{log.table_name || '—'}</td>
                      <td className="mono">{log.row_count}</td>
                      <td><Badge value={log.status} /></td>
                      <td className="mono text-muted text-xs">#{log.block_index}</td>
                      <td><span style={{ color: 'var(--text-dim)', fontSize: 12 }}>›</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="pagination" style={{ padding: '10px 14px' }}>
            <button className="btn btn-outline btn-sm" disabled={filters.offset === 0}
              onClick={() => setFilters(f => ({ ...f, offset: Math.max(0, f.offset - f.limit) }))}>
              ← Prev
            </button>
            <span>{Math.floor(filters.offset / filters.limit) + 1} / {Math.ceil(total / filters.limit) || 1}</span>
            <button className="btn btn-outline btn-sm"
              disabled={filters.offset + filters.limit >= total}
              onClick={() => setFilters(f => ({ ...f, offset: f.offset + f.limit }))}>
              Next →
            </button>
          </div>
        </div>
      </div>
      {selected && <LogModal log={selected} onClose={() => setSelected(null)} />}
    </>
  );
}