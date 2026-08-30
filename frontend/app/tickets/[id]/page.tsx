'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../../src/lib/axios';
import { useAuthStore } from '../../../src/stores/auth.store';
import {
  ChevronLeft,
  Clock,
  User,
  Wrench,
  HelpCircle,
  AlertTriangle,
  Play,
  CheckCircle,
  MessageSquare,
  FileText,
  Plus,
  Send,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface TicketDetails {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: string;
  status: string;
  assignedTeam?: string;
  assignedEngineer?: { _id: string; username: string; email: string };
  requester: { username: string; email: string };
  sla?: { priority: string; responseTime: number; resolutionTime: number };
  dueDate?: string;
  aiAnalysis?: {
    possibleCauses: string[];
    recommendedActions: string[];
    suggestedTeam: string;
  };
  resolution?: string;
}

interface CommentItem {
  _id: string;
  content: string;
  author: { username: string; email: string };
  createdAt: string;
}

interface WorklogItem {
  _id: string;
  timeSpent: number;
  description: string;
  engineer: { username: string };
  createdAt: string;
}

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [worklogs, setWorklogs] = useState<WorklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Comments & Worklogs Inputs
  const [commentInput, setCommentInput] = useState('');
  const [worklogTime, setWorklogTime] = useState(15);
  const [worklogDesc, setWorklogDesc] = useState('');

  // Assignments dropdown
  const [engineers, setEngineers] = useState<any[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');

  // Resolution states
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resError, setResError] = useState<string | null>(null);

  // AI assistant states
  const [aiSteps, setAiSteps] = useState<string>('');
  const [aiCitations, setAiCitations] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const res = await apiClient.get(`/tickets/${id}`);
      setTicket(res.data.data.ticket);
      setComments(res.data.data.comments);
      setWorklogs(res.data.data.worklogs);
      if (res.data.data.ticket.assignedEngineer) {
        setSelectedEngineerId(res.data.data.ticket.assignedEngineer._id);
      }
    } catch (err) {
      console.error('Failed to load ticket details', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTicketDetails().finally(() => setLoading(false));

    // Load engineer users for assignments selector
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get('/auth/users');
        const engs = res.data.data.filter((u: any) => u.role?.name === 'IT Engineer' || u.role?.name === 'IT Manager' || u.role?.name === 'Super Admin');
        setEngineers(engs);
      } catch (err) {
        console.error('Failed to load user directory', err);
      }
    };
    fetchUsers();
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const res = await apiClient.post(`/tickets/${ticket?._id}/comments`, { content: commentInput });
      setComments((prev) => [...prev, res.data.data]);
      setCommentInput('');
      fetchTicketDetails(); // Updates ticket status if modified
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worklogDesc.trim()) return;

    try {
      const res = await apiClient.post(`/tickets/${ticket?._id}/worklogs`, {
        timeSpent: Number(worklogTime),
        description: worklogDesc,
      });
      setWorklogs((prev) => [res.data.data, ...prev]);
      setWorklogDesc('');
      setWorklogTime(15);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignEngineer = async (engId: string) => {
    try {
      await apiClient.put(`/tickets/${ticket?._id}`, {
        assignedEngineerId: engId || null,
      });
      setSelectedEngineerId(engId);
      fetchTicketDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    setResolving(true);
    setResError(null);

    try {
      await apiClient.post(`/tickets/${ticket?._id}/resolve`, {
        resolution: resolutionNotes,
      });
      setResolutionNotes('');
      fetchTicketDetails();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Resolution verification rejected by AI checks.';
      setResError(msg);
    } finally {
      setResolving(false);
    }
  };

  const handleAskAIAssistant = async () => {
    setAiLoading(true);
    try {
      const res = await apiClient.get(`/tickets/${ticket?._id}/troubleshoot`);
      setAiSteps(res.data.data.steps);
      setAiCitations(res.data.data.citations);
    } catch (err) {
      console.error(err);
      setAiSteps('Failed to load troubleshooting instructions.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Ticket not found</h2>
        <Link href="/tickets" className="text-blue-500 hover:underline">Back to Tickets</Link>
      </div>
    );
  }

  const isEngineer = user?.role?.name === 'IT Engineer' || user?.role?.name === 'IT Manager' || user?.role?.name === 'Super Admin';
  const isManager = user?.role?.name === 'IT Manager' || user?.role?.name === 'Super Admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link href="/tickets" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-100 transition space-x-1">
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Tickets</span>
      </Link>

      {/* Ticket Identity Ribbon */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-sm font-bold text-blue-400">{ticket.ticketNumber}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-semibold bg-slate-850 px-2 py-0.5 rounded border border-slate-800">{ticket.category}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{ticket.title}</h2>
          <p className="text-xs text-slate-500">Opened by: {ticket.requester.username} ({ticket.requester.email})</p>
        </div>

        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">PRIORITY</span>
            <span className="font-semibold text-slate-200">{ticket.priority}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-xs text-slate-500 block">STATUS</span>
            <span className="font-semibold text-slate-200">{ticket.status}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-xs text-slate-500 block">DUE DATE</span>
            <span className="font-mono text-xs text-slate-300">
              {ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details, Comments, Worklogs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ticket Description */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
            <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Symptoms Description</h3>
            <p className="text-slate-350 text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Comments System */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
            <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span>Discussion Thread</span>
            </h3>

            {/* List comments */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No discussions logged on this ticket yet.</p>
              ) : (
                comments.map((com) => (
                  <div key={com._id} className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-slate-300">{com.author.username}</span>
                      <span className="font-mono text-[10px]">{new Date(com.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-350 whitespace-pre-wrap">{com.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post comment */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your response..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 text-xs text-slate-300 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Labor Worklogs (IT Staff Only) */}
          {isEngineer && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center space-x-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>Labor hours Worklog</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <form onSubmit={handlePostWorklog} className="md:col-span-1 space-y-3 bg-slate-900/40 border border-slate-850 p-4 rounded-lg text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Time Spent (Minutes) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={worklogTime}
                      onChange={(e) => setWorklogTime(Number(e.target.value))}
                      className="block w-full rounded-md border border-slate-800 bg-slate-950/80 py-1.5 px-2.5 text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Work Description *</label>
                    <textarea
                      required
                      rows={2}
                      value={worklogDesc}
                      onChange={(e) => setWorklogDesc(e.target.value)}
                      placeholder="e.g. Cleared teams cache directories..."
                      className="block w-full rounded-md border border-slate-800 bg-slate-950/80 py-1.5 px-2.5 text-slate-200 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md bg-emerald-600 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    Log Time
                  </button>
                </form>

                {/* Logged records */}
                <div className="md:col-span-2 space-y-3 max-h-48 overflow-y-auto pr-1">
                  {worklogs.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No labor hours logged yet.</p>
                  ) : (
                    worklogs.map((wl) => (
                      <div key={wl._id} className="border-b border-slate-800/40 pb-2.5 text-xs">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Engineer: <strong>{wl.engineer.username}</strong></span>
                          <span>{wl.timeSpent} mins • {new Date(wl.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 mt-1">{wl.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: AI Diagnoser, Assignments, Resolutions */}
        <div className="space-y-6">

          {/* Assignments Panel (Manager/Super Admin Only) */}
          {isManager && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5">Assign Operations Representative</h4>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Select IT Specialist</label>
                <select
                  value={selectedEngineerId}
                  onChange={(e) => handleAssignEngineer(e.target.value)}
                  className="block w-full rounded-md border border-slate-800 bg-slate-950/80 py-1.5 px-2 text-slate-300 outline-none focus:border-blue-500"
                >
                  <option value="">Unassigned / Pool Queue</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.username} ({eng.role?.name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* AI Troubleshooting & SOP pane */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h4 className="font-bold text-slate-200 flex items-center space-x-2 text-sm">
                <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                <span>AI Troubleshooting Console</span>
              </h4>
              <button
                onClick={handleAskAIAssistant}
                disabled={aiLoading}
                className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold px-2 py-1 rounded hover:bg-blue-600/25 transition disabled:opacity-50"
              >
                {aiLoading ? 'Analyzing...' : 'Diagnose SOP'}
              </button>
            </div>

            {aiSteps ? (
              <div className="space-y-4 text-xs">
                {/* RAG Citations */}
                {aiCitations.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-lg space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      <span>RAG Knowledge Citations</span>
                    </span>
                    <div className="space-y-1.5">
                      {aiCitations.map((cit, i) => (
                        <div key={i} className="border-l-2 border-blue-500/40 pl-2">
                          <span className="font-semibold text-slate-300 text-[10px] block">{cit.title} ({cit.category})</span>
                          <p className="text-slate-400 text-[9px] line-clamp-2">{cit.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-950/85 border border-slate-900 p-4 rounded-lg text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {aiSteps}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                Click **Diagnose SOP** to trigger the agentic troubleshooting pipeline.
              </p>
            )}
          </div>

          {/* Resolution form (IT Staff Only) */}
          {isEngineer && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center space-x-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Resolve Incident Incident</span>
              </h4>

              {resError && (
                <div className="flex items-start space-x-1 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-[10px] text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{resError}</span>
                </div>
              )}

              <form onSubmit={handleResolveTicket} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Resolution Actions Taken *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide troubleshooting details. The AI validation agent reviews this before resolving..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="block w-full rounded-md border border-slate-800 bg-slate-950/80 py-1.5 px-2 text-slate-300 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resolving}
                  className="inline-flex w-full justify-center items-center space-x-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md disabled:opacity-50"
                >
                  {resolving ? 'AI Reviewing...' : 'Resolve Ticket'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
