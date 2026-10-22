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
  LayoutDashboard,
  Plus,
  UserPlus,
  Headphones,
  Settings,
  LogOut,
  Tv,
  ArrowUpRight
} from 'lucide-react';
import { 
  fetchAnalyticsSummary, 
  fetchSympyFormula, 
  fetchAdminAuditLogs, 
  fetchAdminStaff,
  createAdminService,
  assignStaffToCounter,
  reseedData,
  generateToken,
  getStoredUser,
  clearAuthSession
} from '../api';

export default function AdminDashboardView({ 
  counters, 
  services, 
  onDataUpdated, 
  navigateTo 
}) {
  const currentUser = getStoredUser();

  // Strict Security Guard: Non-admin users MUST be blocked
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      navigateTo('login');
    }
  }, [currentUser, navigateTo]);

  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // New Service Form Modal state
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrefix, setNewServicePrefix] = useState('');
  const [newServiceTime, setNewServiceTime] = useState(5.0);

  // Assign Staff Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCounterForAssign, setSelectedCounterForAssign] = useState(counters[0]?.id || 1);
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState(null);

  const loadAdminData = async () => {
    try {
      const [anData, logsData, staffData] = await Promise.all([
        fetchAnalyticsSummary().catch(() => null),
        fetchAdminAuditLogs().catch(() => []),
        fetchAdminStaff().catch(() => [])
      ]);
      setAnalytics(anData);
      setAuditLogs(logsData || []);
      setStaffAccounts(staffData || []);
      if (staffData?.length && !selectedStaffForAssign) {
        setSelectedStaffForAssign(staffData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return null;
  }

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrefix) return;
    try {
      await createAdminService({
        name: newServiceName,
        prefix: newServicePrefix,
        avg_service_time_mins: Number(newServiceTime)
      });
      setShowAddService(false);
      setNewServiceName('');
      setNewServicePrefix('');
      if (onDataUpdated) onDataUpdated();
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedCounterForAssign || !selectedStaffForAssign) return;
    try {
      await assignStaffToCounter(selectedCounterForAssign, selectedStaffForAssign);
      setShowAssignModal(false);
      if (onDataUpdated) onDataUpdated();
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSimulateRush = async () => {
    setSimulating(true);
    try {
      const samples = [
        { service_id: 1, customer_name: "Eleanor Roosevelt", phone: "+1 (555) 019-1122", priority_level: "NORMAL" },
        { service_id: 2, customer_name: "Dean Arthur Vance", phone: "+1 (555) 019-2233", priority_level: "VIP" },
        { service_id: 3, customer_name: "Dr. Harold Finch", phone: "+1 (555) 019-3344", priority_level: "EMERGENCY" }
      ];
      for (const s of samples) {
        await generateToken({ ...s, send_sms: true });
      }
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } finally {
      setSimulating(false);
    }
  };

  const handleReseed = async () => {
    if (confirm("Reset and reseed queue database with standard test scenarios?")) {
      await reseedData();
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigateTo('login');
  };

  const totalTokens = analytics?.total_tokens || 0;
  const servedCount = analytics?.served_count || 0;
  const throughputPct = totalTokens > 0 ? Math.round((servedCount / totalTokens) * 100) : 100;

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Persistent Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-850/95 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="p-5 space-y-6">
          {/* Admin Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-white truncate">{currentUser.username}</p>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SYSTEM ADMIN
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm font-semibold">
            <button
              onClick={() => navigateTo('admin')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Console</span>
            </button>

            <button
              onClick={() => navigateTo('staff')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Headphones className="w-4 h-4" />
              <span>Staff Operator Hub</span>
            </button>

            <button
              onClick={() => navigateTo('board')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Tv className="w-4 h-4" />
              <span>Lobby Display Board</span>
            </button>

            <button
              onClick={() => navigateTo('kiosk')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Layers className="w-4 h-4" />
              <span>Self-Service Kiosk</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-slate-850/90 backdrop-blur-md border-b border-slate-800 p-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Enterprise Admin Control Center
            </h1>
            <p className="text-xs text-slate-400">
              Department Configuration, Counter Scheduling & Real-Time System Audit Logs
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSimulateRush}
              disabled={simulating}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{simulating ? 'Simulating...' : 'Simulate Rush (3 Visitors)'}</span>
            </button>

            <button
              onClick={handleReseed}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
            >
              Reset Demo
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl">
          {/* Stat Summary Cards with micro-sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Processed */}
            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Total Tokens Processed</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-white font-mono mt-2">
                {totalTokens}
              </p>
              {/* Micro Sparkline */}
              <div className="mt-3 flex items-end space-x-1 h-4">
                {[40, 60, 45, 75, 55, 80, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-500/40 rounded-t" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {servedCount} served • {analytics?.waiting_count || 0} in queue
              </p>
            </div>

            {/* Average Wait Time */}
            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Average Wait Time</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-400 font-mono mt-2">
                {analytics?.avg_wait_mins || 0.0} <span className="text-xs font-normal text-slate-400">min</span>
              </p>
              {/* Micro Sparkline */}
              <div className="mt-3 flex items-end space-x-1 h-4">
                {[80, 70, 65, 50, 45, 40, 30].map((h, i) => (
                  <div key={i} className="flex-1 bg-amber-500/40 rounded-t" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                SymPy dynamic priority adjusted
              </p>
            </div>

            {/* Active Counters */}
            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Active Counters</span>
                <Headphones className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400 font-mono mt-2">
                {counters.filter(c => c.status === 'ACTIVE').length} / {counters.length}
              </p>
              {/* Micro Sparkline */}
              <div className="mt-3 flex items-end space-x-1 h-4">
                {[60, 60, 80, 80, 100, 100, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-500/40 rounded-t" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Multi-desk operational capacity
              </p>
            </div>

            {/* Throughput % */}
            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Queue Throughput %</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-cyan-400 font-mono mt-2">
                {throughputPct}%
              </p>
              {/* Micro Sparkline */}
              <div className="mt-3 flex items-end space-x-1 h-4">
                {[30, 45, 60, 70, 85, 90, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-cyan-500/40 rounded-t" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Health Score: {analytics?.health_score || 95}/100
              </p>
            </div>
          </div>

          {/* Department / Service Management & Counter Desk Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Department / Service Configuration (6 Columns) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Department & Service Categories</h3>
                <button
                  onClick={() => setShowAddService(true)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-semibold border border-indigo-500/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Department</span>
                </button>
              </div>

              <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-2.5">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                          {svc.prefix}
                        </span>
                        <h4 className="font-bold text-white text-sm">{svc.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{svc.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {svc.avg_service_time_mins} min avg
                      </span>
                      <p className="text-[10px] text-emerald-400 mt-0.5">{svc.waiting_count || 0} in queue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Counter Management (6 Columns) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Active Counter Scheduling</h3>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold border border-emerald-500/30"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Staff</span>
                </button>
              </div>

              <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-2.5">
                {counters.map((ctr) => (
                  <div
                    key={ctr.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 font-mono text-xs font-bold text-indigo-400 flex items-center justify-center">
                        0{ctr.counter_number}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{ctr.name}</h4>
                        <p className="text-xs text-slate-400">
                          Assigned Staff: <strong className="text-slate-200">{ctr.operator_name || 'Unassigned'}</strong>
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ctr.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {ctr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time System Audit Log Stream */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Real-Time System Audit Log Stream</h3>
                <p className="text-xs text-slate-400">
                  Immutable record of ticket creations, calls, transfers, and completions
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-400">{auditLogs.length} events logged</span>
            </div>

            <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Desk Counter</th>
                    <th className="px-4 py-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            log.action === 'COMPLETED' || log.action === 'SERVED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : log.action === 'CALLED'
                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                              : log.action === 'GENERATED'
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          {log.token_number || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono">
                          {log.counter_number ? `Desk 0${log.counter_number}` : 'Kiosk Entry'}
                        </td>
                        <td className="px-4 py-3 text-slate-300 max-w-sm truncate">
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateService} className="bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Department / Service</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Service Name</label>
              <input
                type="text"
                required
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g. Student Health Center"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Token Prefix</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={newServicePrefix}
                  onChange={(e) => setNewServicePrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. H"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Avg Duration (mins)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={newServiceTime}
                  onChange={(e) => setNewServiceTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddService(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
              >
                Create Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Assign Staff Operator to Counter</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Counter</label>
              <select
                value={selectedCounterForAssign}
                onChange={(e) => setSelectedCounterForAssign(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Counter 0{c.counter_number} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Staff Account</label>
              <select
                value={selectedStaffForAssign}
                onChange={(e) => setSelectedStaffForAssign(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                {staffAccounts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.username} ({s.role}) — {s.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignStaff}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
