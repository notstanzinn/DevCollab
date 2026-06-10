import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications';
import { Bell, Code2, Plus, LogOut, User, Shield, ChevronDown, Check } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const menuRef  = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current  && !menuRef.current.contains(e.target))  setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const avatarInitial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <nav className="sticky top-0 z-50 h-16 glass border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 0 rgba(255,109,41,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg gradient-brand-text shrink-0">
          <Code2 size={22} style={{ color: '#FF6D29' }} />
          DevCollab
        </Link>

        {/* Desktop nav links */}
        <div className="flex items-center gap-1">
          {[
            { to: '/', label: 'Explore', end: true },
            ...(user ? [{ to: `/profile/${user._id}`, label: 'My Snippets' }] : []),
            { to: '/pricing', label: 'Pricing' },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-[#FF6D29] bg-[rgba(255,109,41,0.1)]'
                    : 'text-[#BABABA] hover:text-[#fff] hover:bg-[rgba(255,255,255,0.05)]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link to="/create" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all">
                <Plus size={15} /> New Snippet
              </Link>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  id="notification-bell"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[#BABABA] hover:text-white transition-all"
                  style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="ping-badge absolute -top-1 -right-1 w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold border-2" style={{ background: '#FF6D29', borderColor: '#161316' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-[340px] rounded-2xl shadow-2xl animate-fade-in overflow-hidden z-50" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b text-sm font-semibold" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                      <span className="text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#BABABA] hover:text-white transition-all" style={{ background: 'rgba(255,109,41,0.08)' }}>
                          <Check size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-sm text-[#7a6e6e]">No notifications yet</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => { markRead(n._id); if (n.link) navigate(n.link); setNotifOpen(false); }}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b transition-all relative ${!n.read ? 'bg-[rgba(255,109,41,0.04)]' : ''}`}
                            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#2e2828'}
                            onMouseLeave={e => e.currentTarget.style.background = n.read ? '' : 'rgba(255,109,41,0.04)'}
                          >
                            {n.sender?.avatar
                              ? <img src={n.sender.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                              : <div className="w-8 h-8 rounded-full gradient-brand-bg flex items-center justify-center text-white text-xs font-bold shrink-0">{n.sender?.name?.[0] || '?'}</div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-white leading-snug">{n.message}</p>
                              <span className="text-[11px] text-[#7a6e6e]">{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: '#FF6D29' }} />}
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block text-center py-3 text-[13px] text-[#FF6D29] border-t hover:bg-[rgba(255,109,41,0.06)] transition-all" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  id="user-menu-button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 p-1 pr-2 rounded-xl transition-all"
                  style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,109,41,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                >
                  {user.avatar
                    ? <img src={user.avatar} className="w-[34px] h-[34px] rounded-full object-cover" alt={user.name} />
                    : <div className="w-[34px] h-[34px] rounded-full gradient-brand-bg flex items-center justify-center text-white text-sm font-bold">{avatarInitial}</div>
                  }
                  <ChevronDown size={13} className={`text-[#BABABA] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-[220px] rounded-2xl shadow-2xl animate-fade-in overflow-hidden z-50" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="px-4 py-3 flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-white">{user.name}</span>
                      <span className="text-xs text-[#7a6e6e]">{user.email}</span>
                      {user.plan === 'pro' && <span className="mt-1 self-start px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(255,109,41,0.15)', color: '#ff8c55', border: '1px solid rgba(255,109,41,0.35)' }}>⚡ Pro</span>}
                    </div>
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <Link to={`/profile/${user._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#BABABA] hover:text-white transition-all" style={{ background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = '#2e2828'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <User size={14} /> Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#BABABA] hover:text-white transition-all" onMouseEnter={e => e.currentTarget.style.background = '#2e2828'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Shield size={14} /> Admin Dashboard
                      </Link>
                    )}
                    <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#BABABA] hover:bg-red-500/10 hover:text-red-400 transition-all">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3.5 py-2 rounded-xl text-sm font-semibold text-[#BABABA] hover:text-white transition-all" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>Sign In</Link>
              <Link to="/register" className="px-3.5 py-2 rounded-xl text-sm font-semibold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
