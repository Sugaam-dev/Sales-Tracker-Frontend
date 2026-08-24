import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// We'll create these files shortly
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Import from './pages/Import';
import CommercialEstimation from './pages/CommercialEstimation';
import SSOSuccess from './pages/SSOSuccess';
import Layout from './components/Layout';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={<Login onLogin={setCurrentUser} />} 
        />
        <Route 
          path="/sso-success" 
          element={<SSOSuccess onLogin={setCurrentUser} />} 
        />
        
        {/* Protected Routes wrapper (mocked for prototype) */}
        <Route element={currentUser ? <Layout user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/commercial-estimation" element={<CommercialEstimation />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/import" element={<Import />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
