import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import KioskView from './components/KioskView';
import PublicBoardView from './components/PublicBoardView';
import TicketTrackerView from './components/TicketTrackerView';
import StaffDashboardView from './components/StaffDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import { 
  fetchServices, 
  fetchCounters, 
  fetchLiveQueue, 
  reseedData, 
  createWebSocketConnection,
  getStoredUser
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [trackedToken, setTrackedToken] = useState('A-102');
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [liveData, setLiveData] = useState(null);
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Navigation router helper with optional argument (e.g. token number)
  const navigateTo = (tabName, tokenNumber = null) => {
    if (tokenNumber) {
      setTrackedToken(tokenNumber);
    }
    const user = getStoredUser();
    setCurrentUser(user);

    // Client-side authentication guards
    if (tabName === 'staff') {
      if (!user) {
        setActiveTab('login');
        return;
      }
    } else if (tabName === 'admin') {
      if (!user || user.role !== 'ADMIN') {
        setActiveTab('login');
        return;
      }
    }

    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshAll = useCallback(async () => {
    try {
      const [svc, ctrs, live] = await Promise.all([
        fetchServices().catch(() => []),
        fetchCounters().catch(() => []),
        fetchLiveQueue().catch(() => null),
      ]);
      setServices(svc || []);
      setCounters(ctrs || []);
      setLiveData(live);
    } catch (err) {
      console.warn("API refresh error:", err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 3500);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // WebSocket connection for real-time queue synchronization
  useEffect(() => {
    const ws = createWebSocketConnection((data) => {
      refreshAll();
    });
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [refreshAll]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'ADMIN') {
      setActiveTab('admin');
    } else {
      setActiveTab('staff');
    }
  };

  const handleReseed = async () => {
    try {
      await reseedData();
      await refreshAll();
    } catch (e) {
      console.error("Reseed failed:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={navigateTo} 
        onReseed={handleReseed}
      />

      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage 
            setActiveTab={navigateTo} 
            liveData={liveData}
          />
        )}

        {activeTab === 'login' && (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            navigateTo={navigateTo}
          />
        )}

        {activeTab === 'kiosk' && (
          <KioskView 
            services={services} 
            onTokenCreated={refreshAll} 
            setActiveTab={navigateTo}
          />
        )}

        {activeTab === 'board' && (
          <PublicBoardView 
            liveData={liveData} 
            onRefresh={refreshAll}
          />
        )}

        {activeTab === 'ticket' && (
          <TicketTrackerView 
            initialToken={trackedToken}
            navigateTo={navigateTo}
          />
        )}

        {activeTab === 'staff' && (
          <StaffDashboardView 
            counters={counters} 
            services={services} 
            liveData={liveData} 
            onActionDone={refreshAll}
            navigateTo={navigateTo}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardView 
            counters={counters} 
            services={services} 
            onDataUpdated={refreshAll}
            navigateTo={navigateTo}
          />
        )}
      </main>

      {/* Global Enterprise Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">SmartQueue Enterprise</span>
            <span>•</span>
            <span>Role-Based Access Control & Predictive Queue Architecture</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400 font-mono text-[11px]">
            <span>FastAPI + JWT RBAC</span>
            <span>•</span>
            <span>SymPy Analytical Math</span>
            <span>•</span>
            <span>Twilio SMS Notification Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
