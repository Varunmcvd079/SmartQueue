import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Tv, 
  UserCheck, 
  Headphones, 
  BarChart3, 
  Clock, 
  Activity, 
  ShieldCheck,
  RotateCcw,
  LogIn,
  LogOut,
  QrCode,
  Lock
} from 'lucide-react';
import { getStoredUser, clearAuthSession } from '../api';

export default function Navbar({ activeTab, setActiveTab, onReseed }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [reseedLoading, setReseedLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCurrentUser(getStoredUser());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReseed = async () => {
    setReseedLoading(true);
    try {
      if (onReseed) await onReseed();
    } finally {
      setTimeout(() => setReseedLoading(false), 500);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setActiveTab('login');
  };

  const navItems = [
    { id: 'landing', label: 'Overview', icon: Layers, public: true },
    { id: 'kiosk', label: 'Visitor Kiosk', icon: UserCheck, public: true },
    { id: 'board', label: 'Lobby Board', icon: Tv, public: true },
    { id: 'ticket', label: 'Track Ticket', icon: QrCode, public: true },
    { id: 'staff', label: 'Staff Desk', icon: Headphones, protected: true, role: 'STAFF' },
    { id: 'admin', label: 'Admin Portal', icon: BarChart3, protected: true, role: 'ADMIN' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Smart<span className="text-indigo-400">Queue</span></span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  RBAC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Intelligent Queue Architecture</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = item.protected && (!currentUser || (item.role === 'ADMIN' && currentUser.role !== 'ADMIN'));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isLocked) {
                      setActiveTab('login');
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
                </button>
              );
            })}
          </nav>

          {/* Right Header Status, Clock, and Auth Session Pills */}
          <div className="flex items-center space-x-2.5">
            {/* Live Clock */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* Auth Session / Role Badge */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                  <span className={`w-2 h-2 rounded-full ${currentUser.role === 'ADMIN' ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
                  <span className="font-bold text-white max-w-[90px] truncate">{currentUser.username}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    currentUser.role === 'ADMIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out of current account"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-800 overflow-x-auto space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-[11px] whitespace-nowrap font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
