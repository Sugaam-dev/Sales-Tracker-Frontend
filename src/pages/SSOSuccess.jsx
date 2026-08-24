import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function SSOSuccess({ onLogin }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken) {
      setError('No authentication token received from SSO provider.');
      return;
    }

    try {
      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      const payload = parseJwt(accessToken);
      const email = payload?.email || 'user@pmrgsolution.com';
      const role = payload?.role || 'agent';
      const userId = payload?.user_id || payload?.sub || '';

      const emailParts = email.split('@')[0].split(/[._-]/);
      const derivedName = emailParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      const derivedInitials = emailParts
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);

      const roleMap = {
        admin: 'Admin',
        manager: 'Sales Manager',
        agent: 'Sales Executive',
      };
      const displayRole = roleMap[role] || role;

      const userObj = {
        id: userId,
        name: derivedName || 'User',
        role: displayRole,
        initials: derivedInitials || 'U',
        email: email,
      };

      localStorage.setItem('user', JSON.stringify(userObj));
      onLogin(userObj);

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('SSO parsing error:', err);
      setError('Failed to process SSO login. Please try again.');
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h3 style={{ color: '#EF4444', marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>SSO Authentication Failed</h3>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748B', fontSize: '14px' }}>Completing Microsoft Sign-In...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
