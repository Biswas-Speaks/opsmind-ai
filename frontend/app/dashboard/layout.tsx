'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../src/stores/auth.store';
import { apiClient } from '../../src/lib/axios';
import {
  LayoutDashboard,
  Cpu,
  Laptop,
  Ticket,
  Users,
  Building2,
  MapPin,
  Truck,
  BookOpen,
  Eye,
  LogOut,
  Menu,
  X,
  Bell,
  Clock,
  BarChart3,
  Shield,
  Settings,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  // Sidebar Links config based on role check
  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Assets', href: '/assets', icon: Laptop },
    { name: 'Tickets', href: '/tickets', icon: Ticket },
    { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
    { name: 'Infrastructure Monitor', href: '/infrastructure', icon: Eye },
    { name: 'Reports', href: '/reports', icon: BarChart3, privilegedOnly: true },
    { name: 'Audit Logs', href: '/audit-logs', icon: Shield, adminOnly: true },
    { name: 'Users', href: '/users', icon: Users, adminOnly: true },
    { name: 'Departments', href: '/departments', icon: Building2, adminOnly: true },
    { name: 'Locations', href: '/locations', icon: MapPin, adminOnly: true },
    { name: 'Vendors', href: '/vendors', icon: Truck, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredLinks = links.filter((link) => {
    if (link.adminOnly && user?.role?.name !== 'Super Admin') return false;
    if (link.privilegedOnly && (user?.role?.name !== 'Super Admin' && user?.role?.name !== 'IT Manager' && user?.role?.name !== 'Auditor')) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-sm h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-2">
          <Cpu className="h-6 w-6 text-blue-500" />
          <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            OpsMind AI
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="relative flex flex-col w-64 max-w-xs border-r border-slate-800 bg-slate-900 h-full p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-lg">OpsMind AI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/5 transition mt-auto"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white mr-4"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-md lg:text-lg font-semibold text-slate-200">
              Operations Console
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Clock & Status */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-950 px-2.5 py-1.5 rounded-md border border-slate-800">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>12:00:00 (Nominal)</span>
            </div>

            {/* Notification bell */}
            <button className="relative text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-850 transition">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>
            </button>

            {/* User Profile dropdown mockup */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-850">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-slate-200">{user?.username}</span>
                <span className="text-xs text-blue-400 font-semibold">{user?.role?.name}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white select-none">
                {user?.username ? user.username[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
