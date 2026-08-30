'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import {
  Laptop,
  Search,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  Eye,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface AssetListItem {
  _id: string;
  assetTag: string;
  serialNumber: string;
  category: string;
  manufacturer: string;
  model: string;
  status: string;
  condition: string;
  location?: { name: string };
  department?: { name: string };
  assignedUser?: { username: string };
}

export default function AssetsPage() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [locationId, setLocationId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Metadata options
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    // Load metadata options
    const fetchMetadata = async () => {
      try {
        const locRes = await apiClient.get('/metadata/locations');
        const deptRes = await apiClient.get('/metadata/departments');
        setLocations(locRes.data.data);
        setDepartments(deptRes.data.data);
      } catch (err) {
        console.error('Failed to load metadata options', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          limit: 10,
          search: search || undefined,
          category: category || undefined,
          status: status || undefined,
          locationId: locationId || undefined,
          departmentId: departmentId || undefined,
        };

        const res = await apiClient.get('/assets', { params });
        setAssets(res.data.data.assets);
        setTotalPages(res.data.data.pages);
        setTotal(res.data.data.total);
      } catch (err) {
        console.error('Failed to load assets', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchAssets();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [page, search, category, status, locationId, departmentId]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, category, status, locationId, departmentId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 border border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1 text-green-400" />Available</span>;
      case 'Assigned':
      case 'In Use':
        return <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 border border-blue-500/20"><Laptop className="h-3 w-3 mr-1 text-blue-400" />In Use</span>;
      case 'Under Maintenance':
      case 'Repair':
        return <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 border border-amber-500/20"><Wrench className="h-3 w-3 mr-1 text-amber-400" />Maintenance</span>;
      case 'Lost':
      case 'Retired':
      case 'Disposed':
        return <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 border border-red-500/20"><XCircle className="h-3 w-3 mr-1 text-red-400" />Retired</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'New': return 'text-green-400';
      case 'Good': return 'text-blue-400';
      case 'Fair': return 'text-amber-400';
      case 'Poor': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const canCreate = user?.role?.name === 'Super Admin' || user?.role?.name === 'IT Manager';

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IT Asset Inventory</h2>
          <p className="text-slate-400 text-sm">
            Manage company assets, register systems, track configurations, and manage location logs.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/assets/new"
            className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Register Asset</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search assets by tag, serial number, model..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            <option value="Laptop">Laptops</option>
            <option value="Desktop">Desktops</option>
            <option value="Server">Servers</option>
            <option value="Monitor">Monitors</option>
            <option value="Printer">Printers</option>
            <option value="Network Switch">Network Switches</option>
            <option value="Router">Routers</option>
            <option value="CCTV Camera">CCTV Cameras</option>
            <option value="NVR">NVRs</option>
            <option value="Software License">Software Licenses</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="In Use">In Use</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Repair">Repair</option>
            <option value="Retired">Retired</option>
          </select>

          {/* Location Filter */}
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:border-blue-500 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Inventory Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-300">No assets found</p>
            <p className="text-sm text-slate-500">Try matching other filter criteria or registering new assets.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Asset Tag</th>
                  <th className="px-6 py-4">Manufacturer & Model</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-900/30 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-blue-400">{asset.assetTag}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{asset.manufacturer}</div>
                      <div className="text-xs text-slate-500">{asset.model} • SN: {asset.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4">{asset.category}</td>
                    <td className="px-6 py-4">{asset.location?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4">{asset.department?.name || 'Unassigned'}</td>
                    <td className={`px-6 py-4 font-medium ${getConditionColor(asset.condition)}`}>
                      {asset.condition}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/assets/${asset._id}`}
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
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total assets)
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
