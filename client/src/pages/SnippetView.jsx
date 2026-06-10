import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Star, GitFork, Eye, Edit, Trash2, Share2, Copy, Check, Globe, Lock, Radio } from 'lucide-react';
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

const SnippetView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [snippet, setSnippet]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [comments, setComments] = useState([]);
  const [presence, setPresence] = useState([]);
  const [code, setCode]         = useState('');
  const [copied, setCopied]     = useState(false);
  const [starred, setStarred]   = useState(false);
  const [starCount, setStarCount] = useState(0);

  // Prevent echo: when we receive a remote update we set this flag so
  // the onChange handler doesn't immediately re-broadcast it back.
  const isRemoteUpdate = useRef(false);

  const isOwner = user && snippet && String(user._id) === String(snippet.author?._id);
  // Any logged-in user can participate in real-time collab editing.
  const canEdit = !!user;

  const { emitCodeChange } = useSocket(id, user, {
    onCodeUpdate: ({ code: incoming }) => {
      isRemoteUpdate.current = true;
      setCode(incoming);
    },
    onPresenceUpdate: (users) => setPresence(users),
  });

  useEffect(() => {
    // Guard against React StrictMode double-invocation in development.
    // Even without this the server is idempotent (unique view per account),
    // but this avoids sending two identical network requests on every page load.
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          api.get(`/snippets/${id}`),
          api.get(`/snippets/${id}/comments`),
        ]);
        if (cancelled) return;           // unmounted before response arrived
        const s = sRes.data.snippet;
        setSnippet(s); setCode(s.code); setComments(cRes.data.comments);
        setStarred(user && s.stars?.includes(user._id));
        setStarCount(s.stars?.length || 0);
      } catch (err) { if (!cancelled) { toast.error(err.response?.data?.message || 'Failed to load snippet'); navigate('/'); } }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchData();

    //if the effect re-runs (StrictMode) or the component unmounts,
    // mark previous request as cancelled so we don't set state on a stale call.
    return () => { cancelled = true; };
  }, [id]);


  const handleCodeChange = (val) => {
    if (!canEdit) return;
    // If this change was triggered by a remote socket update, don't echo it back.
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    setCode(val);
    emitCodeChange(val);
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
      toast.success('Snippet forked!'); navigate(`/snippets/${data.snippet._id}/edit`);
    } catch { toast.error('Failed to fork'); }
  };
  const handleDelete = async () => {
    if (!window.confirm('Delete this snippet? This cannot be undone.')) return;
    try { await api.delete(`/snippets/${id}`); toast.success('Snippet deleted'); navigate('/'); }
    catch { toast.error('Failed to delete'); }
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" /></div>;
  if (!snippet) return null;

  const langClass = LANG_CLASSES[snippet.language] || 'lang-default';
  const ext = { javascript:'js', typescript:'ts', python:'py', go:'go', rust:'rs', html:'html', css:'css' }[snippet.language] || snippet.language;

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-6 mb-5 animate-fade-in">
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Link to={`/profile/${snippet.author?._id}`} className="flex items-center gap-2 text-sm text-[#BABABA] hover:text-[#FF6D29] transition-all">
                {snippet.author?.avatar
                  ? <img src={snippet.author.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                  : <div className="w-7 h-7 rounded-full gradient-brand-bg flex items-center justify-center text-white text-xs font-bold">{snippet.author?.name?.[0]}</div>
                }
                {snippet.author?.name}
              </Link>
              <span className="text-[#7a6e6e]">/</span>
              <h1 className="text-xl font-bold text-white">{snippet.title}</h1>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${langClass}`}>{snippet.language}</span>
              <span className="flex items-center gap-1 text-xs text-[#7a6e6e]">
                {snippet.isPublic ? <><Globe size={11} /> Public</> : <><Lock size={11} /> Private</>}
              </span>
              {snippet.forkedFrom && (
                <span className="flex items-center gap-1 text-xs text-[#7a6e6e]">
                  <GitFork size={11} /> forked from <Link to={`/snippets/${snippet.forkedFrom._id}`} style={{ color: '#FF6D29' }}>{snippet.forkedFrom.title}</Link>
                </span>
              )}
            </div>

            {snippet.description && <p className="text-sm text-[#BABABA] leading-relaxed mb-2 max-w-xl">{snippet.description}</p>}
            {snippet.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {snippet.tags.map((t) => (
                  <span key={t} className="text-[11px] text-[#BABABA] rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <PresenceAvatars users={presence} />
            <button id="star-btn" onClick={handleStar} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${starred ? 'text-amber-400 border-amber-400/40 bg-amber-400/5' : 'text-[#BABABA]'}`} style={!starred ? { background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' } : {}}>
              <Star size={14} fill={starred ? 'currentColor' : 'none'} /> {starCount} Star{starCount !== 1 ? 's' : ''}
            </button>
            <button id="fork-btn" onClick={handleFork} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-[#BABABA] hover:text-white transition-all" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>
              <GitFork size={14} /> Fork
            </button>
            <button id="share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="w-9 h-9 flex items-center justify-center rounded-xl text-[#BABABA] hover:text-white transition-all" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Share2 size={14} />
            </button>
            {isOwner && (
              <>
                <Link id="edit-btn" to={`/snippets/${id}/edit`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: '#FF6D29', border: '1px solid rgba(255,109,41,0.4)', background: 'rgba(255,109,41,0.08)' }}>
                  <Edit size={13} /> Edit
                </Link>
                <button id="delete-btn" onClick={handleDelete} className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all">
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[13px] text-[#7a6e6e] pb-4 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="flex items-center gap-1.5"><Eye size={13} /> {snippet.views} views</span>
          <span className="flex items-center gap-1.5"><GitFork size={13} /> {snippet.forks?.length || 0} forks</span>
          <span className="ml-auto">{new Date(snippet.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</span>
        </div>

        {/* Monaco Editor */}
        <div className="gradient-card-bg rounded-2xl overflow-hidden animate-fade-in mb-6" style={{ border: '1px solid rgba(255,109,41,0.15)' }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: 'rgba(255,109,41,0.05)', borderBottom: '1px solid rgba(255,109,41,0.12)' }}>
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full editor-dot-red" />
              <span className="w-3 h-3 rounded-full editor-dot-yellow" />
              <span className="w-3 h-3 rounded-full editor-dot-green" />
            </div>
            <span className="flex-1 font-mono text-[13px] text-[#BABABA]">snippet.{ext}</span>
            {presence.length > 1 && (
              <span className="flex items-center gap-1 text-[11px] font-bold mr-2" style={{ color: '#FF6D29' }}>
                <Radio size={11} className="animate-pulse" /> LIVE
              </span>
            )}
            {!canEdit && (
              <span className="text-[11px] text-[#7a6e6e] mr-2">Sign in to edit collaboratively</span>
            )}
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[#BABABA] hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
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
            options={{ readOnly: !canEdit, minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', monospace", lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', automaticLayout: true, padding: { top: 16, bottom: 16 } }}
          />
        </div>

        {/* Comments */}
        <div className="gradient-card-bg rounded-2xl p-6 animate-fade-in" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <CommentThread snippetId={id} comments={comments} onCommentsChange={setComments} />
        </div>
      </div>
    </div>
  );
};

export default SnippetView;
