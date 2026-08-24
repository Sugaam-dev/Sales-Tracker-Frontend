import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { API } from '../api/config';
import './Login.css';

export default function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleMicrosoftSSO = () => {
    window.location.href = API.SSO_REDIRECT || 'http://localhost:8080/api/v1/auth/sso/redirect';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const email = e.target.elements.email.value;
    const password = e.target.elements.password.value;

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);

      if (response.requires_onboarding) {
        setError('First-time login. Onboarding is required. Please contact your administrator.');
        setLoading(false);
        return;
      }

      if (response.mfa_required) {
        setError('Multi-Factor Authentication (MFA) is required. Please contact your administrator.');
        setLoading(false);
        return;
      }

      if (response.access_token && response.user) {
        // Store tokens in localStorage
        localStorage.setItem('token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }

        // Derive user display details
        const emailParts = response.user.email.split('@')[0].split(/[._-]/);
        const derivedName = emailParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        const derivedInitials = emailParts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);

        const roleMap = {
          admin: 'Admin',
          manager: 'Sales Manager',
          agent: 'Sales Executive',
        };
        const displayRole = roleMap[response.user.role] || response.user.role;

        const userObj = {
          id: response.user.id,
          name: derivedName,
          role: displayRole,
          initials: derivedInitials || 'U',
          email: response.user.email,
        };

        localStorage.setItem('user', JSON.stringify(userObj));
        onLogin(userObj);

        navigate('/dashboard');
      } else {
        setError('Invalid server response. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
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

        {error && (
          <div
            className="error-message"
            style={{
              color: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email address</label>
            <input
              name="email"
              type="email"
              placeholder="name@company.com"
              defaultValue="manager@pmrgsolution.com"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group relative">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                defaultValue="Welcome@123"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="btn-sso-microsoft"
          onClick={handleMicrosoftSSO}
          disabled={loading}
        >
          <svg className="sso-icon" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f25022" d="M1 1h9v9H1z"/>
            <path fill="#00a4ef" d="M1 11h9v9H1z"/>
            <path fill="#7fba00" d="M11 1h9v9H11z"/>
            <path fill="#ffb900" d="M11 11h9v9H11z"/>
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
