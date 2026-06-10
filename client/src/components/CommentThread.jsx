import { useState } from 'react';
import { Send, MessageSquare, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const getTimeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const Avatar = ({ user, size = 32 }) => {
  const sz = `${size}px`;
  return user?.avatar
    ? <img src={user.avatar} style={{ width: sz, height: sz }} className="rounded-full object-cover shrink-0" alt="" />
    : <div style={{ width: sz, height: sz, fontSize: size * 0.4 }} className="rounded-full gradient-brand-bg flex items-center justify-center text-white font-bold shrink-0">{user?.name?.[0] || '?'}</div>;
};

const Comment = ({ comment, snippetId, onReply, depth = 0 }) => {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(comment.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReply(replyText.trim(), comment._id);
    setReplyText(''); setShowReply(false);
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-11 pl-4' : ''}`} style={depth > 0 ? { borderLeft: '2px solid rgba(255,109,41,0.2)' } : {}}>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Avatar user={comment.author} size={32} />
        {depth === 0 && <div className="w-0.5 flex-1 min-h-3 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />}
      </div>
      <div className="flex-1 pb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[13px] font-semibold text-white">{comment.author?.name || 'Unknown'}</span>
          <span className="text-[11px] text-[#7a6e6e]">{getTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-[#BABABA] leading-relaxed">{comment.content}</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { setLiked(!liked); setLikeCount(liked ? likeCount - 1 : likeCount + 1); }}
            className={`flex items-center gap-1 text-[12px] px-1.5 py-1 rounded transition-all ${liked ? 'text-[#FF6D29]' : 'text-[#7a6e6e] hover:text-white'}`}
            style={{ background: liked ? 'rgba(255,109,41,0.08)' : 'transparent' }}
          >
            <ThumbsUp size={12} fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          {user && depth < 2 && (
            <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 text-[12px] text-[#7a6e6e] px-1.5 py-1 rounded hover:text-white transition-all" style={{ background: 'transparent' }}>
              <MessageSquare size={12} /> Reply
            </button>
          )}
        </div>
        {showReply && (
          <form onSubmit={handleReply} className="flex gap-2 mt-2 items-center">
            <input
              className="flex-1 rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-[#7a6e6e] focus:outline-none transition-all"
              style={{ background: 'rgba(30,26,27,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,109,41,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,109,41,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; }}
              placeholder={`Reply to ${comment.author?.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button type="submit" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white gradient-brand-bg transition-all hover:-translate-y-px">
              <Send size={13} /> Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const CommentThread = ({ snippetId, comments, onCommentsChange }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/snippets/${snippetId}/comments`, { content: newComment });
      onCommentsChange([...comments, data.comment]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally { setSubmitting(false); }
  };

  const handleReply = async (content, parentComment) => {
    if (!user) return;
    try {
      const { data } = await api.post(`/snippets/${snippetId}/comments`, { content, parentComment });
      onCommentsChange([...comments, data.comment]);
      toast.success('Reply posted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post reply'); }
  };

  const topLevel = comments.filter((c) => !c.parentComment);
  const getReplies = (pid) => comments.filter((c) => String(c.parentComment) === String(pid));

  return (
    <div className="flex flex-col gap-6">
      <h3 className="flex items-center gap-2 text-base font-bold text-white">
        <MessageSquare size={17} style={{ color: '#FF6D29' }} />
        Discussion{' '}
        <span className="px-2 py-0.5 rounded-full text-sm font-medium" style={{ background: 'rgba(255,109,41,0.12)', color: '#ff8c55', border: '1px solid rgba(255,109,41,0.3)' }}>
          {comments.length}
        </span>
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <Avatar user={user} size={36} />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#7a6e6e] focus:outline-none transition-all resize-none"
              style={{ background: 'rgba(30,26,27,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,109,41,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,109,41,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; }}
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
            />
            <button type="submit" disabled={submitting} className="self-end flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white gradient-brand-bg hover:-translate-y-px transition-all disabled:opacity-60">
              <Send size={13} /> {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-[#BABABA]">
          <a href="/login" style={{ color: '#FF6D29' }}>Sign in</a> to join the discussion
        </p>
      )}

      <div className="flex flex-col gap-4">
        {topLevel.map((comment) => (
          <div key={comment._id}>
            <Comment comment={comment} snippetId={snippetId} onReply={handleReply} depth={0} />
            {getReplies(comment._id).map((reply) => (
              <Comment key={reply._id} comment={reply} snippetId={snippetId} onReply={handleReply} depth={1} />
            ))}
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-10 text-[#BABABA]">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#FF6D29' }} />
            <h3 className="text-base font-semibold text-white">No comments yet</h3>
            <p className="text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentThread;
