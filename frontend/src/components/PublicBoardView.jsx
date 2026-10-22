import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Activity, 
  Layers, 
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function PublicBoardView({ liveData, onRefresh }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [boardTime, setBoardTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setBoardTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Play audio chime using Web Audio API synthesized notes
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Note 1: High crisp bell
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Note 2: Harmonious fifth higher
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.5);
    } catch (e) {
      console.warn("Audio chime not allowed:", e);
    }
  };

  const nowServing = liveData?.now_serving || [];
  const waitingList = liveData?.waiting_list || [];

  return (
    <div className="min-h-screen bg-navy-900 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar for Lobby Display */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Tv className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Lobby Queue Display Board
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Metropolitan Operations Center • Live Synchronization
            </p>
          </div>
        </div>

        {/* Controls: Audio Toggle, Refresh, Live Clock */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              soundEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>

          <button
            onClick={() => {
              playChime();
              if (onRefresh) onRefresh();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh Queue Board"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </button>

          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-white font-bold text-sm">
            {boardTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Split Screen Display Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDE: Now Serving (7 Columns on Large Screens) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-lg font-black uppercase tracking-wider text-emerald-400">
                Now Serving at Desks
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {nowServing.length} Active Desks
            </span>
          </div>

          {nowServing.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-3">
              <Users className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-xl font-bold text-slate-300">All Desks Standby</p>
              <p className="text-xs text-slate-500">Service desk operators will summon the next ticket shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nowServing.map((item, idx) => {
                const isEmergency = item.priority_level === 'EMERGENCY';
                const isVip = item.priority_level === 'VIP';
                return (
                  <div
                    key={idx}
                    className={`rounded-3xl p-6 border-2 transition-all duration-300 relative overflow-hidden shadow-xl ${
                      isEmergency
                        ? 'bg-rose-950/30 border-rose-500 glow-amber'
                        : 'bg-gradient-to-br from-navy-850 to-slate-900 border-emerald-500/80 glow-emerald'
                    }`}
                  >
                    {/* Glowing corner indicator */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-bold text-sm text-emerald-300 uppercase tracking-wide">
                          Counter {item.counter_number < 10 ? `0${item.counter_number}` : item.counter_number}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isEmergency 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : isVip 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.priority_level.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Huge Token Number Display */}
                    <div className="py-5 text-center">
                      <p className="text-xs text-slate-400 font-medium">Ticket Called</p>
                      <h3 className="text-5xl font-black text-white font-mono tracking-tight my-1 drop-shadow-md">
                        {item.token_number}
                      </h3>
                      <p className="text-base font-bold text-slate-200 mt-1">
                        {item.customer_name}
                      </p>
                      <p className="text-xs text-indigo-400 font-medium mt-0.5">
                        {item.service_name}
                      </p>
                    </div>

                    {/* Footer with Operator & Active Duration */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Operator: {item.operator_name || 'Staff'}</span>
                      <span className="font-mono text-emerald-400">
                        Active {item.elapsed_service_mins || 0}m
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Upcoming Queue (5 Columns on Large Screens) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-400">
                Upcoming in Queue ({waitingList.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">SymPy Prioritized Order</span>
          </div>

          <div className="glass-panel rounded-3xl p-4 border border-slate-800 max-h-[580px] overflow-y-auto space-y-2.5">
            {waitingList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
                <p className="text-base font-bold text-slate-300">Queue is Clear</p>
                <p className="text-xs">No pending tickets in line.</p>
              </div>
            ) : (
              waitingList.map((token, idx) => {
                const isEmergency = token.priority_level === 'EMERGENCY';
                const isVip = token.priority_level === 'VIP';
                const isSenior = token.priority_level === 'SENIOR_CITIZEN';

                return (
                  <div
                    key={token.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      idx === 0
                        ? 'bg-amber-500/10 border-amber-500/40 glow-amber'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Position & Token */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        idx === 0 
                          ? 'bg-amber-500 text-slate-950 font-black' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-lg text-white">
                            {token.token_number}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            isEmergency 
                              ? 'bg-rose-500/20 text-rose-300' 
                              : isVip 
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : isSenior
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {token.priority_level.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{token.customer_name}</p>
                        <p className="text-[10px] text-slate-500">{token.service_name}</p>
                      </div>
                    </div>

                    {/* Right: Estimated Wait Time */}
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Predicted ETA</p>
                      <p className="text-base font-extrabold text-amber-400 font-mono">
                        ~{token.estimated_wait_mins} <span className="text-[10px] font-normal text-slate-400">min</span>
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Waiting: {token.elapsed_wait_mins}m
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Statistics Marquee */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-slate-800/80">
          <div className="px-2">
            <p className="text-xs uppercase font-semibold text-slate-400">Average Service Time</p>
            <p className="text-2xl font-black text-indigo-400 font-mono mt-0.5">
              {liveData?.avg_service_time_mins || 5.0} <span className="text-xs font-normal text-slate-400">mins</span>
            </p>
          </div>

          <div className="px-2">
            <p className="text-xs uppercase font-semibold text-slate-400">Active Counters</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {liveData?.active_counters_count || 5} <span className="text-xs font-normal text-slate-400">desks</span>
            </p>
          </div>

          <div className="px-2">
            <p className="text-xs uppercase font-semibold text-slate-400">Served Today</p>
            <p className="text-2xl font-black text-white font-mono mt-0.5">
              {liveData?.total_served_today || 0} <span className="text-xs font-normal text-slate-400">visitors</span>
            </p>
          </div>

          <div className="px-2">
            <p className="text-xs uppercase font-semibold text-slate-400">Lobby Congestion Density</p>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${
                liveData?.queue_density === 'OPTIMAL' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : liveData?.queue_density === 'MODERATE'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400 animate-ping'
              }`}></span>
              <span className={`text-base font-extrabold uppercase tracking-wide ${
                liveData?.queue_density === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {liveData?.queue_density || 'OPTIMAL'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
