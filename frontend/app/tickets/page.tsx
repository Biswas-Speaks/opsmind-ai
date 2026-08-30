'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import {
  FileText,
  Search,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  User,
  Wrench,
  HelpCircle,
} from 'lucide-react';

interface TicketListItem {
  _id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  assignedTeam?: string;
  requester: { username: string; email: string };
  assignedEngineer?: { username: string };
  dueDate?: string;
  createdAt: string;
}

export default function TicketsPage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          limit: 10,
          search: search || undefined,
          category: category || undefined,
          priority: priority || undefined,
          status: status || undefined,
        };

        const res = await apiClient.get('/tickets', { params });
        setTickets(res.data.data.tickets);
        setTotalPages(res.data.data.pages);
        setTotal(res.data.data.total);
      } catch (err) {
        console.error('Failed to load tickets', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchTickets();
    }, 300);

    return () => clearTimeout(debounce);
  }, [page, search, category, priority, status]);

  // Reset page
  useEffect(() => {
    setPage(1);
  }, [search, category, priority, status]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Open':
        return <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 border border-blue-500/20"><HelpCircle className="h-3 w-3 mr-1" />Open</span>;
      case 'Assigned':
        return <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 border border-purple-500/20"><User className="h-3 w-3 mr-1" />Assigned</span>;
      case 'In Progress':
        return <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 border border-amber-500/20"><Clock className="h-3 w-3 mr-1" />In Progress</span>;
      case 'Resolved':
        return <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 border border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</span>;
      case 'Closed':
        return <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-400 border border-slate-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Closed</span>;
      case 'Escalated':
        return <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 border border-red-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Escalated</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">{st}</span>;
    }
  };

  const getPriorityBadge = (pr: string) => {
    switch (pr) {
      case 'Critical':
        return <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 text-xs">CRITICAL</span>;
      case 'High':
        return <span className="text-orange-400 font-semibold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 text-xs">HIGH</span>;
      case 'Medium':
        return <span className="text-yellow-400 font-medium bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 text-xs">MEDIUM</span>;
      default:
        return <span className="text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/20 text-xs">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IT Service Desk</h2>
          <p className="text-slate-400 text-sm">Raise support tickets, check SLA schedules, audit worklogs, and use AI troubleshooting guides.</p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Raise Ticket</span>
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ticket number, title, symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            <option value="Network">Network</option>
            <option value="CCTV">CCTV</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Server">Server</option>
            <option value="Application">Application</option>
            <option value="Security">Security</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Tickets Inventory list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-300">No tickets found</p>
            <p className="text-sm text-slate-500">You do not have any open tickets matching the selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Ticket Number</th>
                  <th className="px-6 py-4">Title & Requester</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Assigned Team/Staff</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-900/30 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-blue-400">{t.ticketNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200 truncate max-w-xs">{t.title}</div>
                      <div className="text-xs text-slate-500">Opened by: {t.requester.username}</div>
                    </td>
                    <td className="px-6 py-4">{t.category}</td>
                    <td className="px-6 py-4">{getPriorityBadge(t.priority)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-300 text-xs">{t.assignedEngineer?.username || 'Unassigned'}</div>
                      {t.assignedTeam && <div className="text-[10px] text-slate-500">{t.assignedTeam}</div>}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/tickets/${t._id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total tickets)
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
