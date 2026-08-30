'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import { Truck, Save, Star, AlertTriangle, Phone, Mail } from 'lucide-react';

interface VendorItem {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  services: string[];
}

export default function VendorsPage() {
  const { user } = useAuthStore();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState(5);
  const [servicesInput, setServicesInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/metadata/vendors');
      setVendors(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    setErrorMsg(null);

    const services = servicesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await apiClient.post('/metadata/vendors', {
        name,
        contactPerson,
        email,
        phone,
        address,
        rating,
        services,
      });

      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
      setRating(5);
      setServicesInput('');
      fetchVendors();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to create vendor. Verify name duplicates.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const isPrivileged = user?.role?.name === 'Super Admin' || user?.role?.name === 'IT Manager';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vendor Directory</h2>
        <p className="text-slate-400 text-sm">Track procurement agencies, equipment suppliers, software aggregators, and SLA AMC contractors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vendors Directory list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : vendors.length === 0 ? (
              <p className="col-span-2 p-8 text-center text-slate-500 text-sm">No vendors registered yet.</p>
            ) : (
              vendors.map((vendor) => (
                <div key={vendor._id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Truck className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-slate-200">{vendor.name}</h4>
                      </div>
                      <div className="flex items-center text-yellow-500 text-xs">
                        <Star className="h-3.5 w-3.5 fill-current mr-0.5" />
                        <span>{vendor.rating}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 pt-1">
                      {vendor.contactPerson && <p><strong>Contact:</strong> {vendor.contactPerson}</p>}
                      {vendor.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{vendor.email}</span>
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{vendor.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {vendor.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/40">
                      {vendor.services.map((srv) => (
                        <span key={srv} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium">
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Vendor Panel (IT Manager/Admin Only) */}
        <div className="space-y-4">
          {isPrivileged ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm">Add New Vendor</h3>
              
              {errorMsg && (
                <div className="flex items-start space-x-1.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Vendor Partner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Systems, Lenovo India"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. sarah@cisco.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Services Provided (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hardware supply, Network support"
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Rating (1 to 5 Stars)</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value, 10))}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Street Address</label>
                  <textarea
                    rows={1.5}
                    placeholder="Vendor corporate address details..."
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
                  <span>Save Vendor</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 text-center text-sm text-slate-500">
              Only Super Admin or IT Manager accounts can register new vendor contracts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
