import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  setPassword as setPasswordRequest,
  sendEmailOTP,
  verifyEmailOTP,
  sendMobileOTP,
  verifyMobileOTP,
  storeSession,
  deriveUser,
} from '../services/authService';
import './Auth.css';

const STEPS = ['password', 'email', 'mobile'];
const RESEND_COOLDOWN = 30;

export default function Onboarding({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();

  // The temp_token arrives via router state from Login. Fall back to
  // sessionStorage so a page refresh mid-onboarding doesn't strand the user.
  const [tempToken] = useState(() => {
    const fromNav = location.state?.tempToken;
    if (fromNav) {
      sessionStorage.setItem('onboarding_temp_token', fromNav);
      return fromNav;
    }
    return sessionStorage.getItem('onboarding_temp_token') || '';
  });

  const [step, setStep] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!tempToken) {
      navigate('/login', { replace: true });
    }
  }, [tempToken, navigate]);

  const finishOnboarding = (result) => {
    sessionStorage.removeItem('onboarding_temp_token');
    if (result?.access_token && result?.user) {
      storeSession(result);
      onLogin(deriveUser(result.user));
      navigate('/dashboard');
    } else {
      // Backend didn't issue a session yet (unusual, but handle gracefully).
      navigate('/login', {
        replace: true,
        state: { notice: result?.message || 'Onboarding complete. Please sign in.' },
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <img src="/logo.png" alt="PMRG Solution Logo" style={{ height: '48px', objectFit: 'contain', maxWidth: '100%' }} />
          </div>
          <h2>Set up your account</h2>
          <p>Let's get your account secured before your first sign in.</p>
        </div>

        <div className="auth-steps">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={
                'auth-step-dot' +
                (s === step ? ' active' : '') +
                (STEPS.indexOf(step) > i ? ' done' : '')
              }
            />
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-success">{info}</div>}

        {step === 'password' && (
          <SetPasswordStep
            tempToken={tempToken}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            onDone={() => {
              setError('');
              setStep('email');
            }}
          />
        )}

        {step === 'email' && (
          <OTPStep
            key="email"
            label="Verify your email"
            description="We'll send a 6-digit code to your email address."
            sendOTP={() => sendEmailOTP(tempToken)}
            verifyOTP={(otp) => verifyEmailOTP(tempToken, otp)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            setInfo={setInfo}
            onVerified={() => {
              setInfo('');
              setStep('mobile');
            }}
          />
        )}

        {step === 'mobile' && (
          <OTPStep
            key="mobile"
            label="Verify your mobile number"
            description="We'll send a 6-digit code via SMS."
            sendOTP={() => sendMobileOTP(tempToken)}
            verifyOTP={(otp) => verifyMobileOTP(tempToken, otp)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            setInfo={setInfo}
            onVerified={(result) => finishOnboarding(result)}
          />
        )}

        <div className="auth-footer-link">
          Already verified? <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}

function SetPasswordStep({ tempToken, loading, setLoading, setError, onDone }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const newPassword = e.target.elements.newPassword.value;
    const confirmPassword = e.target.elements.confirmPassword.value;

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters and include 1 uppercase letter and 1 number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await setPasswordRequest(tempToken, newPassword);
      onDone();
    } catch (err) {
      setError(err.message || 'Could not set your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <span className="password-hint">At least 8 characters, 1 uppercase letter, 1 number.</span>
      </div>

      <div className="form-group">
        <label>Confirm new password</label>
        <input
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          disabled={loading}
          required
        />
      </div>

      <button type="submit" className="btn-primary auth-btn" disabled={loading}>
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  );
}

function OTPStep({ label, description, sendOTP, verifyOTP, loading, setLoading, setError, setInfo, onVerified }) {
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const sentOnce = useRef(false);

  const triggerSend = async (silent = false) => {
    setError('');
    if (!silent) setInfo('');
    try {
      await sendOTP();
      setInfo('Code sent. It expires in 10 minutes.');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.message || 'Could not send the verification code.');
    }
  };

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    triggerSend(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(otp);
      onVerified(result);
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label>{label}</label>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '-2px' }}>{description}</p>
        <input
          className="otp-input"
          name="otp"
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
        {loading ? 'Verifying...' : 'Verify'}
      </button>

      <div className="auth-resend">
        Didn't get a code?{' '}
        <button type="button" onClick={() => triggerSend(false)} disabled={cooldown > 0 || loading}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
