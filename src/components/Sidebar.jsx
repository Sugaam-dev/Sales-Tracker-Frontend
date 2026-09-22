import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, BarChart2, Settings, Download, LogOut, ChevronDown } from 'lucide-react';
import { canAccessAdmin } from '../services/authService';
import './Sidebar.css';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      {/* Ambient background waves matching dark navy theme */}
      <div className="sidebar-waves-bg" aria-hidden="true">
        <svg 
          viewBox="0 0 260 260" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="sidebar-svg-waves" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0 90 C 70 140, 160 40, 260 110 L 260 260 L 0 260 Z" 
            fill="url(#sidebarWave1)" 
            opacity="0.5" 
          />
          <path 
            d="M0 150 C 90 90, 170 180, 260 130 L 260 260 L 0 260 Z" 
            fill="url(#sidebarWave2)" 
            opacity="0.75" 
          />
          <defs>
            <linearGradient id="sidebarWave1" x1="0" y1="60" x2="260" y2="260" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E40AF" />
              <stop offset="1" stopColor="#0B1938" />
            </linearGradient>
            <linearGradient id="sidebarWave2" x1="0" y1="110" x2="260" y2="260" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#061B4A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="sidebar-header">
        <img
          src="/logo.png"
          alt="PMRG Solution Logo"
          className="sidebar-logo-image"
        />
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <div className="avatar">{user?.initials || 'DG'}</div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Debabrata Ghosh'}</span>
            <span className="user-role">{user?.role || 'Admin'}</span>
          </div>
          <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
        </div>
        
        {dropdownOpen && (
          <div className="profile-dropdown">
            <button 
              className="dropdown-item" 
              onClick={() => { 
                navigate('/settings'); 
                setDropdownOpen(false); 
              }}
            >
              Account Settings
            </button>
            <button className="dropdown-item logout" onClick={onLogout}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
