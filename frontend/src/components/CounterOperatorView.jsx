import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  PhoneCall, 
  CheckCircle, 
  SkipForward, 
  ArrowRightLeft, 
  PauseCircle, 
  PlayCircle, 
  PowerOff, 
  Clock, 
  User, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  Crown, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { callNextToken, performCounterAction, updateCounterStatus } from '../api';

export default function CounterOperatorView({ counters, services, liveData, onActionDone }) {
  const [selectedCounterId, setSelectedCounterId] = useState(counters[0]?.id || 1);
  const [ticketNotes, setTicketNotes] = useState('');
  const [transferTargetId, setTransferTargetId] = useState(services[0]?.id || 1);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Sync selectedCounterId if counters load
  useEffect(() => {
    if (counters && counters.length > 0 && !counters.some(c => c.id === selectedCounterId)) {
      setSelectedCounterId(counters[0].id);
    }
  }, [counters, selectedCounterId]);

  const activeCounter = counters.find(c => c.id === selectedCounterId) || counters[0];
  const activeToken = activeCounter?.active_token;

  // Filter pending waiting tokens
  const waitingList = liveData?.waiting_list || [];

  const handleCallNext = async () => {
    if (!activeCounter) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await callNextToken(activeCounter.id);
      if (res.token) {
        setActionMessage(`Called Token ${res.token.token_number} for ${res.token.customer_name}`);
      } else {
        setActionMessage("No waiting tokens in queue for this desk.");
      }
      setTicketNotes('');
      if (onActionDone) onActionDone();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType) => {
    if (!activeCounter) return;
    setLoading(true);
    try {
      await performCounterAction({
        counter_id: activeCounter.id,
        action: actionType,
        notes: ticketNotes,
        transfer_service_id: actionType === 'TRANSFER' ? transferTargetId : null
      });
      setActionMessage(`Ticket marked as ${actionType}.`);
      setTicketNotes('');
      setShowTransferModal(false);
      if (onActionDone) onActionDone();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeCounter) return;
    try {
      await updateCounterStatus(activeCounter.id, newStatus);
      if (onActionDone) onActionDone();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar: Counter & Operator Selector */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Counter Selector Dropdown */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Headphones className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Desk Terminal</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeCounter?.status === 'ACTIVE' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {activeCounter?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="flex items-center space-x-3 mt-1">
              <select
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(Number(e.target.value))}
                className="bg-navy-900 border border-slate-700 rounded-lg px-3 py-1.5 text-base font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Counter {c.counter_number < 10 ? `0${c.counter_number}` : c.counter_number} — {c.name} ({c.operator_name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Desk Status Toggles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleStatusChange('ACTIVE')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCounter?.status === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Active Service</span>
          </button>

          <button
            onClick={() => handleStatusChange('PAUSED')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCounter?.status === 'PAUSED'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PauseCircle className="w-4 h-4" />
            <span>Desk Break</span>
          </button>

          <button
            onClick={() => handleStatusChange('OFFLINE')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCounter?.status === 'OFFLINE'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PowerOff className="w-4 h-4" />
            <span>Sign Off</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Central Action Hub + Side Queue Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Central Workspace (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Ticket Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Currently Serving at Desk
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Assigned: {activeCounter?.service_name || 'General Desk'}
              </span>
            </div>

            {activeToken ? (
              <div className="py-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase mb-2 ${
                      activeToken.priority_level === 'EMERGENCY'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : activeToken.priority_level === 'VIP'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {activeToken.priority_level.replace('_', ' ')}
                    </span>
                    <h2 className="text-6xl font-black text-white font-mono tracking-tight">
                      {activeToken.token_number}
                    </h2>
                  </div>

                  <div className="p-4 rounded-2xl bg-navy-900/90 border border-slate-800 text-right">
                    <p className="text-xs uppercase font-bold text-slate-400">Visitor Identity</p>
                    <p className="text-xl font-bold text-white mt-0.5">{activeToken.customer_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activeToken.phone || 'Walk-in (No phone)'}</p>
                  </div>
                </div>

                {/* Ticket Handling Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Operator Case Notes (Persisted to Queue Logs)
                  </label>
                  <textarea
                    rows={2}
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    placeholder="Enter notes on service provided, documents collected, or special routing..."
                    className="w-full bg-navy-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Clock className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-300">No Active Ticket</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click 'Call Next Token' below to summon the highest priority waiting visitor according to the SymPy engine.
                </p>
              </div>
            )}

            {/* Action Bar: High-Contrast Touch Buttons */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Call Next */}
              <button
                onClick={handleCallNext}
                disabled={loading || activeCounter?.status !== 'ACTIVE'}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Next</span>
              </button>

              {/* Complete Service */}
              <button
                onClick={() => handleAction('COMPLETE')}
                disabled={loading || !activeToken}
                className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete</span>
              </button>

              {/* Skip / No-show */}
              <button
                onClick={() => handleAction('SKIP')}
                disabled={loading || !activeToken}
                className="py-3.5 px-4 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip / Absent</span>
              </button>

              {/* Transfer */}
              <button
                onClick={() => setShowTransferModal(true)}
                disabled={loading || !activeToken}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                <span>Transfer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel: Pending Queue List (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Live Waiting Queue ({waitingList.length})
            </h3>
            <span className="text-xs text-indigo-400 font-mono">Real-Time Triage</span>
          </div>

          <div className="glass-panel rounded-3xl p-4 border border-slate-800 max-h-[500px] overflow-y-auto space-y-2">
            {waitingList.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Queue is empty</p>
            ) : (
              waitingList.map((tok, idx) => (
                <div
                  key={tok.id}
                  className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-mono font-bold text-white text-sm">{tok.token_number}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[120px]">{tok.customer_name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      tok.priority_level === 'EMERGENCY'
                        ? 'bg-rose-500/20 text-rose-300'
                        : tok.priority_level === 'VIP'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tok.priority_level}
                    </span>
                    <p className="text-[10px] text-amber-400 font-mono mt-0.5">~{tok.estimated_wait_mins}m</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-indigo-500/40 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Transfer Token {activeToken?.token_number}</h3>
            <p className="text-xs text-slate-400">
              Select destination service desk. The ticket will re-enter the queue with preserved priority.
            </p>

            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(Number(e.target.value))}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.prefix}) — Avg {s.avg_service_time_mins} mins
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('TRANSFER')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
