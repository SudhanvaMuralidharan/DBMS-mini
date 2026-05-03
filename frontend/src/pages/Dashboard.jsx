import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import HashDisplay from '../components/common/HashDisplay';
import { useAuth } from '../context/AuthContext';

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) + ' ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const fetchStats = () => {
    api.get('/api/stats')
      .then(r => setStats(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load stats'));
  };

  useEffect(() => {
    fetchStats();
    const iv = setInterval(fetchStats, 10000);
    return () => clearInterval(iv);
  }, []);

  if (error) return <div className="page-body"><div className="alert alert-error">{error}</div></div>;
  if (!stats) return <div className="loading">Loading dashboard...</div>;

  const { totalLogs, todayLogs, operations, recentLogs, userCount, chainStats, byStatus } = stats;
  const errorCount = byStatus.find(s => s.status === 'ERROR')?.count || 0;
  const deniedCount = byStatus.find(s => s.status === 'DENIED')?.count || 0;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="page-subtitle">System overview — Welcome back, {user.username}</div>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Audit Logs</div>
            <div className="stat-value accent">{totalLogs.toLocaleString()}</div>
            <div className="stat-meta">{todayLogs} recorded today</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Blockchain Blocks</div>
            <div className="stat-value accent">{chainStats.length.toLocaleString()}</div>
            <div className="stat-meta">Difficulty: {chainStats.difficulty}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Chain Integrity</div>
            <div className={`stat-value ${chainStats.valid ? 'success' : 'error'}`}>
              {chainStats.valid ? 'VALID' : 'TAMPERED'}
            </div>
            <div className="stat-meta">{chainStats.issues} issue{chainStats.issues !== 1 ? 's' : ''} detected</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Errors / Denials</div>
            <div className={`stat-value ${(errorCount + deniedCount) > 0 ? 'error' : 'success'}`}>
              {errorCount + deniedCount}
            </div>
            <div className="stat-meta">{errorCount} errors, {deniedCount} denied</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">System Users</div>
            <div className="stat-value">{userCount}</div>
            <div className="stat-meta">Registered accounts</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Operations Breakdown</span></div>
            <div className="card-body">
              {operations.length === 0 ? <div className="empty-state">No operations logged</div> : (
                <table className="data-table">
                  <thead><tr><th>Operation</th><th>Count</th><th>Share</th></tr></thead>
                  <tbody>
                    {operations.map(op => {
                      const pct = totalLogs ? Math.round(op.count / totalLogs * 100) : 0;
                      return (
                        <tr key={op.operation}>
                          <td><Badge value={op.operation} /></td>
                          <td className="mono">{op.count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 60, height: 4, background: 'var(--surface-3)', borderRadius: 2 }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                              </div>
                              <span className="text-muted text-xs">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Chain Head</span></div>
            <div className="card-body">
              <div className="detail-row">
                <div className="detail-label">Status</div>
                <div className="detail-value">
                  <div className={`chain-status ${chainStats.valid ? 'valid' : 'invalid'}`} style={{ display: 'inline-flex' }}>
                    <div className="dot" />
                    {chainStats.valid ? 'All blocks verified' : `${chainStats.issues} tamper(s) detected`}
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Chain length</div>
                <div className="detail-value mono">{chainStats.length} blocks</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Latest hash</div>
                <div className="detail-value"><HashDisplay hash={chainStats.latestHash} /></div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Mining difficulty</div>
                <div className="detail-value mono">{chainStats.difficulty} leading zeros</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <span className="text-muted text-xs">auto-refreshes every 10s</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentLogs.length === 0
              ? <div className="empty-state">No activity yet. Execute a query to begin.</div>
              : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Time</th><th>User</th><th>Operation</th><th>Table</th><th>Status</th><th>Block</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map(log => (
                        <tr key={log.id}>
                          <td className="mono text-muted text-xs">{fmtTime(log.timestamp)}</td>
                          <td className="mono">{log.username}</td>
                          <td><Badge value={log.operation} /></td>
                          <td className="mono text-muted">{log.table_name || '—'}</td>
                          <td><Badge value={log.status} /></td>
                          <td className="mono text-xs text-muted">#{log.block_index}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </>
  );
}