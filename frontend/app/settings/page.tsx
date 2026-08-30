'use client';

import { useAuthStore } from '../../src/stores/auth.store';
import { Shield, Eye, HelpCircle, HardDrive, Key, UserCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-slate-400 text-sm">Monitor platform health, view credentials references, and verify security protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
          <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-500" />
            <span>Active Operator Profile</span>
          </h3>

          <div className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Username</span>
              <span className="font-semibold text-slate-350">{user?.username || 'Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email Address</span>
              <span className="text-slate-350">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Access Role</span>
              <span className="font-semibold text-blue-400">{user?.role?.name || 'Standard User'}</span>
            </div>
          </div>
        </div>

        {/* Security & API config */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
          <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-500" />
            <span>AI Subsystem Settings</span>
          </h3>

          <div className="text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Gemini Engine API</span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono text-[10px]">
                {process.env.GEMINI_API_KEY ? 'Active (Real API)' : 'Rule Fallback (Simulation)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">RAG Vector Dimensions</span>
              <span className="font-mono text-slate-350">768 Float Vectors</span>
            </div>
          </div>
        </div>

        {/* Reference Seed accounts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-3 md:col-span-2 text-xs">
          <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <span>Sandbox Seeding Account References</span>
          </h3>

          <p className="text-slate-400 mb-2">Use these predefined accounts to test permissions and operational scopes:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-lg">
              <span className="font-bold text-slate-200 block">Super Admin</span>
              <p className="text-[10px] text-slate-500 mt-1">admin@opsmind.local / admin123</p>
            </div>
            <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-lg">
              <span className="font-bold text-slate-200 block">IT Manager</span>
              <p className="text-[10px] text-slate-500 mt-1">manager@opsmind.local / manager123</p>
            </div>
            <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-lg">
              <span className="font-bold text-slate-200 block">IT Engineer</span>
              <p className="text-[10px] text-slate-500 mt-1">engineer@opsmind.local / engineer123</p>
            </div>
            <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-lg">
              <span className="font-bold text-slate-200 block">Employee</span>
              <p className="text-[10px] text-slate-500 mt-1">employee@opsmind.local / employee123</p>
            </div>
            <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-lg">
              <span className="font-bold text-slate-200 block">Auditor</span>
              <p className="text-[10px] text-slate-500 mt-1">auditor@opsmind.local / auditor123</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
