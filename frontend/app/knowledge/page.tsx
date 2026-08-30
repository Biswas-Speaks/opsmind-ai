'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../src/lib/axios';
import { useAuthStore } from '../../src/stores/auth.store';
import { BookOpen, Search, Plus, Save, Sparkles, AlertTriangle } from 'lucide-react';

interface KnowledgeDoc {
  _id: string;
  title: string;
  category: string;
  tags: string[];
  createdBy?: { username: string };
  createdAt: string;
}

interface SearchResult {
  score: number;
  content: string;
  document?: { title: string; category: string };
}

export default function KnowledgePage() {
  const { user } = useAuthStore();
  
  const [articles, setArticles] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ingestion form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchArticles = async () => {
    try {
      const res = await apiClient.get('/knowledge');
      setArticles(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchArticles().finally(() => setLoading(false));
  }, []);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSaving(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await apiClient.post('/knowledge', { title, category, tags, content });
      setTitle('');
      setCategory('General');
      setTagsInput('');
      setContent('');
      fetchArticles();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to ingest SOP document. Verify inputs.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiClient.get('/knowledge/search', { params: { q: searchQuery } });
      setSearchResults(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const isPrivileged = user?.role?.name === 'Super Admin' || user?.role?.name === 'IT Manager';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SOP Knowledge Base</h2>
        <p className="text-slate-400 text-sm">Upload operational manuals, perform semantic search queries, and verify RAG troubleshooting documents.</p>
      </div>

      {/* Semantic search bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span>Semantic RAG Search</span>
        </h3>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Query semantic symptoms (e.g. WiFi AP disconnects or camera PoE power loss)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 rounded-lg text-sm transition"
          >
            {searching ? 'Querying...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Relevant Citations Found</h4>
            <div className="grid grid-cols-1 gap-3">
              {searchResults.map((res, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/45 p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200 text-xs">
                      {res.document?.title} ({res.document?.category})
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded">
                      Match: {Math.round(res.score * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{res.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOP Article lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden">
            <h3 className="font-bold text-slate-200 p-4 border-b border-slate-850 text-sm">Indexed Manuals</h3>
            
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : articles.length === 0 ? (
              <p className="p-8 text-center text-slate-500 text-sm">No SOP documents ingested yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {articles.map((art) => (
                  <div key={art._id} className="p-4 flex items-start gap-4 hover:bg-slate-900/10 transition justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-450 mt-1 flex-shrink-0">
                        <BookOpen className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">{art.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Uploaded on {new Date(art.createdAt).toLocaleDateString()}
                        </p>
                        {art.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {art.tags.map((t) => (
                              <span key={t} className="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] px-1.5 py-0.5 rounded font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-350 mt-1">
                      {art.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add SOP Document Ingestion Panel (IT Managers/Super Admins Only) */}
        <div className="space-y-4">
          {isPrivileged ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2 text-sm flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span>Ingest SOP Manual</span>
              </h3>

              {errorMsg && (
                <div className="flex items-start space-x-1.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco core switches cold restart steps"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-300 outline-none focus:border-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="Network">Network</option>
                    <option value="CCTV">CCTV</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Server">Server</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Search Keywords/Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. reboot, switch, cisco"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Manual Document Content *</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Provide diagnostic checklists and SOP steps here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full justify-center items-center space-x-2 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Ingest & Vector Embed</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 text-center text-sm text-slate-500">
              Only Super Admin or IT Manager accounts can ingest operational manuals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
