import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Sparkles, 
  RefreshCw,
  QrCode,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { fetchTicketDetails } from '../api';

export default function TicketTrackerView({ initialToken, navigateTo }) {
  const [tokenInput, setTokenInput] = useState(initialToken || 'A-102');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTicket = async (numToFetch) => {
    const query = (numToFetch || tokenInput).trim().toUpperCase();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketDetails(query);
      setTicket(data);
    } catch (err) {
      setError(err.message || "Ticket not found. Please double-check your token code.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      loadTicket(initialToken);
    } else {
      loadTicket('A-102');
    }
    const interval = setInterval(() => {
      if (tokenInput) loadTicket(tokenInput);
    }, 4000);
    return () => clearInterval(interval);
  }, [initialToken]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadTicket();
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Mobile Ticket Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Track Your Live Queue Position
        </h1>
        <p className="text-xs text-slate-400">
          Roam freely anywhere. Your estimated wait time updates dynamically via SymPy.
        </p>
      </div>

      {/* Ticket Lookup Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter Token (e.g. A-102, B-101)"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Track</span>
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Ticket Card */}
      {ticket && (
        <div className="bg-slate-800/90 rounded-3xl p-6 border-2 border-indigo-500/40 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
          {/* Top Status Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  ticket.status === 'CALLED' 
                    ? 'bg-emerald-400 animate-ping' 
                    : ticket.status === 'WAITING' 
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-400'
                }`}></span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  ticket.status === 'CALLED' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {ticket.status === 'CALLED' ? 'NOW BEING CALLED!' : 'WAITING IN QUEUE'}
                </span>
              </div>
            </div>

            <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
              ticket.priority_level === 'VIP'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : ticket.priority_level === 'EMERGENCY'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {ticket.priority_level.replace('_', ' ')}
            </span>
          </div>

          {/* Large Token Badge */}
          <div className="text-center py-4 space-y-1">
            <p className="text-xs text-slate-400">Your Ticket Number</p>
            <h2 className="text-6xl font-black text-white font-mono tracking-tight drop-shadow">
              {ticket.token_number}
            </h2>
            <p className="text-sm font-bold text-slate-200">{ticket.customer_name}</p>
            <p className="text-xs text-indigo-400">{ticket.service_name}</p>
          </div>

          {/* Dynamic Metrics */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80">
            <div className="text-center">
              <p className="text-[11px] uppercase font-bold text-slate-400">SymPy Predicted Wait</p>
              <p className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
                ~{ticket.estimated_wait_mins} <span className="text-xs font-normal text-slate-400">min</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {ticket.position_ahead === 0 ? "You're next in line!" : `${ticket.position_ahead} in front of you`}
              </p>
            </div>

            <div className="text-center border-l border-slate-700">
              <p className="text-[11px] uppercase font-bold text-slate-400">Assigned Counter</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-2">
                {ticket.counter_number ? `Counter 0${ticket.counter_number}` : 'Standby Area'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {ticket.counter_name || "Assigned upon summon"}
              </p>
            </div>
          </div>

          {/* Real-Time Mathematical Steps Preview */}
          {ticket.calculation_steps && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">Live Symbolic Evaluation: </span>
              <span className="text-indigo-400">{ticket.calculation_steps}</span>
            </div>
          )}

          {/* Alert Guidance */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 flex items-start space-x-2.5">
            <Bell className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Lobby Loudspeaker & SMS Notification</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Keep this window open or monitor lobby displays. An SMS summons will be dispatched automatically if your phone number was supplied.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
