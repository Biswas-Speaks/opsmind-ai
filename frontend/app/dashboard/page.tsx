'use client';

import { useAuthStore } from '../../src/stores/auth.store';
import {
  Laptop,
  Ticket,
  AlertOctagon,
  Clock,
  Wrench,
  WifiOff,
  Cpu,
  ArrowUpRight,
  Database,
  Radio,
  Server,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Statistics mockup for Phase 1
  const stats = [
    { name: 'Total Assets', value: '150', icon: Laptop, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Open Tickets', value: '18', icon: Ticket, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Critical Tickets', value: '3', icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'SLA At Risk / Breached', value: '2 / 1', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Under Maintenance', value: '5', icon: Wrench, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Offline Infrastructure', value: '2', icon: WifiOff, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            Welcome back, <span className="text-blue-400">{user?.username}</span>!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            System status is <strong className="text-green-400">Nominal</strong>. Here is what is happening in your IT operations center today.
          </p>
        </div>
        <div className="flex items-center space-x-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3.5 py-1 text-xs text-blue-400 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span>
          <span>Phase 1 Sandbox Mode</span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium truncate">{stat.name}</span>
                <div className={`p-1.5 rounded-md ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-semibold tracking-tight">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-200">Quick Console Operations</h3>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-sm font-medium transition text-left">
              <span>Register New Asset</span>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </button>
            <button className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-sm font-medium transition text-left">
              <span>Raise IT Ticket</span>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </button>
            <button className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-sm font-medium transition text-left">
              <span>Upload SOP Manual</span>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* AI Recommendations Stream (Mocked for Phase 1) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-200">Agentic AI Insights</h3>
            <Cpu className="h-4 w-4 text-purple-500" />
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 p-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-400">TKT-821 SLA Alert</span>
                <span className="text-[10px] text-slate-500">10m ago</span>
              </div>
              <p className="text-slate-300">
                AI classified ticket &apos;ERP system unreachable&apos; as <strong>Critical</strong> priority. Recommending auto-routing to <strong>Infrastructure Team</strong>.
              </p>
              <div className="flex space-x-2 pt-1.5">
                <button className="bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded text-[10px] text-white font-semibold">
                  Approve Routing
                </button>
                <button className="border border-slate-800 hover:bg-slate-800 px-2.5 py-1 rounded text-[10px] text-slate-300">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Observability / Health Checks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-200">Observability & Health</h3>
            <Server className="h-4 w-4 text-blue-500" />
          </div>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Database className="h-4 w-4 text-emerald-500" />
                <span>Mongoose Database</span>
              </div>
              <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">
                Healthy
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span>Redis cache / queues</span>
              </div>
              <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">
                Healthy
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span>AI Providers</span>
              </div>
              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">
                Configured
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Radio className="h-4 w-4 text-emerald-500" />
                <span>Socket.IO Gateway</span>
              </div>
              <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">
                Online
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
