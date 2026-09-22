import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { logout, canAccessAdmin } from './services/authService';

import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import MfaVerify from './pages/MfaVerify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Activities from './pages/Activities';
import Import from './pages/Import';
import SSOSuccess from './pages/SSOSuccess';
import AccountSettings from './pages/AccountSettings';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import { FeedbackProvider } from './context/FeedbackContext';
import { MasterDataProvider } from './context/MasterDataContext';
import { SkeletonCard, SkeletonTable } from './components/common/Skeleton';
import ErrorBoundary from './components/common/ErrorBoundary';

// Heavy routes split on demand
const Reports = lazy(() => import('./pages/Reports'));
const CommercialEstimation = lazy(() => import('./pages/CommercialEstimation'));
const Admin = lazy(() => import('./pages/Admin'));

function PageLoader() {
  return (
    <div style={{ padding: '24px' }}>
      <SkeletonCard height="160px" />
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authInitializing, setAuthInitializing] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const pwdChangeReq = localStorage.getItem('password_change_required');
    if (savedUser && savedToken && pwdChangeReq !== 'true') {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error restoring session:', e);
      }
    }
    setAuthInitializing(false);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refresh_token');
    await logout(token, refreshToken);
    setCurrentUser(null);
  };

  if (authInitializing) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: '#64748B', fontSize: '14px' }}>Loading session...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <FeedbackProvider>
          <MasterDataProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route 
                  path="/login" 
                  element={<Login onLogin={setCurrentUser} />} 
                />
                <Route 
                  path="/sso-success" 
                  element={<SSOSuccess onLogin={setCurrentUser} />} 
                />
                <Route
                  path="/onboarding"
                  element={<Onboarding onLogin={setCurrentUser} />}
                />
                <Route
                  path="/mfa-verify"
                  element={<MfaVerify onLogin={setCurrentUser} />}
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/change-password" element={<ChangePassword />} />
                
                {/* Public Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Protected Routes wrapper */}
                <Route element={currentUser ? <Layout user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/leads/:id" element={<Leads />} />
                  <Route path="/commercial-estimation" element={<CommercialEstimation />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route 
                    path="/admin" 
                    element={
                      canAccessAdmin(currentUser) ? (
                        <Admin user={currentUser} />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    } 
                  />
                  <Route path="/import" element={<Import />} />
                  <Route path="/settings" element={<AccountSettings user={currentUser} onLogout={handleLogout} />} />
                  <Route path="/account" element={<Navigate to="/settings" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </MasterDataProvider>
        </FeedbackProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
