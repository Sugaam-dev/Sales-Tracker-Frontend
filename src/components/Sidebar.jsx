import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, BarChart2, Settings, Download, LogOut, ChevronDown, X } from 'lucide-react';
import { canAccessAdmin } from '../services/authService';
import './Sidebar.css';

export default function Sidebar({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Leads', path: '/leads', icon: <Users size={20} /> },
    { name: 'Activities', path: '/activities', icon: <Activity size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart2 size={20} /> },
    ...(canAccessAdmin(user) ? [{ name: 'Admin', path: '/admin', icon: <Settings size={20} /> }] : []),
    { name: 'Import', path: '/import', icon: <Download size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img
          src="/logo.png"
          alt="PMRG Solution Logo"
          className="sidebar-logo-image"
        />
      </div>

      <nav className="sidebar-nav" style={{ paddingTop: '16px' }}>
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <div className="avatar">{user?.initials || 'U'}</div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User Name'}</span>
            <span className="user-role">{user?.role || 'Role'}</span>
          </div>
          <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
        </div>
        
        {dropdownOpen && (
          <div className="profile-dropdown">
            <button className="dropdown-item" onClick={() => { setIsAccountModalOpen(true); setDropdownOpen(false); }}>
              Account Settings
            </button>
            <button className="dropdown-item logout" onClick={onLogout}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* Account Settings Modal */}
      {isAccountModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Account Settings</h3>
              <button onClick={() => setIsAccountModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Name</label>
                <input type="text" defaultValue={user?.name || 'Demo User'} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                <input type="email" defaultValue="demo@salestracker.com" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Timezone</label>
                <select style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <option>UTC -8:00 (Pacific Time)</option>
                  <option>UTC -5:00 (Eastern Time)</option>
                  <option>UTC +0:00 (GMT)</option>
                  <option>UTC +5:30 (India Standard Time)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAccountModalOpen(false)}>Cancel</button>
                <button type="button" className="btn-primary" onClick={() => { alert('Settings saved successfully!'); setIsAccountModalOpen(false); }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
