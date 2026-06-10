import { Link } from 'react-router-dom';
import { Star, GitFork, Eye, Code } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LANG_CLASSES = {
  javascript: 'lang-javascript', typescript: 'lang-typescript', python: 'lang-python',
  rust: 'lang-rust', go: 'lang-go', css: 'lang-css', html: 'lang-html',
};

const getLangClass = (lang) => LANG_CLASSES[lang] || 'lang-default';

const getTimeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const SnippetCard = ({ snippet, onStar }) => {
  const { user } = useAuth();
  const isStarred = user && snippet.stars?.includes(user._id);

  return (
    <div
      className="gradient-card-bg rounded-2xl p-5 flex flex-col gap-3.5 animate-fade-in transition-all duration-300 group"
      style={{
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,109,41,0.4)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 16px rgba(255,109,41,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={`/profile/${snippet.author?._id}`} className="flex items-center gap-2 text-sm text-[#BABABA] hover:text-white transition-all">
          {snippet.author?.avatar
            ? <img src={snippet.author.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
            : <div className="w-6 h-6 rounded-full gradient-brand-bg flex items-center justify-center text-white text-[10px] font-bold">{snippet.author?.name?.[0] || '?'}</div>
          }
          <span>{snippet.author?.name || 'Unknown'}</span>
        </Link>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getLangClass(snippet.language)}`}>{snippet.language}</span>
      </div>

      {/* Body */}
      <Link to={`/snippets/${snippet._id}`} className="block">
        <h3 className="text-[15px] font-bold text-white mb-1.5 leading-snug group-hover:text-[#FF6D29] transition-colors">{snippet.title}</h3>
        {snippet.description && (
          <p className="text-[13px] text-[#BABABA] leading-relaxed line-clamp-2">{snippet.description}</p>
        )}
        <div
          className="flex items-center gap-1.5 mt-2 rounded-lg px-2.5 py-2 font-mono text-[11px] text-[#7a6e6e] overflow-hidden whitespace-nowrap"
          style={{ background: '#0d0b0b', border: '1px solid rgba(255,109,41,0.12)' }}
        >
          <Code size={11} className="shrink-0 text-[#FF6D29]" />
          <span className="truncate">{snippet.code?.split('\n').slice(0, 3).join(' ').substring(0, 80)}...</span>
        </div>
      </Link>

      {/* Tags */}
      {snippet.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {snippet.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-[#BABABA] rounded-full px-2 py-0.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <button
            id={`star-${snippet._id}`}
            onClick={() => onStar && onStar(snippet._id)}
            className={`flex items-center gap-1.5 text-[13px] px-1.5 py-1 rounded-md transition-all hover:bg-white/[0.05] ${isStarred ? 'text-amber-400' : 'text-[#7a6e6e] hover:text-white'}`}
          >
            <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
            <span>{snippet.stars?.length || 0}</span>
          </button>
          <span className="flex items-center gap-1.5 text-[13px] text-[#7a6e6e]">
            <GitFork size={13} /><span>{snippet.forks?.length || 0}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-[#7a6e6e]">
            <Eye size={13} /><span>{snippet.views || 0}</span>
          </span>
        </div>
        <span className="text-[11px] text-[#7a6e6e]">{getTimeAgo(snippet.createdAt)}</span>
      </div>
    </div>
  );
};

export default SnippetCard;
