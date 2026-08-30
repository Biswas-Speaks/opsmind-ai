'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import { Eye, Info, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AuditItem {
  _id: string;
  user?: { username: string; email: string };
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/audit-logs', { params: { page, limit: 15 } });
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pages);
        setTotal(res.data.data.total);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  if (user?.role?.name !== 'Super Admin' && user?.role?.name !== 'Auditor') {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Access Denied. Only Super Admin and Auditor accounts can view security audit logs.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Audit Logs</h2>
          <p className="text-slate-400 text-sm">Immutable trail tracking configuration modifications, tickets resolutions, and assets checkouts.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold rounded-md px-3 py-1.5 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          <span>Active Log Guard</span>
        </div>
      </div>

      {/* Audit logs timeline table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">No audit logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-350 border-collapse">
              <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity type</th>
                  <th className="px-6 py-4">Entity ID</th>
                  <th className="px-6 py-4">Changes</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-200">
                      {log.user ? log.user.username : 'System'}
                    </td>
                    <td className="px-6 py-4 font-sans font-semibold text-blue-400">{log.action}</td>
                    <td className="px-6 py-4 font-sans">{log.entity}</td>
                    <td className="px-6 py-4 text-slate-500">{log.entityId || 'N/A'}</td>
                    <td className="px-6 py-4 font-sans max-w-xs truncate" title={log.newValue}>
                      {log.oldValue && <span className="text-red-400 mr-1.5">({log.oldValue})</span>}
                      <span className="text-slate-300">{log.newValue || 'No detailed diff'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total event logs)
          </span>
          <div className="flex space-x-2 font-semibold">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
