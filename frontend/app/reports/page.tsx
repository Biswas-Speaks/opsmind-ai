'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import { BarChart3, PieChart, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';

interface ReportStats {
  tickets: {
    total: number;
    resolved: number;
    closed: number;
    byCategory: { name: string; value: number }[];
    byPriority: { name: string; value: number }[];
    byStatus: { name: string; value: number }[];
  };
  assets: {
    byCategory: { name: string; value: number }[];
  };
  sla: {
    compliant: number;
    breached: number;
    rate: number;
  };
}

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await apiClient.get('/reports');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load reports stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        You do not have access to view analytics reports or statistical data.
      </div>
    );
  }

  // Helper to get max count for relative bar scaling
  const getCategoryMax = () => Math.max(...stats.tickets.byCategory.map((c) => c.value), 1);
  const getPriorityMax = () => Math.max(...stats.tickets.byPriority.map((p) => p.value), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Operational Reports</h2>
        <p className="text-slate-400 text-sm">Incident metrics, SLA compliance performance ratings, and asset distribution statistics.</p>
      </div>

      {/* SLA Compliance panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between items-center text-center space-y-4">
          <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-4 border-slate-800">
            <span className="text-3xl font-extrabold text-blue-500">{stats.sla.rate}%</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-200 text-sm">SLA Compliance Rate</h4>
            <p className="text-xs text-slate-500 mt-1">Target threshold: 95.0% compliance</p>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-green-400 font-medium">{stats.sla.compliant} Met</span>
            <span className="text-red-400 font-medium">{stats.sla.breached} Breached</span>
          </div>
        </div>

        {/* Priority distributions bar chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4 md:col-span-2">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-850 pb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <span>Incidents by Priority</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            {stats.tickets.byPriority.map((pr) => {
              const pct = Math.round((pr.value / getPriorityMax()) * 100);
              return (
                <div key={pr.name} className="space-y-1">
                  <div className="flex justify-between text-slate-350">
                    <span className="font-medium">{pr.name}</span>
                    <span className="font-mono">{pr.value} Tickets</span>
                  </div>
                  <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-900">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        pr.name === 'Critical'
                          ? 'bg-red-500'
                          : pr.name === 'High'
                          ? 'bg-orange-500'
                          : pr.name === 'Medium'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Categories Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-850 pb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span>Incidents by Category</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            {stats.tickets.byCategory.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No incident categories recorded.</p>
            ) : (
              stats.tickets.byCategory.map((cat) => {
                const pct = Math.round((cat.value / getCategoryMax()) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-slate-350">
                      <span className="font-medium">{cat.name}</span>
                      <span className="font-mono">{cat.value}</span>
                    </div>
                    <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-900">
                      <div style={{ width: `${pct}%` }} className="bg-blue-600 h-full rounded-full" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assets by Category */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-850 pb-2 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-500" />
            <span>Asset Category Shares</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            {stats.assets.byCategory.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No asset categories recorded.</p>
            ) : (
              stats.assets.byCategory.map((cat) => {
                // Find total assets to calculate percentage
                const totalAssets = stats.assets.byCategory.reduce((sum, c) => sum + c.value, 0);
                const pctShare = Math.round((cat.value / totalAssets) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-slate-350">
                      <span className="font-medium">{cat.name}</span>
                      <span className="font-mono">{cat.value} ({pctShare}%)</span>
                    </div>
                    <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-900">
                      <div style={{ width: `${pctShare}%` }} className="bg-emerald-600 h-full rounded-full" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
