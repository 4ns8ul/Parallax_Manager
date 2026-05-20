import React, { useState } from 'react';
import { StitchProvider, useStitch } from './context/StitchContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Expenses from './pages/Expenses';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';

function AppContent() {
  const { user } = useStitch();
  const [activePage, setActivePage] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
      case 'tasks':
        return <Tasks />;
      case 'expenses':
        return <Expenses />;
      case 'notifications':
        return <Notifications />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 cyber-grid">
      {/* Sidebar navigation */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <Navbar activePage={activePage} />

        {/* Page Content area */}
        <main className="flex-1 p-8 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StitchProvider>
      <AppContent />
    </StitchProvider>
  );
}
