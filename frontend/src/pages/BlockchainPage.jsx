import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import HashDisplay from '../components/common/HashDisplay';
import { useAuth } from '../context/AuthContext';

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function BlockDetail({ block, onClose }) {
  const isGenesis = block.index === 0;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">
            Block #{block.index} {isGenesis ? '— Genesis' : ''}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-row"><div className="detail-label">Index</div><div className="detail-value mono">#{block.index}</div></div>
          <div className="detail-row"><div className="detail-label">Timestamp</div><div className="detail-value mono">{fmtTime(block.timestamp)}</div></div>
          <div className="detail-row"><div className="detail-label">Nonce</div><div className="detail-value mono">{block.nonce}</div></div>
          <div className="detail-row">
            <div className="detail-label">Hash</div>
            <div className="detail-value"><HashDisplay hash={block.hash} full /></div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Previous Hash</div>
            <div className="detail-value"><HashDisplay hash={block.previousHash} full /></div>
          </div>
          {block.data && (
            <div style={{ marginTop: 14 }}>
              <div className="card-title mb-12">Block Data</div>
              {block.data.operation && (
                <div className="detail-row">
                  <div className="detail-label">Operation</div>
                  <div className="detail-value"><Badge value={block.data.operation} /></div>
                </div>
              )}
              {block.data.username && (
                <div className="detail-row"><div className="detail-label">User</div><div className="detail-value mono">{block.data.username}</div></div>
              )}
              {block.data.tableName && (
                <div className="detail-row"><div className="detail-label">Table</div><div className="detail-value mono">{block.data.tableName}</div></div>
              )}
              {block.data.status && (
                <div className="detail-row"><div className="detail-label">Status</div><div className="detail-value"><Badge value={block.data.status} /></div></div>
              )}
              {block.data.queryHash && (
                <div className="detail-row"><div className="detail-label">Query Hash</div><div className="detail-value"><HashDisplay hash={block.data.queryHash} /></div></div>
              )}
              {block.data.transactionId && (
                <div className="detail-row"><div className="detail-label">Transaction ID</div><div className="detail-value mono text-xs">{block.data.transactionId}</div></div>
              )}
              {block.data._TAMPERED && (
                <div className="alert alert-error" style={{ marginTop: 10 }}>⚠ This block has been tampered with. The stored hash does not match the block content.</div>
              )}
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <div className="card-title mb-12">Raw Data</div>
            <pre style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', overflow: 'auto', maxHeight: 200, background: 'var(--bg)', padding: 10, borderRadius: 3 }}>
              {JSON.stringify(block.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlockchainPage() {
  const { user } = useAuth();
  const [chain, setChain] = useState([]);
  const [total, setTotal] = useState(0);
  const [validity, setValidity] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [tampering, setTampering] = useState(false);

  const fetchChain = useCallback(async () => {
    setLoading(true);
    try {
      const [chainRes, validRes] = await Promise.all([
        api.get('/api/blockchain/chain', { params: { page, limit: 20 } }),
        api.get('/api/blockchain/validate')
      ]);
      setChain(chainRes.data.chain);
      setTotal(chainRes.data.total);
      setValidity(validRes.data);
    } catch { }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchChain(); }, [fetchChain]);

  const handleTamper = async () => {
    if (!window.confirm('This will tamper with a recent block to demonstrate tamper detection. Continue?')) return;
    setTampering(true);
    try {
      const recentBlock = chain.find(b => b.index > 0);
      if (!recentBlock) { alert('No non-genesis blocks to tamper'); return; }
      await api.post(`/api/blockchain/tamper/${recentBlock.index}`, { fakeData: 'INJECTED_VALUE' });
      await fetchChain();
    } catch (e) {
      alert(e.response?.data?.error || 'Tamper failed');
    }
    setTampering(false);
  };

  const isTampered = (block) => {
    if (!validity) return false;
    return validity.issues.some(i => i.index === block.index);
  };

  return (
    <>
      <div className="page-header">
        <h1>Blockchain Explorer</h1>
        <div className="page-subtitle">Immutable audit chain · {total} blocks</div>
      </div>
      <div className="page-body">
        {/* Validity banner */}
        {validity && (
          <div className={`chain-status ${validity.valid ? 'valid' : 'invalid'} mb-16`}>
            <div className="dot" />
            <div>
              {validity.valid
                ? `Chain integrity verified — all ${validity.checkedBlocks} blocks valid`
                : `⚠ Tampering detected — ${validity.issues.length} block(s) compromised`
              }
            </div>
            {!validity.valid && validity.issues.length > 0 && (
              <div style={{ marginLeft: 'auto', fontSize: 11 }}>
                Affected: {validity.issues.map(i => `#${i.index}`).join(', ')}
              </div>
            )}
          </div>
        )}

        {validity?.issues?.length > 0 && (
          <div className="card mb-16">
            <div className="card-header"><span className="card-title" style={{ color: 'var(--error)' }}>⚠ Integrity Issues</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>Block</th><th>Issue Type</th><th>Details</th></tr></thead>
                <tbody>
                  {validity.issues.map((issue, i) => (
                    <tr key={i}>
                      <td className="mono">#{issue.index}</td>
                      <td><Badge value={issue.type === 'HASH_MISMATCH' ? 'ERROR' : 'WARNING'} label={issue.type} /></td>
                      <td className="text-xs text-muted">
                        {issue.type === 'HASH_MISMATCH' && `Block hash doesn't match recomputed value`}
                        {issue.type === 'CHAIN_BREAK' && `Previous hash reference is broken`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex-between mb-16">
          <div className="flex gap-8">
            <button className="btn btn-outline btn-sm" onClick={fetchChain}>↺ Refresh</button>
            {user.role === 'admin' && (
              <button className="btn btn-danger btn-sm" onClick={handleTamper} disabled={tampering}>
                {tampering ? 'Tampering...' : '⚠ Demo: Simulate Tamper'}
              </button>
            )}
          </div>
          <span className="text-muted text-xs">{total} total blocks · page {page}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {loading && <div className="loading">Loading chain...</div>}
          {chain.map(block => {
            const tampered = isTampered(block);
            return (
              <div
                key={block.index}
                className={`block-card ${block.index === 0 ? 'genesis' : ''} ${tampered ? 'tampered' : ''}`}
                onClick={() => setSelected(block)}
              >
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span className="block-index">Block #{block.index}</span>
                  <div className="flex gap-8">
                    {block.index === 0 && <Badge value="GENESIS" />}
                    {tampered && <Badge value="TAMPERED" />}
                    {block.data?.operation && !tampered && <Badge value={block.data.operation} />}
                    {block.data?.status && !block.data.operation && <Badge value={block.data.status} />}
                  </div>
                </div>
                <div className="block-hash">{block.hash.slice(0, 24)}...</div>
                <div className="block-meta">
                  <span>prev: {block.previousHash.slice(0, 12)}...</span>
                  <span style={{ marginLeft: 8 }}>nonce: {block.nonce}</span>
                </div>
                <div className="block-meta" style={{ marginTop: 4 }}>
                  {fmtTime(block.timestamp)}
                  {block.data?.username && <span style={{ marginLeft: 8 }}>· {block.data.username}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(total / 20) || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
      {selected && <BlockDetail block={selected} onClose={() => setSelected(null)} />}
    </>
  );
}