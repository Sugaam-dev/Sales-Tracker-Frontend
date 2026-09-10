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
