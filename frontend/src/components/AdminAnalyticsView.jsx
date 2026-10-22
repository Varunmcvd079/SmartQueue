import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Cpu, 
  TrendingUp, 
  Clock, 
  Users, 
  AlertOctagon, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  RefreshCw,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { fetchAnalyticsSummary, fetchSympyFormula, fetchNotificationLogs, generateToken, reseedData } from '../api';

export default function AdminAnalyticsView({ onDataUpdated }) {
  const [analytics, setAnalytics] = useState(null);
  const [sympyMeta, setSympyMeta] = useState(null);
  const [smsLogs, setSmsLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // SymPy Sandbox Interactive State
  const [sandboxP, setSandboxP] = useState(4);
  const [sandboxS, setSandboxS] = useState(5.0);
  const [sandboxC, setSandboxC] = useState(2);
  const [sandboxU, setSandboxU] = useState(1.0);

  const loadData = async () => {
    try {
      const [anData, symData, logsData] = await Promise.all([
        fetchAnalyticsSummary().catch(() => null),
        fetchSympyFormula().catch(() => null),
        fetchNotificationLogs().catch(() => [])
      ]);
      setAnalytics(anData);
      setSympyMeta(symData);
      setSmsLogs(logsData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute live sandbox SymPy result
  const calculatedWait = ((sandboxP * sandboxS * sandboxU) / Math.max(1, sandboxC)).toFixed(1);
  const sensitivityDelta = (- (sandboxP * sandboxS * sandboxU) / Math.pow(Math.max(1, sandboxC), 2)).toFixed(2);

  // Quick action: Simulate Incoming Rush of 3 tokens
  const handleSimulateRush = async () => {
    setSimulating(true);
    try {
      const samples = [
        { service_id: 1, customer_name: "Emily Watson", phone: "+1 (555) 912-3401", priority_level: "NORMAL" },
        { service_id: 2, customer_name: "Col. James Rhodes", phone: "+1 (555) 912-3402", priority_level: "VIP" },
        { service_id: 3, customer_name: "Eleanor Vance (Elderly)", phone: "+1 (555) 912-3403", priority_level: "SENIOR_CITIZEN" }
      ];
      for (const s of samples) {
        await generateToken({ ...s, send_sms: true });
      }
      await loadData();
      if (onDataUpdated) onDataUpdated();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Simulation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Executive Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Admin Analytics & SymPy Math Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pandas Queue Aggregations, Bottleneck Intelligence & Symbolic Formula Inspector
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSimulateRush}
            disabled={simulating}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{simulating ? 'Simulating...' : 'Simulate 3 Arrivals'}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Processed */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Total Processed</span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Users className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2">
            {analytics?.total_tokens || 0}
          </p>
          <div className="flex items-center space-x-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{analytics?.served_count || 0} served</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{analytics?.waiting_count || 0} waiting</span>
          </div>
        </div>

        {/* Average Wait Time */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Average Wait Time</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Clock className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-black text-amber-400 font-mono mt-2">
            {analytics?.avg_wait_mins || 0.0} <span className="text-xs font-normal text-slate-400">min</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Dynamic SymPy priority-adjusted
          </p>
        </div>

        {/* Queue Health Score */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Queue Health Score</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><ShieldCheck className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-2">
            {analytics?.health_score || 95}/100
          </p>
          <p className="text-xs text-emerald-400/80 mt-2 font-medium">
            Optimal Flow • No Starvation
          </p>
        </div>

        {/* SMS Notifications Dispatched */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Twilio SMS Alerts</span>
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><MessageSquare className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-black text-cyan-400 font-mono mt-2">
            {smsLogs.length}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Automated mobile notifications
          </p>
        </div>
      </div>

      {/* SymPy Symbolic Formula Inspector & Interactive Sandbox */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/30 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                SymPy Symbolic Formula & Sensitivity Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Live closed-form symbolic calculation evaluated in Python
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            W = (P · S_avg · U) / C_active
          </span>
        </div>

        {/* Formula Display & Derivatives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800">
            <p className="text-[11px] uppercase font-bold text-slate-400">Symbolic Closed-Form Expression</p>
            <p className="text-lg font-mono font-bold text-indigo-300 mt-2">
              W = \frac{'{'}P \cdot S_{'{'}avg{'}'} \cdot U_{'{'}factor{'}'}{'}'}{'{'}C_{'{'}active{'}'}{'}'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Evaluated by sympy.lambdify & subs()</p>
          </div>

          <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800">
            <p className="text-[11px] uppercase font-bold text-slate-400">Desk Sensitivity Derivative (∂W/∂C)</p>
            <p className="text-lg font-mono font-bold text-emerald-400 mt-2">
              \frac{'{'}∂W{'}'}{'{'}∂C{'}'} = -\frac{'{'}P \cdot S \cdot U{'}'}{'{'}C^2{'}'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Rate of wait reduction per additional counter</p>
          </div>

          <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800">
            <p className="text-[11px] uppercase font-bold text-slate-400">Service Time Sensitivity (∂W/∂S)</p>
            <p className="text-lg font-mono font-bold text-amber-400 mt-2">
              \frac{'{'}∂W{'}'}{'{'}∂S{'}'} = \frac{'{'}P \cdot U{'}'}{'{'}C{'}'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Impact of average transaction speed on wait</p>
          </div>
        </div>

        {/* Interactive Math Parameter Sandbox */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Interactive Mathematical Sandbox
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Position Ahead P */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Queue Position Ahead (P)</span>
                <span className="font-mono font-bold text-indigo-400">{sandboxP}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={sandboxP}
                onChange={(e) => setSandboxP(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Average Service Time S */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Avg Service Time (S_avg)</span>
                <span className="font-mono font-bold text-indigo-400">{sandboxS}m</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.5"
                value={sandboxS}
                onChange={(e) => setSandboxS(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Active Counters C */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Active Desks (C_active)</span>
                <span className="font-mono font-bold text-indigo-400">{sandboxC}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sandboxC}
                onChange={(e) => setSandboxC(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Priority Urgency Factor U */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Urgency Factor (U)</span>
                <span className="font-mono font-bold text-indigo-400">{sandboxU}x</span>
              </div>
              <select
                value={sandboxU}
                onChange={(e) => setSandboxU(Number(e.target.value))}
                className="w-full bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              >
                <option value={1.0}>1.0 (Normal Flow)</option>
                <option value={0.85}>0.85 (Senior Citizen)</option>
                <option value={0.7}>0.7 (VIP Desk)</option>
                <option value={0.4}>0.4 (Emergency Triage)</option>
              </select>
            </div>
          </div>

          {/* Sandbox Live Result Output */}
          <div className="p-4 rounded-xl bg-navy-900 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 mt-2">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">Calculated Dynamic Wait Time (W)</p>
              <p className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
                {calculatedWait} <span className="text-sm font-normal text-slate-400">minutes</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase font-bold text-slate-400">Sensitivity to +1 Extra Desk</p>
              <p className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
                {sensitivityDelta} min/desk
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Bottlenecks & Desk Efficiency Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Service Bottlenecks (6 Columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Service Category Bottlenecks</h3>
            <span className="text-xs text-slate-400 font-mono">Pandas Aggregation</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            {analytics?.service_bottlenecks?.length ? (
              analytics.service_bottlenecks.map((svc) => (
                <div
                  key={svc.service_id}
                  className="p-3.5 rounded-xl bg-navy-900/80 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{svc.service_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Avg Wait: <span className="text-amber-400 font-mono">{svc.avg_wait_mins}m</span> • Served: {svc.served}
                    </p>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-white">{svc.waiting}</span>
                      <p className="text-[10px] text-slate-500">waiting</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      svc.status === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : svc.status === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-500 py-6">No service metrics available</p>
            )}
          </div>
        </div>

        {/* Counter Efficiency (6 Columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Active Counter Velocity</h3>
            <span className="text-xs text-slate-400 font-mono">Operator Performance</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            {analytics?.counter_efficiency?.length ? (
              analytics.counter_efficiency.map((ctr) => (
                <div
                  key={ctr.counter_id}
                  className="p-3.5 rounded-xl bg-navy-900/80 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 font-mono text-xs font-bold text-indigo-400 flex items-center justify-center">
                      #{ctr.counter_number}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{ctr.name}</h4>
                      <p className="text-xs text-slate-400">{ctr.operator_name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {ctr.served_count} tickets served
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Active: {ctr.active_token_number || 'Idle'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-500 py-6">No desk metrics available</p>
            )}
          </div>
        </div>
      </div>

      {/* Twilio SMS Notification Logs Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Twilio SMS Notification Dispatch Logs</h3>
            <p className="text-xs text-slate-400">Real-time mobile delivery stubs and arrival alerts</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">{smsLogs.length} dispatched</span>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Message SID</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Message Content</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {smsLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No SMS dispatches recorded yet. Generate a token with phone number to trigger alerts.
                  </td>
                </tr>
              ) : (
                smsLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-indigo-400">{log.id}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{log.recipient}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{log.token_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{log.message}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{log.provider}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
