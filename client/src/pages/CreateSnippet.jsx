import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { PlusCircle, Eye, EyeOff, Tag, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMonacoLang } from '../utils/monacoLang';
import toast from 'react-hot-toast';

const LANGUAGES = [
  'javascript','typescript','python','java','c','cpp','csharp',
  'go','rust','php','ruby','swift','kotlin','html','css',
  'sql','bash','json','yaml','markdown','plaintext',
];


const CreateSnippet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ title:'', description:'', language:'javascript', code:'// Start coding...\n', isPublic:true, tags:[] });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.code.trim())  { toast.error('Code is required'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/snippets', form);
      toast.success('Snippet created!');
      navigate(`/snippets/${data.snippet._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create snippet'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold gradient-brand-text">New Snippet</h1>
          <p className="text-sm text-[#BABABA] mt-1">Share your code with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          {/* Main */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#BABABA]" htmlFor="snippet-title">Title *</label>
              <input id="snippet-title" className="input-base" placeholder="Give your snippet a descriptive title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#BABABA]" htmlFor="snippet-desc">Description</label>
              <textarea id="snippet-desc" className="input-base resize-none" placeholder="What does this snippet do? (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            {/* Editor */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,109,41,0.15)' }}>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(255,109,41,0.05)', borderBottom: '1px solid rgba(255,109,41,0.12)' }}>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full editor-dot-red" />
                  <span className="w-3 h-3 rounded-full editor-dot-yellow" />
                  <span className="w-3 h-3 rounded-full editor-dot-green" />
                </div>
                <select id="language-select" className="rounded-lg px-2.5 py-1 text-xs text-white outline-none" style={{ background: '#241f1f', border: '1px solid rgba(255,109,41,0.25)', color: '#BABABA' }} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  {LANGUAGES.map((l) => <option key={l} value={l} style={{ background: '#241f1f' }}>{l}</option>)}
                </select>
              </div>
              <Editor
                key={form.language}
                height="400px"
                defaultLanguage={getMonacoLang(form.language)}
                language={getMonacoLang(form.language)}
                value={form.code}
                onChange={(val) => setForm({ ...form, code: val || '' })}
                theme="vs-dark"
                options={{ minimap:{enabled:false}, fontSize:14, fontFamily:"'JetBrains Mono', monospace", lineNumbers:'on', scrollBeyondLastLine:false, wordWrap:'on', automaticLayout:true, padding:{top:16,bottom:16} }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="gradient-card-bg rounded-2xl p-5 flex flex-col gap-5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-sm font-bold text-white">Settings</h3>

            {/* Visibility */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#BABABA] uppercase tracking-wide">Visibility</label>
              <div className="flex gap-2">
                {[
                  { val: true,  label: 'Public',  Icon: Eye },
                  { val: false, label: 'Private', Icon: EyeOff },
                ].map(({ val, label, Icon }) => (
                  <button key={label} type="button" id={`visibility-${label.toLowerCase()}`} onClick={() => setForm({ ...form, isPublic: val })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all"
                    style={form.isPublic === val
                      ? { background: 'rgba(255,109,41,0.12)', borderColor: 'rgba(255,109,41,0.4)', color: '#FF6D29' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.07)', color: '#BABABA' }
                    }
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#BABABA] uppercase tracking-wide flex items-center gap-1"><Tag size={11} /> Tags (up to 5)</label>
              <div className="flex gap-2">
                <input id="tag-input" className="flex-1 input-base py-2" placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: '#FF6D29', border: '1px solid rgba(255,109,41,0.4)', background: 'rgba(255,109,41,0.08)' }}>Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs" style={{ background: 'rgba(255,109,41,0.12)', color: '#ff8c55', border: '1px solid rgba(255,109,41,0.3)' }}>
                      #{tag}
                      <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))} className="hover:text-white transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button id="submit-snippet" type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all disabled:opacity-60">
              <PlusCircle size={15} /> {submitting ? 'Creating...' : 'Create Snippet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSnippet;
