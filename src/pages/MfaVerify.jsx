import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyMFA, storeSession, deriveUser } from '../services/authService';
import './Auth.css';

export default function MfaVerify({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mfaPendingToken] = useState(() => {
    const fromNav = location.state?.mfaPendingToken;
    if (fromNav) {
      sessionStorage.setItem('mfa_pending_token', fromNav);
      return fromNav;
    }
    return sessionStorage.getItem('mfa_pending_token') || '';
  });

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mfaPendingToken) {
      navigate('/login', { replace: true });
    }
  }, [mfaPendingToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyMFA(mfaPendingToken, otp);
      sessionStorage.removeItem('mfa_pending_token');
      storeSession(result);
      onLogin(deriveUser(result.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <img src="/logo.png" alt="PMRG Solution Logo" />
          </div>
          <h2>Two-factor verification</h2>
          <p>Enter the 6-digit code we sent you to finish signing in.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>VERIFICATION CODE</label>
            <input
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & sign in'}
          </button>
        </form>

        <div className="auth-footer-link">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
