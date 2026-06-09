import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Save, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMonacoLang } from '../utils/monacoLang';
import toast from 'react-hot-toast';

const LANGUAGES = ['javascript','typescript','python','java','c','cpp','csharp','go','rust','php','ruby','swift','kotlin','html','css','sql','bash','json','yaml','markdown','plaintext'];

const EditSnippet = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]         = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/snippets/${id}`);
        const s = data.snippet;
        if (!user || String(user._id) !== String(s.author._id)) { toast.error('Not authorized'); navigate(`/snippets/${id}`); return; }
        setForm({ title: s.title, description: s.description || '', language: s.language, code: s.code, isPublic: s.isPublic, tags: s.tags || [] });
      } catch { toast.error('Snippet not found'); navigate('/'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" /></div>;
  if (!form) return null;

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await api.put(`/snippets/${id}`, form); toast.success('Snippet updated!'); navigate(`/snippets/${id}`); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSubmitting(false); }
  };

  const inputCls = "bg-[#0f1117] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#6c63ff] focus:outline-none transition-all";

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-extrabold gradient-brand-text">Edit Snippet</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Update your snippet</p>
          </div>
          <button onClick={() => navigate(`/snippets/${id}`)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-[#94a3b8] bg-[#131720] border border-white/[0.06] hover:border-[rgba(108,99,255,0.4)] transition-all">
            <X size={14} /> Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#94a3b8]">Title</label>
              <input id="edit-title" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#94a3b8]">Description</label>
              <textarea id="edit-desc" className={`${inputCls} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-black/20 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full editor-dot-red" />
                  <span className="w-3 h-3 rounded-full editor-dot-yellow" />
                  <span className="w-3 h-3 rounded-full editor-dot-green" />
                </div>
                <select id="edit-language" className="bg-[#131720] border border-white/[0.06] rounded-lg px-2.5 py-1 text-xs text-[#e2e8f0] outline-none" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <Editor key={form.language} height="400px" defaultLanguage={getMonacoLang(form.language)} language={getMonacoLang(form.language)} value={form.code} onChange={(val) => setForm({ ...form, code: val || '' })} theme="vs-dark" options={{ minimap:{enabled:false}, fontSize:14, fontFamily:"'JetBrains Mono', monospace", scrollBeyondLastLine:false, wordWrap:'on', automaticLayout:true, padding:{top:16,bottom:16} }} />
            </div>
          </div>

          <div className="gradient-card-bg border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-[#e2e8f0]">Settings</h3>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Visibility</label>
              <div className="flex gap-2">
                {[{ val:true, label:'Public' }, { val:false, label:'Private' }].map(({ val, label }) => (
                  <button key={label} type="button" onClick={() => setForm({ ...form, isPublic: val })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.isPublic === val ? 'bg-[rgba(108,99,255,0.12)] border-[rgba(108,99,255,0.4)] text-[#8b85ff]' : 'bg-transparent border-white/[0.06] text-[#94a3b8] hover:bg-[#1a2030]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Tags</label>
              <div className="flex gap-2">
                <input className={`flex-1 ${inputCls}`} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag..." />
                <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl text-sm font-medium text-[#8b85ff] border border-[rgba(108,99,255,0.4)] bg-[rgba(108,99,255,0.08)] hover:bg-[rgba(108,99,255,0.15)] transition-all">Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[rgba(108,99,255,0.12)] text-[#8b85ff] border border-[rgba(108,99,255,0.3)]">
                      #{tag}<button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))} className="text-[#8b85ff] hover:text-white"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button id="save-snippet" type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all disabled:opacity-60">
              <Save size={15} /> {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSnippet;
