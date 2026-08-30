'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import { io } from 'socket.io-client';
import {
  Video,
  Database,
  Radio,
  Sliders,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Server,
  Activity,
} from 'lucide-react';

interface DeviceItem {
  _id: string;
  name: string;
  category: string;
  ipAddress: string;
  status: string;
  location?: { name: string };
  lastSeen?: string;
}

export default function InfrastructurePage() {
  const { user } = useAuthStore();
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatorActive, setSimulatorActive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await apiClient.get('/infrastructure');
      setDevices(res.data.data.devices);
      setSimulatorActive(res.data.data.simulatorActive);
    } catch (err) {
      console.error('Failed to load infrastructure status', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDevices().finally(() => setLoading(false));

    // Connect Socket.IO for real-time camera toggle updates
    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });

    socket.on('camera.status', (data: any) => {
      setDevices((prev) =>
        prev.map((d) => (d._id === data.id ? { ...d, status: data.newStatus } : d))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleToggleSimulator = async () => {
    setActionLoading(true);
    try {
      const nextActive = !simulatorActive;
      const res = await apiClient.post('/infrastructure/toggle-simulator', { active: nextActive });
      setSimulatorActive(res.data.data.simulatorActive);
    } catch (err) {
      console.error('Failed to toggle CCTV simulator', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Online':
        return <CheckCircle className="h-5 w-5 text-green-500 fill-green-500/10" />;
      case 'Degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500 fill-amber-500/10" />;
      case 'Offline':
        return <XCircle className="h-5 w-5 text-red-500 fill-red-500/10" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'CCTV Camera':
        return <Video className="h-4 w-4" />;
      case 'NVR':
        return <Database className="h-4 w-4" />;
      case 'Network Switch':
        return <Radio className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const isSuperAdmin = user?.role?.name === 'Super Admin';

  const onlineCount = devices.filter((d) => d.status === 'Online').length;
  const degradedCount = devices.filter((d) => d.status === 'Degraded').length;
  const offlineCount = devices.filter((d) => d.status === 'Offline').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Simulator Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Infrastructure Monitor</h2>
          <p className="text-slate-400 text-sm">Real-time status of company network components, CCTV surveillance systems, and NVR channels.</p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleToggleSimulator}
            disabled={actionLoading}
            className={`inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 ${
              simulatorActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>{simulatorActive ? 'Stop CCTV Uptime Simulator' : 'Start CCTV Uptime Simulator'}</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4">
          <span className="text-xs text-slate-500 block">TOTAL DEVISE SUPERVISED</span>
          <span className="text-2xl font-bold text-slate-200">{devices.length}</span>
        </div>
        <div className="rounded-xl border border-slate-850 bg-green-500/5 p-4 border-green-500/20">
          <span className="text-xs text-green-500 block">ONLINE & OPERATIONAL</span>
          <span className="text-2xl font-bold text-green-400">{onlineCount}</span>
        </div>
        <div className="rounded-xl border border-slate-850 bg-amber-500/5 p-4 border-amber-500/20">
          <span className="text-xs text-amber-500 block">DEGRADED TELEMETRY</span>
          <span className="text-2xl font-bold text-amber-400">{degradedCount}</span>
        </div>
        <div className="rounded-xl border border-slate-850 bg-red-500/5 p-4 border-red-500/20">
          <span className="text-xs text-red-500 block">OFFLINE / UNREACHABLE</span>
          <span className="text-2xl font-bold text-red-400">{offlineCount}</span>
        </div>
      </div>

      {/* Monitoring Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
        <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Monitored Device Nodes</h3>
        
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : devices.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No infrastructure devices registered.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((dev) => (
              <div key={dev._id} className="rounded-xl border border-slate-850 bg-slate-900/40 p-4 flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mt-0.5">
                    {getCategoryIcon(dev.category)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-200 text-sm leading-snug">{dev.name}</h4>
                    <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                      <p>IP: {dev.ipAddress}</p>
                      {dev.location && <p>Loc: {dev.location.name}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full py-0.5">
                  {getStatusIcon(dev.status)}
                  <span className="text-[9px] text-slate-500 font-medium uppercase mt-2">
                    {dev.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
