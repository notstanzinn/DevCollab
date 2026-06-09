import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Code, MessageSquare, CreditCard,
  Trash2, Shield, Search, BarChart2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [tab,      setTab]      = useState('overview');
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-[#94a3b8]">
          <Shield size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold text-[#e2e8f0]">Access Denied</h3>
          <p className="text-sm mt-1">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, uRes, snRes] = await Promise.all([
          api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/snippets'),
        ]);
        setStats(sRes.data); setUsers(uRes.data.users); setSnippets(snRes.data.snippets);
      } catch { toast.error('Failed to load admin data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their content?')) return;
    try { await api.delete(`/admin/users/${id}`); setUsers((p) => p.filter((u) => u._id !== id)); toast.success('User deleted'); }
    catch { toast.error('Failed'); }
  };

  const deleteSnippet = async (id) => {
    if (!window.confirm('Delete this snippet?')) return;
    try { await api.delete(`/admin/snippets/${id}`); setSnippets((p) => p.filter((s) => s._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const changeRole = async (id, role) => {
    try { await api.put(`/admin/users/${id}/role`, { role }); setUsers((p) => p.map((u) => (u._id === id ? { ...u, role } : u))); toast.success('Role updated'); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" /></div>;

  const filteredUsers    = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const filteredSnippets = snippets.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  const statCards = [
    { icon: <Users size={22} />, label: 'Total Users',      value: stats?.stats.totalUsers,    color: 'text-[#6c63ff] bg-[rgba(108,99,255,0.12)]' },
    { icon: <Code  size={22} />, label: 'Total Snippets',   value: stats?.stats.totalSnippets,  color: 'text-[#a855f7] bg-[rgba(168,85,247,0.12)]' },
    { icon: <MessageSquare size={22} />, label: 'Comments', value: stats?.stats.totalComments,  color: 'text-[#06b6d4] bg-[rgba(6,182,212,0.12)]' },
    { icon: <CreditCard size={22} />,    label: 'Pro Users', value: stats?.stats.proUsers,       color: 'text-[#f59e0b] bg-[rgba(245,158,11,0.12)]' },
  ];

  const thCls = "text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#475569] border-b border-white/[0.06]";
  const tdCls = "py-3 px-4 text-sm text-[#e2e8f0] border-b border-white/[0.03]";

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold gradient-brand-text">Admin Dashboard</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Platform management and moderation</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
          {statCards.map(({ icon, label, value, color }) => (
            <div key={label} className="gradient-card-bg border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4 hover:border-[rgba(108,99,255,0.4)] hover:-translate-y-0.5 transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
              <div>
                <div className="text-2xl font-extrabold text-[#e2e8f0]">{value ?? '—'}</div>
                <div className="text-[12px] text-[#94a3b8]">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/[0.06] pb-3 mb-5">
          {['overview', 'users', 'snippets'].map((t) => (
            <button key={t} id={`admin-tab-${t}`} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'bg-[rgba(108,99,255,0.12)] text-[#8b85ff]' : 'text-[#94a3b8] hover:bg-[#131720] hover:text-[#e2e8f0]'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {[
              { title: 'Recent Users',    items: stats?.recentUsers,    renderRow: (u) => (
                <div key={u._id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-[#1a2030] last:border-0 transition-all">
                  <div className="w-8 h-8 rounded-full gradient-brand-bg flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name[0]}</div>
                  <div className="flex-1"><p className="text-sm text-[#e2e8f0]">{u.name}</p><p className="text-xs text-[#475569]">{u.email}</p></div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${u.plan === 'pro' ? 'bg-[rgba(108,99,255,0.15)] text-[#8b85ff] border border-[rgba(108,99,255,0.3)]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{u.plan}</span>
                </div>
              )},
              { title: 'Recent Snippets', items: stats?.recentSnippets, renderRow: (s) => (
                <div key={s._id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-[#1a2030] last:border-0 transition-all">
                  <Code size={16} className="text-[#6c63ff] shrink-0" />
                  <div className="flex-1"><Link to={`/snippets/${s._id}`} className="text-sm text-[#e2e8f0] hover:text-[#8b85ff] transition-colors">{s.title}</Link><p className="text-xs text-[#475569]">{s.language} · {s.views} views</p></div>
                </div>
              )},
            ].map(({ title, items, renderRow }) => (
              <div key={title}>
                <h3 className="text-sm font-bold text-[#e2e8f0] mb-3">{title}</h3>
                <div className="gradient-card-bg border border-white/[0.06] rounded-2xl overflow-hidden">
                  {items?.map(renderRow)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {tab !== 'overview' && (
          <div className="flex items-center gap-2.5 bg-[#0f1117] border border-white/[0.06] rounded-xl px-3.5 mb-4 focus-within:border-[#6c63ff] transition-all">
            <Search size={14} className="text-[#475569]" />
            <input id="admin-search" className="flex-1 py-3 bg-transparent text-sm text-[#e2e8f0] placeholder:text-[#475569] outline-none" placeholder={`Search ${tab}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}

        {/* Users table */}
        {tab === 'users' && (
          <div className="gradient-card-bg border border-white/[0.06] rounded-2xl overflow-hidden animate-fade-in">
            <table className="w-full">
              <thead>
                <tr>
                  {['User','Email','Plan','Role','Joined','Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-[#1a2030] transition-all">
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        {u.avatar ? <img src={u.avatar} className="w-7 h-7 rounded-full object-cover" alt="" /> : <div className="w-7 h-7 rounded-full gradient-brand-bg flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>}
                        <span className="text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className={`${tdCls} text-[#94a3b8]`}>{u.email}</td>
                    <td className={tdCls}><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${u.plan === 'pro' ? 'bg-[rgba(108,99,255,0.15)] text-[#8b85ff] border border-[rgba(108,99,255,0.3)]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{u.plan}</span></td>
                    <td className={tdCls}>
                      <select className="bg-[#0f1117] border border-white/[0.06] rounded-lg px-2 py-1 text-xs text-[#e2e8f0] outline-none" value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} disabled={u._id === user._id}>
                        <option value="user">user</option><option value="admin">admin</option>
                      </select>
                    </td>
                    <td className={`${tdCls} text-[#475569] text-xs`}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className={tdCls}>
                      <button id={`delete-user-${u._id}`} onClick={() => deleteUser(u._id)} disabled={u._id === user._id} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Snippets table */}
        {tab === 'snippets' && (
          <div className="gradient-card-bg border border-white/[0.06] rounded-2xl overflow-hidden animate-fade-in">
            <table className="w-full">
              <thead>
                <tr>{['Title','Author','Language','Views','Created','Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredSnippets.map((s) => (
                  <tr key={s._id} className="hover:bg-[#1a2030] transition-all">
                    <td className={tdCls}><Link to={`/snippets/${s._id}`} className="text-[#8b85ff] hover:underline">{s.title}</Link></td>
                    <td className={`${tdCls} text-[#94a3b8]`}>{s.author?.name}</td>
                    <td className={tdCls}><span className="px-2 py-0.5 rounded-full text-[11px] bg-[rgba(108,99,255,0.15)] text-[#8b85ff] border border-[rgba(108,99,255,0.3)]">{s.language}</span></td>
                    <td className={`${tdCls} text-[#94a3b8]`}>{s.views}</td>
                    <td className={`${tdCls} text-[#475569] text-xs`}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className={tdCls}>
                      <button id={`delete-snippet-${s._id}`} onClick={() => deleteSnippet(s._id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
