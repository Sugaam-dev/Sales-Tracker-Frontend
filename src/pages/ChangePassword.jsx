import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { changePassword, clearLocalSession } from '../services/authService';
import './Auth.css';

export default function ChangePassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const noticeMessage = location.state?.message || 'You must set a new password before accessing your account.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const newPassword = e.target.elements.newPassword.value;
    const confirmPassword = e.target.elements.confirmPassword.value;

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least 1 uppercase letter.');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least 1 lowercase letter.');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least 1 number.');
      return;
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setError('Password must contain at least 1 special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
      setDone(true);
      localStorage.removeItem('password_change_required');
      clearLocalSession();
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { notice: 'Password changed successfully. Please sign in with your new password.' },
        });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <img src="/logo.png" alt="PMRG Solution Logo" style={{ height: '48px', objectFit: 'contain', maxWidth: '100%' }} />
          </div>
          <h2>Change Your Password</h2>
          <p>Please set a new secure password to proceed.</p>
        </div>

        {noticeMessage && !done && (
          <div
            style={{
              color: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '13px',
              textAlign: 'center',
              border: '1px solid rgba(37, 99, 235, 0.2)',
            }}
          >
            {noticeMessage}
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {done ? (
          <div className="auth-success">
            Password changed successfully! Redirecting you to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>New password</label>
              <div className="password-input-wrapper">
                <input
                  name="newPassword"
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
              <span className="password-hint">
                At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
              </span>
            </div>

            <div className="form-group">
              <label>Confirm new password</label>
              <div className="password-input-wrapper">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="auth-footer-link">
          <Link to="/login" onClick={() => clearLocalSession()}>Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
