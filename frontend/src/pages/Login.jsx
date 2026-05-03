import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_USERS = [
  { username: 'admin',   password: 'admin123',   role: 'admin' },
  { username: 'analyst', password: 'analyst123', role: 'analyst' },
  { username: 'viewer',  password: 'viewer123',  role: 'viewer' },
];

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCred = (u) => setForm({ username: u.username, password: u.password });

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-mark">⬡ AuditChain</div>
          <div className="logo-desc">Blockchain-Backed Audit Trail DBMS</div>
        </div>
        <h2>Sign in to continue</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="enter username"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="enter password"
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <div className="demo-creds">
          <div className="creds-title">Demo Credentials</div>
          {DEMO_USERS.map(u => (
            <div key={u.username} className="cred-row" onClick={() => fillCred(u)}>
              <span>{u.username} / {u.password}</span>
              <span className="role">{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}