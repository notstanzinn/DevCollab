import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Star, GitFork, Calendar, Edit2, Upload } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SnippetCard from '../components/SnippetCard';
import toast from 'react-hot-toast';

const Profile = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [snippets, setSnippets]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [editMode, setEditMode]   = useState(false);
  const [editForm, setEditForm]   = useState({ name: '', bio: '' });

  const isOwnProfile = user && id === String(user._id);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/${id}`);
        setProfile(data.user); setSnippets(data.snippets);
        setFollowerCount(data.user.followers?.length || 0);
        setFollowing(user && data.user.followers?.includes(user._id));
        setEditForm({ name: data.user.name, bio: data.user.bio || '' });
      } catch { toast.error('Failed to load profile'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id, user]);

  const handleFollow = async () => {
    if (!user) { toast.error('Sign in to follow'); return; }
    try {
      const { data } = await api.post(`/users/${id}/follow`);
      setFollowing(data.following); setFollowerCount(data.followerCount);
    } catch { toast.error('Failed to follow'); }
  };

  const handleSaveProfile = async () => {
    try {
      const { data } = await api.put('/users/profile', editForm);
      setProfile((p) => ({ ...p, ...data.user })); updateUser({ name: data.user.name }); setEditMode(false); toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try {
      const { data } = await api.post('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile((p) => ({ ...p, avatar: data.user.avatar })); updateUser({ avatar: data.user.avatar }); toast.success('Avatar updated!');
    } catch { toast.error('Failed to upload avatar'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" /></div>;
  if (!profile) return null;

  const totalStars = snippets.reduce((a, s) => a + (s.stars?.length || 0), 0);
  const totalForks = snippets.reduce((a, s) => a + (s.forks?.length || 0), 0);

  const stats = [
    { label: 'Snippets',       value: snippets.length },
    { Icon: Star,    label: 'Stars',          value: totalStars },
    { Icon: GitFork, label: 'Forks',          value: totalForks },
    { Icon: Users,   label: 'Followers',      value: followerCount },
    {                label: 'Following',       value: profile.following?.length || 0 },
  ];

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* Profile card */}
        <div className="gradient-card-bg rounded-2xl p-6 flex flex-wrap gap-6 items-start mb-6 animate-fade-in" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.avatar
              ? <img src={profile.avatar} className="w-24 h-24 rounded-full object-cover" alt={profile.name} style={{ border: '3px solid rgba(255,109,41,0.3)' }} />
              : <div className="w-24 h-24 rounded-full gradient-brand-bg flex items-center justify-center text-white text-4xl font-extrabold" style={{ border: '3px solid rgba(255,109,41,0.3)' }}>{profile.name?.[0]}</div>
            }
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full gradient-brand-bg flex items-center justify-center cursor-pointer text-white hover:opacity-80 transition-opacity" style={{ border: '2px solid #161316' }} title="Change avatar">
                <Upload size={12} />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            {editMode ? (
              <div className="flex flex-col gap-3 max-w-md">
                <input
                  className="input-base"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                />
                <textarea
                  className="input-base resize-none"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="px-4 py-2 rounded-xl text-sm font-semibold text-white gradient-brand-bg glow-accent transition-all">Save</button>
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#BABABA] hover:text-white transition-all" style={{ background: '#2e2828', border: '1px solid rgba(255,255,255,0.07)' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
                  {profile.plan === 'pro' && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(255,109,41,0.15)', color: '#ff8c55', border: '1px solid rgba(255,109,41,0.35)' }}>⚡ Pro</span>}
                  {profile.role === 'admin' && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>🛡 Admin</span>}
                </div>
                {profile.bio && <p className="text-sm text-[#BABABA] leading-relaxed mb-2 max-w-lg">{profile.bio}</p>}
                <div className="flex items-center gap-1.5 text-xs text-[#7a6e6e]">
                  <Calendar size={12} />
                  Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </div>
              </>
            )}
          </div>

          {/* Action */}
          <div className="shrink-0">
            {isOwnProfile
              ? <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: '#FF6D29', border: '1px solid rgba(255,109,41,0.4)', background: 'rgba(255,109,41,0.08)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,109,41,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,109,41,0.08)'}><Edit2 size={13} /> Edit Profile</button>
              : user && <button id="follow-btn" onClick={handleFollow} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${following ? '' : 'text-white gradient-brand-bg glow-accent hover:-translate-y-px'}`} style={following ? { color: '#BABABA', background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' } : {}}>{following ? 'Unfollow' : '+ Follow'}</button>
            }
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 animate-fade-in">
          {stats.map(({ Icon, label, value }) => (
            <div key={label} className="gradient-card-bg rounded-xl p-4 flex flex-col items-center gap-1 text-center transition-all hover:-translate-y-0.5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,109,41,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              {Icon && <Icon size={15} className="text-[#7a6e6e]" />}
              <span className="text-2xl font-extrabold text-white">{value}</span>
              <span className="text-[11px] text-[#BABABA] uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Snippets */}
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          Public Snippets
          <span className="px-2.5 py-0.5 rounded-full text-sm font-medium" style={{ background: 'rgba(255,109,41,0.12)', color: '#ff8c55', border: '1px solid rgba(255,109,41,0.25)' }}>{snippets.length}</span>
        </h2>

        {snippets.length === 0 ? (
          <div className="text-center py-16 text-[#BABABA]">
            <GitFork size={40} className="mx-auto mb-4 opacity-40" style={{ color: '#FF6D29' }} />
            <h3 className="text-base font-semibold text-white">No snippets yet</h3>
            {isOwnProfile && (
              <Link to="/create" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all">
                Create your first snippet
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
            {snippets.map((s) => <SnippetCard key={s._id} snippet={s} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
