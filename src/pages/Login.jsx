import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login, storeSession, deriveUser } from '../services/authService';
import { API } from '../api/config';
import './Login.css';

export default function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice;

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
        navigate('/onboarding', { state: { tempToken: response.temp_token } });
        return;
      }

      if (response.mfa_required) {
        navigate('/mfa-verify', { state: { mfaPendingToken: response.mfa_pending_token } });
        return;
      }

      if (response.access_token && response.user) {
        storeSession(response);
        onLogin(deriveUser(response.user));
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

        {notice && !error && (
          <div
            style={{
              color: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            {notice}
          </div>
        )}

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
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="name@company.com"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group relative">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <div className="password-input-wrapper">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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
