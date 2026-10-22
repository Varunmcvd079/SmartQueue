import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Cpu, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Users, 
  Layers, 
  Smartphone, 
  Tv, 
  BarChart, 
  Sparkles,
  ChevronRight,
  TrendingDown,
  Activity
} from 'lucide-react';

export default function LandingPage({ setActiveTab, liveData }) {
  // Interactive live token card state
  const [tokenWait, setTokenWait] = useState(4.5);
  const [activeCounterNum, setActiveCounterNum] = useState("03");
  const [isServing, setIsServing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenWait((prev) => {
        if (prev <= 1.0) {
          setIsServing(true);
          return 0.5;
        }
        return parseFloat((prev - 0.5).toFixed(1));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Cpu,
      title: "SymPy Symbolic Wait Time Predictor",
      tag: "Pure Math Engine",
      color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
      description: "Closed-form symbolic math evaluates queue wait-time derivatives dynamically: W = (P * S_avg * U) / C_active."
    },
    {
      icon: Zap,
      title: "Dynamic Priority & Anti-Starvation",
      tag: "Smart Scheduling",
      color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
      description: "Triage rules for Emergency, VIP, and Senior Citizens with automated time-aging bonuses that guarantee zero customer starvation."
    },
    {
      icon: Layers,
      title: "Multi-Counter Load Routing",
      tag: "Dynamic Dispatch",
      color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
      description: "Directs incoming traffic across dedicated inquiry counters, express triage desks, and cross-trained multi-service operators."
    },
    {
      icon: MessageSquare,
      title: "Twilio Real-Time SMS Notifications",
      tag: "Omnichannel Alerts",
      color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
      description: "Visitors roam freely in cafeterias or lobbies with automated SMS dispatch when their token is two positions away from being called."
    }
  ];

  return (
    <div className="min-h-screen space-y-20 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Glow backdrop decorative circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Gen Enterprise Queue Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Intelligent Queue <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400">Management System</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Eliminate physical lobby queues with closed-form SymPy symbolic wait-time predictions, dynamic multi-counter triage routing, and real-time Twilio SMS alerts.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => setActiveTab('kiosk')}
                className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>Get Digital Token</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('board')}
                className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 shadow-md transition-all duration-200"
              >
                <Tv className="w-4 h-4 text-emerald-400" />
                <span>Live Queue Board</span>
              </button>

              <button
                onClick={() => setActiveTab('login')}
                className="flex items-center space-x-2.5 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 font-bold text-sm border border-slate-700 transition-all duration-200"
              >
                <span>Staff & Admin Portal →</span>
              </button>

              <button
                onClick={() => setActiveTab('ticket')}
                className="flex items-center space-x-2 px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
              >
                <span>Track Ticket</span>
              </button>
            </div>

            {/* Quick Metrics under CTA */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">-48%</p>
                <p className="text-xs text-slate-400 font-medium">Perceived Wait Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-400 tracking-tight">100%</p>
                <p className="text-xs text-slate-400 font-medium">SymPy Deterministic ETA</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400 tracking-tight">0</p>
                <p className="text-xs text-slate-400 font-medium">Starvation Rate</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Token Demo Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              <div className="glass-panel rounded-2xl p-6 shadow-2xl relative border border-indigo-500/30 overflow-hidden">
                {/* Glowing top accent strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-600"></div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live Token Simulator</span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    SymPy Engine W-104
                  </span>
                </div>

                {/* Token Display Area */}
                <div className="py-6 text-center space-y-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    VIP Priority Pass
                  </span>

                  <h2 className="text-5xl font-black text-white tracking-tight font-mono">
                    Token A-104
                  </h2>

                  <p className="text-sm text-slate-400">
                    Customer: <span className="text-slate-200 font-medium">Dr. Jonathan Lee</span>
                  </p>
                </div>

                {/* Live ETA & Assigned Counter Widget */}
                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-800 bg-navy-900/60 rounded-xl p-3">
                  <div className="text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Estimated Wait</p>
                    <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
                      {tokenWait} <span className="text-xs font-normal text-slate-400">mins</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">SymPy dynamically adjusted</p>
                  </div>
                  <div className="text-center border-l border-slate-800">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Assigned Desk</p>
                    <p className="text-2xl font-bold text-indigo-400 font-mono mt-0.5">
                      Counter {activeCounterNum}
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">Financial Desk</p>
                  </div>
                </div>

                {/* Live SMS simulation toast */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-start space-x-3">
                  <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-200">Twilio SMS Alert Mockup</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      "SmartQueue: Token A-104 is approaching service at Counter 03. Please proceed to the waiting zone."
                    </p>
                  </div>
                </div>

                {/* Action button inside preview */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Status: {isServing ? 'Calling Now' : 'In Dynamic Queue'}</span>
                  <button 
                    onClick={() => setActiveTab('board')}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>Inspect Live Board</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">High-Reliability Architecture</h2>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            Engineered for High-Throughput Public Infrastructure
          </p>
          <p className="text-slate-400 text-sm sm:text-base">
            From hospital triage and government registration desks to financial branch networks, SmartQueue coordinates multiple desks with mathematical precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="glass-card rounded-2xl p-6 border transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-800/40 relative group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.tag}
                </span>
                <h3 className="text-lg font-bold text-white mt-3 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Comparison Card: Physical Manual Queues vs SmartQueue */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Physical Manual Queues vs. SmartQueue Digital Tracking
            </h2>
            <p className="text-slate-400 text-sm">
              See how replacing paper token slips and crowded lobbies transforms enterprise service velocity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Legacy Manual Queues */}
            <div className="rounded-2xl p-6 bg-rose-950/10 border border-rose-900/30 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-200">Physical Manual Queues</h3>
                  <p className="text-xs text-rose-400/80">Legacy Static Dispenser Slips</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-300 pt-2">
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>Zero wait time transparency:</strong> Visitors crowd counter desks asking "How much longer?".</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>Blind FIFO order:</strong> Critical emergency consultations wait behind routine inquiries.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>High abandonment & missed calls:</strong> Visitors leave for lunch and miss audio loudspeaker announcements.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>No operational analytics:</strong> Managers cannot identify bottlenecks or counter idle times.</span>
                </li>
              </ul>
            </div>

            {/* SmartQueue System */}
            <div className="rounded-2xl p-6 bg-emerald-950/15 border border-emerald-800/40 space-y-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-emerald-200">SmartQueue Digital Engine</h3>
                  <p className="text-xs text-emerald-400/80">Intelligent Real-Time Operations</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-200 pt-2">
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Dynamic SymPy ETA:</strong> Accurate mathematical predictions update automatically as counters open or close.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Triage with Starvation Protection:</strong> Priority tiers balanced with automated aging rate bonuses.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Twilio SMS & QR Tracking:</strong> Visitors roam freely and receive proactive mobile SMS summons.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Pandas Analytics & Audit Trail:</strong> Real-time desk velocity, bottleneck flags, and health scoring.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Launch Cards for Roles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white">Select a Workspace Module</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Direct access to all 4 system touchpoints</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('kiosk')}
            className="p-5 rounded-2xl glass-card hover:border-indigo-500 text-left transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:bg-indigo-600 transition-colors">
              <Users className="w-5 h-5 text-indigo-400 group-hover:text-white" />
            </div>
            <h4 className="font-bold text-white text-base">Self-Check-in Kiosk</h4>
            <p className="text-xs text-slate-400 mt-1">Touchscreen kiosk for visitors to register and print digital tokens.</p>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className="p-5 rounded-2xl glass-card hover:border-emerald-500 text-left transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-600 transition-colors">
              <Tv className="w-5 h-5 text-emerald-400 group-hover:text-white" />
            </div>
            <h4 className="font-bold text-white text-base">Public Lobby Board</h4>
            <p className="text-xs text-slate-400 mt-1">High-contrast 4K TV display showing 'Now Serving' and queue status.</p>
          </button>

          <button
            onClick={() => setActiveTab('counter')}
            className="p-5 rounded-2xl glass-card hover:border-cyan-500 text-left transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:bg-cyan-600 transition-colors">
              <Smartphone className="w-5 h-5 text-cyan-400 group-hover:text-white" />
            </div>
            <h4 className="font-bold text-white text-base">Counter Staff Hub</h4>
            <p className="text-xs text-slate-400 mt-1">Operator desk terminal to Call Next, Complete, Hold, or Transfer.</p>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className="p-5 rounded-2xl glass-card hover:border-amber-500 text-left transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-600 transition-colors">
              <BarChart className="w-5 h-5 text-amber-400 group-hover:text-white" />
            </div>
            <h4 className="font-bold text-white text-base">Admin & SymPy Math</h4>
            <p className="text-xs text-slate-400 mt-1">Inspect symbolic wait formulas, SMS dispatch logs, and Pandas throughput.</p>
          </button>
        </div>
      </section>
    </div>
  );
}
