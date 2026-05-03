import React from 'react';

const VARIANT_MAP = {
  SUCCESS: 'badge-success', COMPLETED: 'badge-success', VALID: 'badge-success',
  ERROR: 'badge-error', FAILED: 'badge-error', FLAGGED: 'badge-error', DENIED: 'badge-error', TAMPERED: 'badge-error',
  WARNING: 'badge-warning', PENDING: 'badge-warning',
  SELECT: 'badge-info', INFO: 'badge-info',
  INSERT: 'badge-accent', UPDATE: 'badge-accent', DELETE: 'badge-warning',
  CREATE: 'badge-accent', DROP: 'badge-error', ALTER: 'badge-warning',
  GENESIS: 'badge-accent',
  admin: 'badge-accent', analyst: 'badge-info', viewer: 'badge-muted',
};

export default function Badge({ value, label }) {
  const text = label || value || '';
  const variant = VARIANT_MAP[String(value).toUpperCase()] || VARIANT_MAP[value] || 'badge-muted';
  return <span className={`badge ${variant}`}>{text}</span>;
}