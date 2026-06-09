import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Zap, GitFork, Star, Users, TrendingUp, Code2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import SnippetCard from '../components/SnippetCard';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const LANGUAGES = [
  'All', 'javascript', 'typescript', 'python', 'go', 'rust', 'java',
  'cpp', 'csharp', 'html', 'css', 'sql', 'bash',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'stars', label: 'Most Starred' },
];

const FEATURES = [
  { icon: '⚡', title: 'Real-time Collaboration', desc: 'Edit snippets together live with presence avatars showing who\'s in the room.' },
  { icon: '🌿', title: 'Fork & Remix', desc: 'Take any public snippet, fork it, and build upon it instantly.' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Get notified when someone stars, forks or comments on your code.' },
];

const Home = () => {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSnippets, setTotalSnippets] = useState(0);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (language !== 'All') params.language = language;
      if (search) params.search = search;
      const { data } = await api.get('/snippets', { params });
      setSnippets(data.snippets);
      setTotalPages(data.pages);
      setTotalSnippets(data.total);
    } catch { toast.error('Failed to load snippets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSnippets(); }, [page, language, sort]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchSnippets(); };

  const handleStar = async (snippetId) => {
    if (!user) { toast.error('Sign in to star snippets'); return; }
    try {
      const { data } = await api.post(`/snippets/${snippetId}/star`);
      setSnippets((prev) =>
        prev.map((s) =>
          s._id === snippetId
            ? { ...s, stars: data.starred ? [...(s.stars || []), user._id] : (s.stars || []).filter((id) => id !== user._id) }
            : s
        )
      );
    } catch { toast.error('Failed to star snippet'); }
  };

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center overflow-hidden px-6 py-20">
        {/* Atmospheric orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-6" style={{ color: '#FF6D29', background: 'rgba(255,109,41,0.12)', border: '1px solid rgba(255,109,41,0.3)' }}>
            <Zap size={13} /> Real-time Code Collaboration
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-white mb-6">
            Share Code.{' '}
            <span className="gradient-brand-text">Collaborate.</span>
            <br />Build Together.
          </h1>

          <p className="text-lg text-[#BABABA] leading-relaxed max-w-xl mx-auto mb-10">
            Discover, share, and collaborate on code snippets in real time.
            Star your favorites, fork and remix, connect with developers worldwide.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-14">
            <Link to={user ? '/create' : '/register'} className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white gradient-brand-bg glow-accent hover:-translate-y-1 transition-all">
              {user ? 'Create Snippet' : 'Get Started Free'} <ArrowRight size={18} />
            </Link>
            <Link to="/" onClick={() => document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-[#BABABA] hover:text-white transition-all" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>
              Explore Snippets
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { icon: <TrendingUp size={15} />, label: 'Snippets', value: totalSnippets || '0' },
              { icon: <Users size={15} />, label: 'Developers', value: '1K+' },
              { icon: <Star size={15} />, label: 'Stars', value: '5K+' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 text-sm rounded-full px-4 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#FF6D29' }}>{icon}</span>
                <span><strong className="text-white">{value}</strong> <span className="text-[#BABABA]">{label}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #161316)' }} />
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Everything you need to ship faster</h2>
            <p className="text-[#BABABA]">Built for developers who value speed, collaboration, and clean code.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="feature-card text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4" style={{ background: 'rgba(255,109,41,0.12)', border: '1px solid rgba(255,109,41,0.2)' }}>
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-[#BABABA] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEED ── */}
      <section id="feed" className="py-10 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Search + Sort */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <form onSubmit={handleSearch} className="flex-1 min-w-[240px] flex items-center gap-2.5 rounded-xl px-3.5 transition-all" style={{ background: '#1e1a1b', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(255,109,41,0.5)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <Search size={15} className="text-[#7a6e6e] shrink-0" />
              <input
                id="search-input"
                type="text"
                className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-[#7a6e6e] outline-none"
                placeholder="Search snippets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white gradient-brand-bg">Search</button>
            </form>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-[#7a6e6e]" />
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer transition-all"
                style={{ background: '#1e1a1b', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value} style={{ background: '#241f1f' }}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Language tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-7 scrollbar-none">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                id={`lang-tab-${lang}`}
                onClick={() => { setLanguage(lang); setPage(1); }}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border transition-all"
                style={language === lang
                  ? { background: 'rgba(255,109,41,0.15)', borderColor: 'rgba(255,109,41,0.45)', color: '#FF6D29' }
                  : { background: 'transparent', borderColor: 'rgba(255,255,255,0.07)', color: '#BABABA' }
                }
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]"><div className="spinner" /></div>
          ) : snippets.length === 0 ? (
            <div className="text-center py-16 text-[#BABABA]">
              <GitFork size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#FF6D29' }} />
              <h3 className="text-lg font-semibold text-white">No snippets found</h3>
              <p className="text-sm mt-1">Try a different search or language filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
              {snippets.map((s) => <SnippetCard key={s._id} snippet={s} onStar={handleStar} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#BABABA] hover:text-white hover:border-[rgba(255,109,41,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>
                ← Previous
              </button>
              <span className="text-sm text-[#BABABA]">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#BABABA] hover:text-white hover:border-[rgba(255,109,41,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all" style={{ background: '#241f1f', border: '1px solid rgba(255,255,255,0.07)' }}>
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
