import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/',           label: 'Dashboard',   icon: '▤' },
  { to: '/query',      label: 'Query Editor', icon: '⌨' },
  { to: '/audit',      label: 'Audit Logs',  icon: '≡' },
  { to: '/blockchain', label: 'Blockchain',  icon: '⬡' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = { admin: 'var(--accent)', analyst: 'var(--info)', viewer: 'var(--text-muted)' }[user?.role] || 'var(--text-muted)';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-title">⬡ AuditChain</div>
        <div className="logo-sub">Blockchain DBMS v1.0</div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">Navigation</div>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-name">{user?.username}</div>
        <div className="user-role" style={{ color: roleColor }}>{user?.role}</div>
        <button className="logout-btn" onClick={handleLogout}>→ sign out</button>
      </div>
    </aside>
  );
}