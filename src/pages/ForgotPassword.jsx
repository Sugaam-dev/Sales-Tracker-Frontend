import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import './Auth.css';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = e.target.elements.email.value;
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      // Backend always responds with success to avoid leaking whether an
      // account exists, so we show the same message regardless.
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
          <h2>Forgot your password?</h2>
          <p>Enter the email on your account and we'll send you a reset link.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {submitted ? (
          <div className="auth-success">
            A reset link has been sent to your email. Check your inbox to continue.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email address</label>
              <input name="email" type="email" placeholder="name@company.com" disabled={loading} required />
            </div>

            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="auth-footer-link">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
