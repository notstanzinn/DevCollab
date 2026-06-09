import useNotifications from '../hooks/useNotifications';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = { star: '⭐', fork: '🍴', comment: '💬', follow: '👤', reply: '↩️', payment: '💳' };

const Notifications = () => {
  const { notifications, loading, markRead, markAllRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto px-6">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold gradient-brand-text">Notifications</h1>
            <p className="text-sm text-[#BABABA] mt-1">Stay updated on activity in your account</p>
          </div>
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-[#BABABA] hover:text-white transition-all" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,109,41,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
          >
            <Check size={13} /> Mark all read
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-[#BABABA]">
            <Bell size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#FF6D29' }} />
            <h3 className="text-lg font-semibold text-white">No notifications</h3>
            <p className="text-sm mt-1">When someone stars, forks, or comments on your snippets, you'll see it here.</p>
          </div>
        ) : (
          <div className="gradient-card-bg rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                id={`notif-${n._id}`}
                onClick={() => { markRead(n._id); if (n.link) navigate(n.link); }}
                className="group relative flex items-center gap-4 px-5 py-4 cursor-pointer transition-all"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: !n.read ? 'rgba(255,109,41,0.04)' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2e2828'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(255,109,41,0.04)'}
              >
                {/* Unread left accent */}
                {!n.read && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r" style={{ background: '#FF6D29' }} />}

                <span className="text-xl shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>

                {n.sender?.avatar
                  ? <img src={n.sender.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                  : <div className="w-9 h-9 rounded-full gradient-brand-bg flex items-center justify-center text-white text-sm font-bold shrink-0">{n.sender?.name?.[0] || '🔔'}</div>
                }

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">{n.message}</p>
                  <span className="text-xs text-[#7a6e6e] mt-0.5 block">{new Date(n.createdAt).toLocaleString()}</span>
                </div>

                {!n.read && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#FF6D29' }} />}

                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-[#7a6e6e] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
