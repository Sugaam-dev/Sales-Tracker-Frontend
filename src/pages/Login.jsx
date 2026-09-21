import { useState } from 'react';
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

      if (response.first_time_login || response.password_change_required) {
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('password_change_required', 'true');
        }
        navigate('/change-password', {
          state: {
            firstTimeLogin: true,
            message: response.message || 'Password change required before proceeding',
          },
        });
        return;
      }

      if (response.requires_onboarding) {
        navigate('/onboarding', { state: { tempToken: response.temp_token } });
        return;
      }

      if (response.mfa_required) {
        navigate('/mfa-verify', { state: { mfaPendingToken: response.mfa_pending_token } });
        return;
      }

      if (response.access_token && response.user) {
        localStorage.removeItem('password_change_required');
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
          <div className="login-logo-wrap">
            <img src="/logo.png" alt="PMRG Solution Logo" />
          </div>
          <h2>Welcome</h2>
          <p>Please enter your details to sign in.</p>
        </div>

        {notice && !error && (
          <div className="login-notice">
            {notice}
          </div>
        )}

        {error && (
          <div className="login-error">
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
              <Link to="/forgot-password" className="forgot-password-link">
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
