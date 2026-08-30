'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../../src/lib/axios';
import { ChevronLeft, Save, AlertTriangle } from 'lucide-react';

const ticketFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  assetId: z.string().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  category: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

export default function CreateTicketPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await apiClient.get('/assets', { params: { limit: 100 } });
        setAssets(res.data.data.assets);
      } catch (err) {
        console.error('Failed to load assets', err);
      }
    };
    fetchAssets();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Other',
      priority: 'Medium',
      assetId: '',
    },
  });

  const onSubmit = async (values: TicketFormValues) => {
    setErrorMsg(null);
    setLoading(true);

    const payload = { ...values };
    if (payload.assetId === '') payload.assetId = null;

    try {
      await apiClient.post('/tickets', payload);
      router.push('/tickets');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to submit incident ticket. Try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/tickets" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-100 transition space-x-1">
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Tickets</span>
      </Link>

      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Raise New IT Incident</h2>
          <p className="text-slate-400 text-sm">Report system anomalies. The AI agent automatically assesses priority, categories, and assigns teams.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start space-x-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
          <div>
            <label className="block text-sm font-medium text-slate-300">Incident Title *</label>
            <input
              type="text"
              placeholder="e.g. WiFi authentication fails in cafeteria AP"
              {...register('title')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Description of Symptoms *</label>
            <textarea
              rows={4}
              placeholder="Describe the anomalies, error messages, and impacted operations..."
              {...register('description')}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
            />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Impacted Asset (Optional)</label>
              <select
                {...register('assetId')}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition"
              >
                <option value="">No specific asset</option>
                {assets.map((ast) => (
                  <option key={ast._id} value={ast._id}>
                    {ast.assetTag} • {ast.manufacturer} {ast.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Filing Category (AI Will Override)</label>
              <select
                {...register('category')}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition"
              >
                <option value="Other">Other</option>
                <option value="Network">Network</option>
                <option value="CCTV">CCTV</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Server">Server</option>
                <option value="Application">Application</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/tickets"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Submitting...
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Submit Ticket</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
