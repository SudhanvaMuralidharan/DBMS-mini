import React, { useState } from 'react';

export default function HashDisplay({ hash, full = false, valid }) {
  const [expanded, setExpanded] = useState(false);
  if (!hash) return <span className="text-muted">—</span>;
  const short = hash.slice(0, 12) + '…' + hash.slice(-8);
  const cls = valid === true ? 'valid' : valid === false ? 'invalid' : '';
  return (
    <span
      className={`hash-display ${cls}`}
      onClick={() => setExpanded(e => !e)}
      title="Click to toggle full hash"
      style={{ cursor: 'pointer' }}
    >
      {(full || expanded) ? hash : short}
    </span>
  );
}