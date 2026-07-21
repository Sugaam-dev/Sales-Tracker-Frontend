import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    
    if (email === 'demo@salestracker.com' && password === 'password123') {
      onLogin({ id: 1, name: 'Demo User', role: 'Sales Executive', initials: 'DU' });
      navigate('/dashboard');
    } else {
      alert('Invalid credentials. Use demo@salestracker.com / password123');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <img src="/logo.png" alt="PMRG Solution Logo" style={{ height: '48px', objectFit: 'contain', maxWidth: '100%' }} />
          </div>
          <h2>Welcome</h2>
          <p>Please enter your details to sign in.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="name@company.com" defaultValue="demo@salestracker.com" />
          </div>

          <div className="form-group relative">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                defaultValue="password123"
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary login-btn">
            Sign In
          </button>
        </form>

      </div>
    </div>
  );
}
