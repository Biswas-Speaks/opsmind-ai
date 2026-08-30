'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../../src/lib/axios';
import { useAuthStore } from '../../../src/stores/auth.store';
import { Cpu, AlertTriangle, ChevronLeft, Save } from 'lucide-react';

const categoriesList = [
  'Laptop', 'Desktop', 'Server', 'Monitor', 'Printer', 'Network Switch',
  'Router', 'Firewall', 'Access Point', 'CCTV Camera', 'NVR', 'UPS',
  'Storage', 'Mobile Device', 'Software License', 'Other'
];

const conditionsList = ['New', 'Good', 'Fair', 'Poor'];

const assetFormSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required'),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  description: z.string().optional(),
  purchaseDate: z.string().optional().nullable(),
  purchaseCost: z.coerce.number().min(0).optional().nullable(),
  vendorId: z.string().optional().nullable(),
  warrantyStart: z.string().optional().nullable(),
  warrantyEnd: z.string().optional().nullable(),
  amcStart: z.string().optional().nullable(),
  amcEnd: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  macAddress: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export default function RegisterAssetPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Metadata dropdown state
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    // Check permission
    const isAuthorized = user?.role?.name === 'Super Admin' || user?.role?.name === 'IT Manager';
    if (!isAuthorized) {
      router.push('/dashboard');
      return;
    }

    const loadOptions = async () => {
      try {
        const [locRes, deptRes, vendRes] = await Promise.all([
          apiClient.get('/metadata/locations'),
          apiClient.get('/metadata/departments'),
          apiClient.get('/metadata/vendors'),
        ]);
        setLocations(locRes.data.data);
        setDepartments(deptRes.data.data);
        setVendors(vendRes.data.data);
      } catch (err) {
        console.error('Failed to load metadata options', err);
      }
    };
    loadOptions();
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      serialNumber: '',
      category: 'Laptop',
      manufacturer: '',
      model: '',
      description: '',
      purchaseCost: 0,
      notes: '',
    },
  });

  const onSubmit = async (values: AssetFormValues) => {
    setErrorMsg(null);
    setLoading(true);

    // Clean up date structures to prevent sending empty string to DB
    const payload = { ...values } as any;
    const dateFields = ['purchaseDate', 'warrantyStart', 'warrantyEnd', 'amcStart', 'amcEnd'];
    for (const f of dateFields) {
      if (payload[f] === '') payload[f] = null;
    }
    const relationFields = ['vendorId', 'locationId', 'departmentId'];
    for (const f of relationFields) {
      if (payload[f] === '') payload[f] = null;
    }

    try {
      await apiClient.post('/assets', payload);
      router.push('/assets');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to create asset. Verify inputs and serial duplicates.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/assets" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-100 transition space-x-1">
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Inventory</span>
      </Link>

      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Register New IT Asset</h2>
          <p className="text-slate-400 text-sm">Add system credentials, network details, and assignments config.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start space-x-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
          <div className="col-span-1 md:col-span-2 text-slate-300 font-bold border-b border-slate-800 pb-2 text-sm">
            Core Specifications
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Category *</label>
            <select
              {...register('category')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Serial Number *</label>
            <input
              type="text"
              placeholder="e.g. SN-8829-XJZ"
              {...register('serialNumber')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
            {errors.serialNumber && <p className="mt-1 text-xs text-red-400">{errors.serialNumber.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Manufacturer *</label>
            <input
              type="text"
              placeholder="e.g. Lenovo, Dell, Cisco"
              {...register('manufacturer')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
            {errors.manufacturer && <p className="mt-1 text-xs text-red-400">{errors.manufacturer.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Model *</label>
            <input
              type="text"
              placeholder="e.g. ThinkPad X1 Carbon"
              {...register('model')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
            {errors.model && <p className="mt-1 text-xs text-red-400">{errors.model.message}</p>}
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-300">Asset Description</label>
            <textarea
              rows={2}
              placeholder="Brief details regarding configuration (e.g. 16GB RAM, 512GB SSD)..."
              {...register('description')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
          <div className="col-span-1 md:col-span-2 text-slate-300 font-bold border-b border-slate-800 pb-2 text-sm">
            Hierarchy & Location assignments
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Location Office</label>
            <select
              {...register('locationId')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            >
              <option value="">Unassigned</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Department Code</label>
            <select
              {...register('departmentId')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            >
              <option value="">Unassigned</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
          <div className="col-span-1 md:col-span-3 text-slate-300 font-bold border-b border-slate-800 pb-2 text-sm">
            Network Configs
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">IP Address</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.50"
              {...register('ipAddress')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">MAC Address</label>
            <input
              type="text"
              placeholder="e.g. 00:1A:2B:3C:4D:5E"
              {...register('macAddress')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Hostname</label>
            <input
              type="text"
              placeholder="e.g. WS-DEVLAP-03"
              {...register('hostname')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
          <div className="col-span-1 md:col-span-2 text-slate-300 font-bold border-b border-slate-800 pb-2 text-sm">
            Financial & Warranty Agreements
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Vendor Partner</label>
            <select
              {...register('vendorId')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            >
              <option value="">None</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Purchase Cost ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('purchaseCost')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Purchase Date</label>
            <input
              type="date"
              {...register('purchaseDate')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Warranty Start & End</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="date"
                {...register('warrantyStart')}
                className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
              />
              <input
                type="date"
                {...register('warrantyEnd')}
                className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/assets"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Saving...
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Asset</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
