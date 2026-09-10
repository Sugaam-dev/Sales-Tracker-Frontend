import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { changePassword, forgotPassword } from '../services/authService';
import { useToast, useConfirm } from '../context/FeedbackContext';
import './AccountSettings.css';

export default function AccountSettings({ user: propUser, onLogout }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const confirm = useConfirm();

  // Read current user from props or session
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = propUser || storedUser || {};

  // Form states for Change Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [resetLinkSending, setResetLinkSending] = useState(false);

  // Role display label
  const rawRole = (currentUser?.rawRole || currentUser?.role || '').toLowerCase();
  const roleDisplayMap = {
    admin: 'Admin',
    leader: 'Leader',
    sales_manager: 'Sales Manager',
    sales_executive: 'Sales Executive',
  };
  const displayRole = roleDisplayMap[rawRole] || currentUser?.role || 'User';

  // Role badge CSS class
  const roleBadgeClass = `badge-${rawRole.replace('_', '-')}`;

  // Avatar initials
  const initials = currentUser?.initials || (currentUser?.name
    ? currentUser.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'U');

  // Password requirements calculation
  const reqs = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const isPasswordValid = Object.values(reqs).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Handle password change submission
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!isPasswordValid) {
      setPasswordError('Please fulfill all password security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(newPassword);
      showToast('Password changed successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(err.message || 'Failed to change password. Please try again.');
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Forgot Password reset link
  const handleSendResetLink = async () => {
    if (!currentUser.email) {
      navigate('/forgot-password');
      return;
    }

    setResetLinkSending(true);
    try {
      await forgotPassword(currentUser.email);
      showToast(`A password reset link has been sent to ${currentUser.email}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send reset link.', 'error');
    } finally {
      setResetLinkSending(false);
    }
  };

  // Handle Sign Out with custom confirmation modal
  const handleSignOutClick = async () => {
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your account?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed && onLogout) {
      onLogout();
    }
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-text">
          <h1 className="page-title">Account Settings</h1>
          <p className="settings-subtitle">
            View your profile details, role permissions, and manage your account credentials.
          </p>
        </div>

        <button
          type="button"
          className="signout-btn"
          onClick={handleSignOutClick}
          title="Sign out of current account"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="settings-grid">
        {/* Left Column: Profile Card */}
        <div className="card profile-hero-card">
          <div className="profile-avatar-large" aria-label="User Avatar">
            {initials}
          </div>

          <h2 className="profile-user-name">{currentUser?.name || 'Authenticated User'}</h2>
          <span className="profile-user-email">{currentUser?.email || 'No email associated'}</span>

          <div className={`role-badge ${roleBadgeClass}`}>
            <Shield size={13} />
            <span>{displayRole}</span>
          </div>

          <div className="profile-status-row">
            <div className="status-pill">
              <span className={`status-dot ${currentUser?.is_active !== false ? 'active' : 'inactive'}`} />
              <span>{currentUser?.is_active !== false ? 'Active Account' : 'Inactive Account'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Information & Security */}
        <div>
          {/* Detailed Read-Only Profile View */}
          <div className="card profile-details-card">
            <h3 className="card-title">Profile Information</h3>

            <div className="kv-list">
              <div className="kv-row">
                <span className="kv-label">
                  <User size={16} />
                  <span>Full Name</span>
                </span>
                <span className="kv-value">{currentUser?.name || '—'}</span>
              </div>

              <div className="kv-row">
                <span className="kv-label">
                  <Mail size={16} />
                  <span>Email Address</span>
                </span>
                <span className="kv-value">{currentUser?.email || '—'}</span>
              </div>

              <div className="kv-row">
                <span className="kv-label">
                  <Shield size={16} />
                  <span>Primary Role</span>
                </span>
                <span className="kv-value">{displayRole}</span>
              </div>

              <div className="kv-row">
                <span className="kv-label">
                  <Phone size={16} />
                  <span>Mobile / Phone</span>
                </span>
                <span className="kv-value">{currentUser?.mobile || 'Not provided'}</span>
              </div>

              <div className="kv-row">
                <span className="kv-label">
                  <UserCheck size={16} />
                  <span>Status</span>
                </span>
                <span className="kv-value">
                  {currentUser?.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              {currentUser?.manager_name && (
                <div className="kv-row">
                  <span className="kv-label">
                    <User size={16} />
                    <span>Assigned Sales Manager</span>
                  </span>
                  <span className="kv-value">{currentUser.manager_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Security & Credentials Card */}
          <div className="card security-card">
            <div className="security-card-header">
              <KeyRound size={20} style={{ color: 'var(--color-primary, #2563eb)' }} />
              <h3>Security &amp; Credentials</h3>
            </div>

            {passwordError && (
              <div className="form-error-banner" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="security-form">
              {/* New Password */}
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter new strong password"
                    required
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    disabled={passwordLoading}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Requirements Checklist */}
                <div className="password-reqs-box">
                  <span className="password-reqs-title">Password must contain:</span>
                  <ul className="password-req-list">
                    <li className={`password-req-item ${reqs.length ? 'met' : ''}`}>
                      {reqs.length ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`password-req-item ${reqs.upper ? 'met' : ''}`}>
                      {reqs.upper ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>At least 1 uppercase letter (A-Z)</span>
                    </li>
                    <li className={`password-req-item ${reqs.lower ? 'met' : ''}`}>
                      {reqs.lower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>At least 1 lowercase letter (a-z)</span>
                    </li>
                    <li className={`password-req-item ${reqs.number ? 'met' : ''}`}>
                      {reqs.number ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>At least 1 number (0-9)</span>
                    </li>
                    <li className={`password-req-item ${reqs.special ? 'met' : ''}`}>
                      {reqs.special ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>At least 1 special character (!@#$%...)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Confirm new password"
                    required
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    disabled={passwordLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <span className="field-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    Passwords do not match.
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="security-actions-row">
                <div>
                  <button
                    type="button"
                    className="forgot-password-link-btn"
                    onClick={handleSendResetLink}
                    disabled={resetLinkSending || passwordLoading}
                  >
                    {resetLinkSending ? 'Sending reset link...' : 'Forgot password? Request reset link'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordLoading || !isPasswordValid || !passwordsMatch}
                >
                  {passwordLoading ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
