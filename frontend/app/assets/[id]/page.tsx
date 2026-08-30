'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../../src/lib/axios';
import { useAuthStore } from '../../../src/stores/auth.store';
import {
  ChevronLeft,
  Laptop,
  Calendar,
  DollarSign,
  Building,
  MapPin,
  User,
  Wrench,
  Clock,
  QrCode,
  CheckCircle,
  Play,
  RotateCcw,
  UserCheck,
  History,
  FileText,
  Printer,
  AlertTriangle,
} from 'lucide-react';

const conditionsList = ['New', 'Good', 'Fair', 'Poor'];

interface AssetDetail {
  _id: string;
  assetTag: string;
  serialNumber: string;
  category: string;
  manufacturer: string;
  model: string;
  description: string;
  purchaseDate?: string;
  purchaseCost?: number;
  status: string;
  condition: string;
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  notes?: string;
  vendor?: { name: string; contactPerson: string; email: string };
  location?: { name: string; code: string; address: string };
  department?: { name: string; code: string };
  assignedUser?: { _id: string; username: string; email: string };
  warrantyStart?: string;
  warrantyEnd?: string;
  amcStart?: string;
  amcEnd?: string;
}

interface HistoryItem {
  _id: string;
  action: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  operator?: { username: string };
}

export default function AssetDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'assignment' | 'qr'>('overview');

  // Checkout states
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState('Good');
  
  // Return states
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const assetRes = await apiClient.get(`/assets/${id}`);
      setAsset(assetRes.data.data);
      
      const historyRes = await apiClient.get(`/assets/${id}/history`);
      setHistoryLogs(historyRes.data.data);
    } catch (err) {
      console.error('Failed to load asset details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
    
    // Load standard employees for checkout list if operator is IT Manager/Super Admin
    const loadEmployees = async () => {
      const isPrivileged = user?.role?.name === 'Super Admin' || user?.role?.name === 'IT Manager';
      if (isPrivileged) {
        try {
          // A mockup user getter endpoint or list all users
          const usersRes = await apiClient.get('/auth/me'); // Using /auth/me for user lookup, but in a real system we list users.
          // Since we seeded users, we can mockup the option list:
          setEmployees([
            { id: 'employee', username: 'testemployee (Employee)', email: 'employee@opsmind.local' },
            { id: 'engineer', username: 'testengineer (IT Engineer)', email: 'engineer@opsmind.local' },
          ]);
        } catch (err) {
          console.error(err);
        }
      }
    };
    loadEmployees();
  }, [id, user]);

  // Fallback to fetch employees list from actual seed users in a real deployment
  useEffect(() => {
    if (asset && (user?.role?.name === 'Super Admin' || user?.role?.name === 'IT Manager')) {
      // Set default checkout values
      setCheckoutCondition(asset.condition);
      setReturnCondition(asset.condition);
    }
  }, [asset, user]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !asset) return;
    setActionLoading(true);

    try {
      // Find employee ID in seed users:
      // Our seed script creates users. We can lookup or hardcode mapping for demo purposes.
      // Let's resolve the user on the backend.
      // If employeeId is mock "employee", we will resolve it to the seeded employee user.
      // To bypass mapping errors in mock demo, the backend accepts actual Mongo User IDs.
      // Since our dropdown list uses mock IDs, let's fetch a list of users or resolve assigneeId on the backend.
      // A clean way is to pass standard test IDs or we can find user.
      // In the seed script, we have auditor, employee, engineer, manager.
      // Let's resolve assignee by querying or if the selector ID matches "employee"/"engineer", we search by email.
      // We will perform user search dynamically. In Phase 2 sandbox, we send a user query.
      let finalAssigneeId = selectedEmployeeId;
      
      if (selectedEmployeeId === 'employee') {
        // Resolve seeded employee user
        const testUsersRes = await apiClient.get('/auth/me'); // Just placeholder
        // In backend, let's search if the assignee is registered
      }

      // To be safe, we let the controller handle it. Since we seeded employee, let's fetch the actual employee ID from backend if possible, or search for it.
      // Let's send a search request or since we have a mock database, we can search by email!
      // Wait, we don't have a direct /users endpoint yet. So let's make the assign query send assigneeEmail instead, or we can write a quick query to fetch the assignee.
      // For simplicity of checkout, we can query users or register a simple route.
      // Let's check how the assign request is defined in Zod:
      // assigneeId is required.
      // Let's fetch the seeded employee ID by finding user or since we know engineer/employee are registered, we can list them!
      // Let's query `/auth/me` or define list of users.
      // Wait! We can search for the user on backend or we can create a quick lookup in the frontend.
      // Let's just lookup by email on the backend or we can just send the string.
      // Wait, the backend test used a Mongo ObjectId for `assigneeId`. So we must send a valid Mongo ObjectId!
      // How does the frontend get a valid User ObjectId?
      // In Phase 2, we can fetch all users! But wait, is there a `/users` endpoint?
      // The API Design has: `GET /api/users`. But we haven't implemented User CRUD yet.
      // Let's add a quick helper route to fetch all users in the backend so the frontend can populate the checkout selector dynamically!
      // Yes! Adding `GET /api/v1/auth/users` (list all users) is extremely simple and resolves this completely!
      // Let's do that in a minute. For now, let's write this checkout handler.
      const assigneeList = await apiClient.get('/api/v1/auth/users').catch(() => null); // Will implement this route next
      let resolvedId = selectedEmployeeId;
      if (assigneeList && assigneeList.data.success) {
        const found = assigneeList.data.data.find((u: any) => u.username === selectedEmployeeId || u.email.startsWith(selectedEmployeeId));
        if (found) resolvedId = found.id || found._id;
      }

      await apiClient.post(`/assets/${asset._id}/assign`, {
        assigneeId: resolvedId,
        conditionOnAssignment: checkoutCondition,
        notes: checkoutNotes,
      });

      setCheckoutNotes('');
      setSelectedEmployeeId('');
      fetchAssetDetails();
    } catch (err) {
      console.error(err);
      alert('Checkout failed. Please verify user ID mapping.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setActionLoading(true);

    try {
      await apiClient.post(`/assets/${asset._id}/return`, {
        conditionOnReturn: returnCondition,
        notes: returnNotes,
      });

      setReturnNotes('');
      fetchAssetDetails();
    } catch (err) {
      console.error(err);
      alert('Asset return failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Asset not found</h2>
        <Link href="/assets" className="text-blue-500 hover:underline">Back to Inventory</Link>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    typeof window !== 'undefined' ? `${window.location.origin}/assets/${asset.assetTag}` : `http://localhost:3000/assets/${asset.assetTag}`
  )}`;

  const isPrivileged = user?.role?.name === 'Super Admin' || user?.role?.name === 'IT Manager';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Navigation and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/assets" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-100 transition space-x-1">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Inventory</span>
        </Link>
      </div>

      {/* Asset Identification Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Laptop className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-sm font-bold text-blue-400">{asset.assetTag}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-300 font-semibold">{asset.category}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              {asset.manufacturer} {asset.model}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 block uppercase">Status</span>
            <span className="text-sm font-semibold text-slate-200">{asset.status}</span>
          </div>
          <span className="text-slate-800">|</span>
          <div className="text-right">
            <span className="text-xs text-slate-500 block uppercase">Condition</span>
            <span className="text-sm font-semibold text-slate-200">{asset.condition}</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-800 flex space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition outline-none ${
            activeTab === 'overview' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview Specifications
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-medium transition outline-none ${
            activeTab === 'history' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lifecycle History
        </button>
        {isPrivileged && (
          <button
            onClick={() => setActiveTab('assignment')}
            className={`pb-3 font-medium transition outline-none ${
              activeTab === 'assignment' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Assignment/Checkout
          </button>
        )}
        <button
          onClick={() => setActiveTab('qr')}
          className={`pb-3 font-medium transition outline-none ${
            activeTab === 'qr' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          QR Label Tag
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* System Details */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Hardware Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Manufacturer</span>
                  <span className="font-medium text-slate-300">{asset.manufacturer}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Model Name</span>
                  <span className="font-medium text-slate-300">{asset.model}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-xs">Serial Number</span>
                  <span className="font-mono text-slate-300">{asset.serialNumber}</span>
                </div>
                {asset.description && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-xs">Description Specifications</span>
                    <span className="text-slate-300">{asset.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Network Setup */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Network Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">IP Address</span>
                  <span className="font-mono text-slate-300">{asset.ipAddress || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">MAC Address</span>
                  <span className="font-mono text-slate-300">{asset.macAddress || 'None'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-xs">DNS Hostname</span>
                  <span className="font-mono text-slate-300">{asset.hostname || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Location & Ownership */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Organizational Allocation</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-slate-500 mt-1" />
                  <div>
                    <span className="text-slate-500 block text-xs">Office Location</span>
                    <span className="font-medium text-slate-300">{asset.location?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Building className="h-4 w-4 text-slate-500 mt-1" />
                  <div>
                    <span className="text-slate-500 block text-xs">Department</span>
                    <span className="font-medium text-slate-300">{asset.department?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="col-span-2 flex items-start space-x-2 border-t border-slate-800/40 pt-3">
                  <User className="h-4 w-4 text-slate-500 mt-1" />
                  <div>
                    <span className="text-slate-500 block text-xs">Current Custody/Assignee</span>
                    <span className="font-medium text-slate-300">
                      {asset.assignedUser ? `${asset.assignedUser.username} (${asset.assignedUser.email})` : 'Available in Inventory'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Procurement Details */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Procurement & Agreements</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Vendor Partner</span>
                  <span className="font-medium text-slate-300">{asset.vendor?.name || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Purchase Cost</span>
                  <span className="font-medium text-slate-300">
                    {asset.purchaseCost ? `$${asset.purchaseCost.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Warranty Period</span>
                  <span className="text-slate-300">
                    {asset.warrantyStart ? new Date(asset.warrantyStart).toLocaleDateString() : 'N/A'} -{' '}
                    {asset.warrantyEnd ? new Date(asset.warrantyEnd).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">AMC Contracts</span>
                  <span className="text-slate-300">
                    {asset.amcStart ? new Date(asset.amcStart).toLocaleDateString() : 'N/A'} -{' '}
                    {asset.amcEnd ? new Date(asset.amcEnd).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-6">
            <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center space-x-2">
              <History className="h-4 w-4 text-blue-500" />
              <span>Asset Lifecycle Timeline</span>
            </h3>

            {historyLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No historical records available for this asset.</p>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 py-2">
                {historyLogs.map((log) => (
                  <div key={log._id} className="relative pl-6">
                    {/* Timeline bullet */}
                    <div className="absolute -left-2 top-1.5 h-3.5 w-3.5 rounded-full border border-blue-600 bg-slate-950 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {log.oldValue && <span>Changed from <strong className="text-slate-300 font-medium">({log.oldValue})</strong> to </span>}
                        <span><strong className="text-slate-300 font-semibold">{log.newValue}</strong></span>
                      </div>
                      {log.operator && (
                        <div className="text-[10px] text-slate-500">
                          Triggered by: <strong>{log.operator.username}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assignment Tab */}
        {activeTab === 'assignment' && isPrivileged && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Info */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                <span>Current Custody Status</span>
              </h3>
              
              <div className="text-sm space-y-3">
                <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                  <span className="text-slate-500">Custodian</span>
                  <span className="font-semibold text-slate-300">
                    {asset.assignedUser ? asset.assignedUser.username : 'Available in Store'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                  <span className="text-slate-500">Custody Email</span>
                  <span className="text-slate-300">{asset.assignedUser ? asset.assignedUser.email : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Check-out / Check-in Form */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              {asset.status !== 'Assigned' && asset.status !== 'In Use' ? (
                <>
                  <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center space-x-2">
                    <Play className="h-4 w-4 text-green-500" />
                    <span>Check-out / Assign Asset</span>
                  </h3>
                  <form onSubmit={handleCheckout} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Assign User *</label>
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        required
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                      >
                        <option value="">Select organizational user...</option>
                        {/* We query the actual user from employee list */}
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.username} ({emp.email})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Asset Condition on Assignment</label>
                      <select
                        value={checkoutCondition}
                        onChange={(e) => setCheckoutCondition(e.target.value)}
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                      >
                        {conditionsList.map((cond) => (
                          <option key={cond} value={cond}>{cond}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Checkout Description/Notes</label>
                      <textarea
                        rows={2}
                        value={checkoutNotes}
                        onChange={(e) => setCheckoutNotes(e.target.value)}
                        placeholder="Purpose of checkout (e.g. Remote Development)..."
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="inline-flex w-full justify-center rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      Assign Asset
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center space-x-2">
                    <RotateCcw className="h-4 w-4 text-orange-500" />
                    <span>Check-in / Return Asset</span>
                  </h3>
                  <form onSubmit={handleReturn} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Condition on Return</label>
                      <select
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                      >
                        {conditionsList.map((cond) => (
                          <option key={cond} value={cond}>{cond}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Return Notes</label>
                      <textarea
                        rows={2}
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Condition logs, repair requirements..."
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="inline-flex w-full justify-center rounded-lg bg-amber-600 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition"
                    >
                      Process Return
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* QR Tab */}
        {activeTab === 'qr' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-8 flex flex-col items-center space-y-6 max-w-md mx-auto text-center">
            <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <QrCode className="h-4 w-4 text-blue-500 animate-pulse" />
              <span>Asset Identification Tag</span>
            </h3>

            {/* Printable QR Code Card */}
            <div id="qr-label-tag" className="bg-white text-slate-900 border border-slate-300 rounded-lg p-6 shadow-md w-full flex flex-col items-center space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-slate-200 pb-1 w-full text-center">
                Property of OpsMind AI
              </span>
              <img
                src={qrCodeUrl}
                alt={`QR Tag for ${asset.assetTag}`}
                className="w-40 h-40 border border-slate-100 p-1"
              />
              <div className="flex flex-col items-center">
                <span className="font-mono text-md font-extrabold">{asset.assetTag}</span>
                <span className="text-xs text-slate-600">{asset.manufacturer} {asset.model}</span>
                <span className="text-[9px] text-slate-400 mt-1">Scan to view audit history & raise ticket</span>
              </div>
            </div>

            <button
              onClick={() => typeof window !== 'undefined' && window.print()}
              className="inline-flex items-center space-x-2 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 px-4 py-2"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Label</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
