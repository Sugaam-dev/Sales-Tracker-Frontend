import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AiAssistant from './AiAssistant';

export default function Layout({ user, onLogout }) {
  return (
    <div className="app-container">
      <Sidebar
        user={user}
        onLogout={onLogout}
      />

      <div className="main-content">
        <Header />

        <div className="page-scroll">
          <Outlet />
        </div>

        <AiAssistant />
      </div>
    </div>
  );
}