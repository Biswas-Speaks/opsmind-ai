'use client';

import Link from 'next/link';
import { useAuthStore } from '../src/stores/auth.store';
import { Shield, Cpu, Activity, Clock, FileText } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="h-6 w-6 text-blue-500 animate-pulse" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              OpsMind AI
            </span>
          </div>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-400">
                  Welcome, <strong className="text-slate-200">{user?.username}</strong> ({user?.role?.name})
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 font-semibold mb-2">
            <span>Enterprise Operations Console</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Intelligent IT Operations & <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Asset Management Platform
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400">
            OpsMind AI leverages multi-agent orchestrations and RAG knowledge bases to automate asset life cycle, streamline service desk tickets, and simulate real-time CCTV monitoring.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-6 font-medium text-white shadow-lg hover:bg-blue-700 transition"
              >
                Access Console
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-6 font-medium text-white shadow-lg hover:bg-blue-700 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-6 font-medium text-slate-200 hover:bg-slate-800 transition"
                >
                  Create Demo Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <Activity className="h-10 w-10 text-blue-500" />
            <h3 className="font-bold text-lg">Asset Lifecycles</h3>
            <p className="text-sm text-slate-400">
              Track registration, configuration, location mapping, and QR scanning endpoints for operational hardware and licenses.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <Cpu className="h-10 w-10 text-indigo-500" />
            <h3 className="font-bold text-lg">Agentic AI Resolution</h3>
            <p className="text-sm text-slate-400">
              RAG-supported multi-agent workflow analyzing SLA, priority, categorizations, and detailed step-by-step troubleshooting.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <Shield className="h-10 w-10 text-purple-500" />
            <h3 className="font-bold text-lg">Secure & Audited</h3>
            <p className="text-sm text-slate-400">
              Role-Based Access Controls enforcing granular route security, activity timelines, and immutable system audit logs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 OpsMind AI. All rights reserved.</p>
          <div className="flex space-x-4">
            <span>System Health: Nominal</span>
            <span>API v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
