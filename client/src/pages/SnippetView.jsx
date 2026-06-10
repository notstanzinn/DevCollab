import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Star, GitFork, Eye, Edit, Trash2, Share2, Copy, Check,
  Globe, Lock, Radio, UserPlus, X, Users, Save, Crown,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import PresenceAvatars from '../components/PresenceAvatars';
import CommentThread from '../components/CommentThread';
import { getMonacoLang } from '../utils/monacoLang';
import toast from 'react-hot-toast';

const LANG_CLASSES = {
  javascript: 'lang-javascript', typescript: 'lang-typescript', python: 'lang-python',
  rust: 'lang-rust', go: 'lang-go', css: 'lang-css', html: 'lang-html',
};

// ─── Collaborator Panel (owner only) ───────────────────────────────────────
const CollabPanel = ({ snippetId, collaborators, onUpdate }) => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/snippets/${snippetId}/collaborators`, { email: email.trim() });
      toast.success(`✅ ${data.collaborator.name} added as collaborator`);
      onUpdate([...collaborators, data.collaborator]);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add collaborator');
    } finally { setLoading(false); }
  };

  const handleRemove = async (userId, name) => {
    try {
      await api.delete(`/snippets/${snippetId}/collaborators/${userId}`);
      toast.success(`${name} removed`);
      onUpdate(collaborators.filter(c => c._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  return (
    <div className="rounded-lg p-5 animate-fade-up" style={{ background: 'linear-gradient(145deg, #10101f, #0c0c1e)', border: '1px solid rgba(0,229,255,0.15)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} style={{ color: '#00e5ff' }} />
        <span className="text-[11px] tracking-[0.2em] font-bold text-white">COLLABORATORS</span>
        <span className="text-[10px] font-mono px-2 py-0.5" style={{ color: '#00e5ff', border: '1px solid rgba(0,229,255,0.25)', borderRadius: '3px' }}>{collaborators.length}</span>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          id="collab-email-input"
          type="email"
          className="flex-1 input-base py-2 text-[12px]"
          placeholder="// invite by email..."
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-neon text-[11px] px-4 py-2 flex items-center gap-1.5">
          <UserPlus size={12} /> {loading ? '...' : 'ADD'}
        </button>
      </form>

      {/* Collaborator list */}
      {collaborators.length === 0 ? (
        <p className="text-[12px] font-mono text-center py-3" style={{ color: '#3d4260' }}>// no collaborators yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {collaborators.map(c => (
            <div key={c._id} className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)' }}>
              {c.avatar
                ? <img src={c.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" style={{ border: '1px solid rgba(0,229,255,0.2)' }} />
                : <div className="w-7 h-7 rounded-full gradient-brand-bg flex items-center justify-center text-white text-[11px] font-bold shrink-0">{c.name?.[0]}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white font-semibold truncate">{c.name}</p>
                <p className="text-[10px] font-mono truncate" style={{ color: '#3d4260' }}>{c.email}</p>
              </div>
              <button
                onClick={() => handleRemove(c._id, c.name)}
                className="w-6 h-6 flex items-center justify-center rounded transition-all shrink-0"
                style={{ color: '#3d4260' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#3d4260'; e.currentTarget.style.background = 'transparent'; }}
                title="Remove collaborator"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main SnippetView ───────────────────────────────────────────────────────
const SnippetView = () => {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [snippet, setSnippet]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [comments, setComments]           = useState([]);
  const [presence, setPresence]           = useState([]);
  const [code, setCode]                   = useState('');
  const [copied, setCopied]               = useState(false);
  const [starred, setStarred]             = useState(false);
  const [starCount, setStarCount]         = useState(0);
  const [collaborators, setCollaborators] = useState([]);
  const [saving, setSaving]               = useState(false);
  const [showCollabPanel, setShowCollabPanel] = useState(false);

  const isRemoteUpdate = useRef(false);

  const isOwner        = user && snippet && String(user._id) === String(snippet.author?._id);
  const isCollaborator = user && collaborators.some(c => String(c._id) === String(user._id));
  const canSave        = isOwner || isCollaborator;

  const { emitCodeChange } = useSocket(id, user, {
    onCodeUpdate: ({ code: incoming }) => {
      isRemoteUpdate.current = true;
      setCode(incoming);
    },
    onPresenceUpdate: (users) => setPresence(users),
  });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          api.get(`/snippets/${id}`),
          api.get(`/snippets/${id}/comments`),
        ]);
        if (cancelled) return;
        const s = sRes.data.snippet;
        setSnippet(s);
        setCode(s.code);
        setComments(cRes.data.comments);
        setCollaborators(s.collaborators || []);
        setStarred(user && s.stars?.includes(user._id));
        setStarCount(s.stars?.length || 0);
      } catch (err) {
        if (!cancelled) { toast.error(err.response?.data?.message || 'Failed to load'); navigate('/'); }
      } finally { if (!cancelled) setLoading(false); }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const handleCodeChange = (val) => {
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
    setCode(val);
    emitCodeChange(val);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api.put(`/snippets/${id}`, { code });
      toast.success('CHANGES SAVED');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleStar = async () => {
    if (!user) { toast.error('Sign in to star'); return; }
    try {
      const { data } = await api.post(`/snippets/${id}/star`);
      setStarred(data.starred); setStarCount(data.stars);
    } catch { toast.error('Failed to star'); }
  };

  const handleFork = async () => {
    if (!user) { toast.error('Sign in to fork'); return; }
    try {
      const { data } = await api.post(`/snippets/${id}/fork`);
      toast.success('SNIPPET FORKED');
      navigate(`/snippets/${data.snippet._id}/edit`);
    } catch { toast.error('Failed to fork'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this snippet? This cannot be undone.')) return;
    try { await api.delete(`/snippets/${id}`); toast.success('DELETED'); navigate('/'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('COPIED TO CLIPBOARD');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" /></div>;
  if (!snippet) return null;

  const langClass = LANG_CLASSES[snippet.language] || 'lang-default';
  const ext = { javascript:'js', typescript:'ts', python:'py', go:'go', rust:'rs', html:'html', css:'css' }[snippet.language] || snippet.language;

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px',
    background: 'rgba(255,255,255,0.03)', color: '#9ba3be', cursor: 'pointer', transition: 'all 0.2s',
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-[11px] font-mono" style={{ color: '#3d4260' }}>
          <Link to="/" style={{ color: '#3d4260' }} className="hover:text-white transition-colors">EXPLORE</Link>
          <span>/</span>
          <Link to={`/profile/${snippet.author?._id}`} className="hover:text-[#00e5ff] transition-colors">{snippet.author?.name?.toUpperCase()}</Link>
          <span>/</span>
          <span className="text-white">{snippet.title?.toUpperCase()}</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-6 mb-6 animate-fade-up">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-sm ${langClass}`}>{snippet.language}</span>
              <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: '#3d4260' }}>
                {snippet.isPublic ? <><Globe size={10} /> PUBLIC</> : <><Lock size={10} /> PRIVATE</>}
              </span>
              {collaborators.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: '#00e5ff' }}>
                  <Users size={10} /> {collaborators.length} COLLABORATOR{collaborators.length > 1 ? 'S' : ''}
                </span>
              )}
              {snippet.forkedFrom && (
                <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: '#3d4260' }}>
                  <GitFork size={10} /> FORKED FROM{' '}
                  <Link to={`/snippets/${snippet.forkedFrom._id}`} style={{ color: '#00e5ff' }}>{snippet.forkedFrom.title?.toUpperCase()}</Link>
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl text-white tracking-widest mb-2">{snippet.title?.toUpperCase()}</h1>
            {snippet.description && <p className="text-sm leading-relaxed mb-3" style={{ color: '#9ba3be' }}>{snippet.description}</p>}

            {snippet.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {snippet.tags.map(t => (
                  <span key={t} className="text-[10px] tracking-widest px-2 py-0.5 rounded-sm" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)', color: '#3d4260' }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <PresenceAvatars users={presence} />

            <button id="star-btn" onClick={handleStar}
              style={{ ...btnBase, ...(starred ? { color: '#fbbf24', borderColor: 'rgba(251,191,36,0.35)' } : {}) }}
              onMouseEnter={e => { if (!starred) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (!starred) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9ba3be'; } }}
            >
              <Star size={13} fill={starred ? 'currentColor' : 'none'} /> {starCount}
            </button>

            <button id="fork-btn" onClick={handleFork} style={btnBase}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9ba3be'; }}
            >
              <GitFork size={13} /> FORK
            </button>

            <button id="share-btn"
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('LINK COPIED'); }}
              style={{ ...btnBase, padding: '7px 10px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9ba3be'; }}
            >
              <Share2 size={13} />
            </button>

            {/* Owner controls */}
            {isOwner && (
              <>
                <button
                  id="collab-btn"
                  onClick={() => setShowCollabPanel(p => !p)}
                  style={{
                    ...btnBase,
                    ...(showCollabPanel
                      ? { color: '#00e5ff', borderColor: 'rgba(0,229,255,0.4)', background: 'rgba(0,229,255,0.08)' }
                      : {})
                  }}
                  onMouseEnter={e => { if (!showCollabPanel) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'; e.currentTarget.style.color = '#00e5ff'; } }}
                  onMouseLeave={e => { if (!showCollabPanel) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9ba3be'; } }}
                >
                  <Users size={13} /> COLLABORATORS {collaborators.length > 0 && `(${collaborators.length})`}
                </button>

                <Link id="edit-btn" to={`/snippets/${id}/edit`}
                  style={{ ...btnBase, color: '#00e5ff', borderColor: 'rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.05)', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,255,0.05)'}
                >
                  <Edit size={12} /> EDIT
                </Link>

                <button id="delete-btn" onClick={handleDelete}
                  style={{ ...btnBase, padding: '7px 10px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 text-[11px] font-mono pb-5 mb-6" style={{ borderBottom: '1px solid rgba(0,229,255,0.08)', color: '#3d4260' }}>
          <span className="flex items-center gap-1.5"><Eye size={11} /> {snippet.views} VIEWS</span>
          <span className="flex items-center gap-1.5"><GitFork size={11} /> {snippet.forks?.length || 0} FORKS</span>
          {isCollaborator && !isOwner && (
            <span className="flex items-center gap-1.5" style={{ color: '#00e5ff' }}>
              <Users size={11} /> YOU ARE A COLLABORATOR
            </span>
          )}
          <span className="ml-auto">{new Date(snippet.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }).toUpperCase()}</span>
        </div>

        {/* Collaborator Panel (owner only) */}
        {isOwner && showCollabPanel && (
          <div className="mb-6">
            <CollabPanel
              snippetId={id}
              collaborators={collaborators}
              onUpdate={setCollaborators}
            />
          </div>
        )}

        {/* Collaborator avatars strip (visible to all) */}
        {collaborators.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] tracking-widest font-mono" style={{ color: '#3d4260' }}>COLLABORATORS:</span>
            {collaborators.map(c => (
              <Link key={c._id} to={`/profile/${c._id}`} title={c.name}>
                {c.avatar
                  ? <img src={c.avatar} className="w-6 h-6 rounded-full object-cover" alt={c.name} style={{ border: '1px solid rgba(0,229,255,0.2)' }} />
                  : <div className="w-6 h-6 rounded-full gradient-brand-bg flex items-center justify-center text-white text-[10px] font-bold">{c.name?.[0]}</div>
                }
              </Link>
            ))}
          </div>
        )}

        {/* Monaco Editor */}
        <div className="rounded-lg overflow-hidden animate-fade-up mb-6 scan-effect" style={{ border: '1px solid rgba(0,229,255,0.15)', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: 'rgba(0,229,255,0.04)', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full editor-dot-red" />
              <span className="w-2.5 h-2.5 rounded-full editor-dot-yellow" />
              <span className="w-2.5 h-2.5 rounded-full editor-dot-green" />
            </div>
            <span className="flex-1 font-mono text-[12px] tracking-wider" style={{ color: '#3d4260' }}>
              {isOwner && <span style={{ color: '#00e5ff', marginRight: '6px' }}><Crown size={10} className="inline mr-0.5" />OWNER</span>}
              {isCollaborator && !isOwner && <span style={{ color: '#7b61ff', marginRight: '6px' }}><Users size={10} className="inline mr-0.5" />COLLABORATOR</span>}
              snippet.{ext}
            </span>

            {presence.length > 1 && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest mr-2" style={{ color: '#00e5ff' }}>
                <Radio size={10} className="animate-pulse" /> LIVE ·{presence.length}
              </span>
            )}

            {/* Save button — shown for owner and collaborators */}
            {canSave && (
              <button
                id="save-code-btn"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-[11px] tracking-widest font-bold px-3 py-1 transition-all mr-2"
                style={{ color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '4px', background: 'rgba(0,229,255,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,255,0.06)'}
              >
                <Save size={11} /> {saving ? 'SAVING...' : 'SAVE'}
              </button>
            )}

            {!canSave && !user && (
              <span className="text-[10px] font-mono mr-2" style={{ color: '#3d4260' }}>// sign in to collaborate</span>
            )}

            {!canSave && user && (
              <span className="text-[10px] font-mono mr-2" style={{ color: '#3d4260' }}>// fork to save your version</span>
            )}

            <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] tracking-widest transition-all" style={{ color: '#3d4260' }}
              onMouseEnter={e => e.currentTarget.style.color = '#00e5ff'}
              onMouseLeave={e => e.currentTarget.style.color = '#3d4260'}
            >
              {copied ? <><Check size={12} /> COPIED</> : <><Copy size={12} /> COPY</>}
            </button>
          </div>

          <Editor
            key={snippet.language}
            height="480px"
            defaultLanguage={getMonacoLang(snippet.language)}
            language={getMonacoLang(snippet.language)}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              readOnly: !user,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        {/* Comments */}
        <div className="rounded-lg p-6 animate-fade-in" style={{ background: 'linear-gradient(145deg, #10101f, #0c0c1e)', border: '1px solid rgba(0,229,255,0.1)' }}>
          <CommentThread snippetId={id} comments={comments} onCommentsChange={setComments} />
        </div>
      </div>
    </div>
  );
};

export default SnippetView;
