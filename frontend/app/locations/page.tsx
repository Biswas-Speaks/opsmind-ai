'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import { MapPin, Plus, Save, AlertTriangle } from 'lucide-react';

interface LocationItem {
  _id: string;
  name: string;
  code: string;
  address: string;
  type: string;
}

export default function LocationsPage() {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Office');
  const [saving, setSaving] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/metadata/locations');
      setLocations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/metadata/locations', { name, code, address, type });
      setName('');
      setCode('');
      setAddress('');
      setType('Office');
      fetchLocations();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to create location. Verify code duplicate.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = user?.role?.name === 'Super Admin';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Locations Directory</h2>
        <p className="text-slate-400 text-sm">Manage corporate buildings, data centers, branch offices, and asset warehouses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Locations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : locations.length === 0 ? (
              <p className="p-8 text-center text-slate-500 text-sm">No locations registered yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {locations.map((loc) => (
                  <div key={loc._id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-900/10 transition">
                    <div className="flex items-start space-x-3.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-baseline space-x-2.5">
                          <h4 className="font-bold text-slate-200">{loc.name}</h4>
                          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                            {loc.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{loc.address || 'No address specified'}</p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                      {loc.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Location Form (Admin Only) */}
        <div className="space-y-4">
          {isSuperAdmin ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Add New Location</h3>
              
              {errorMsg && (
                <div className="flex items-start space-x-1.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. London Office"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Location Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LON-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Location Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                  >
                    <option value="Office">Office</option>
                    <option value="Data Center">Data Center</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Branch">Branch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Street Address</label>
                  <textarea
                    rows={2}
                    placeholder="Full address details..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full justify-center items-center space-x-2 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Location</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 text-center text-sm text-slate-500">
              Only Super Admin accounts can register new company locations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
