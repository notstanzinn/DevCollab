import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Code2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('All fields are required'); return; }
    setLoading(true);
    try { await login(form.email, form.password); toast.success('Welcome back!'); navigate('/'); }
    catch (err) { toast.error(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-12" style={{ background: 'linear-gradient(145deg, #241f1f 0%, #1e1a1b 100%)' }}>
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,109,41,0.20) 0%, transparent 65%)', filter: 'blur(40px)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 font-extrabold text-xl gradient-brand-text">
            <Code2 size={28} style={{ color: '#FF6D29' }} /> DevCollab
          </div>
        </div>

        {/* Floating code card */}
        <div className="relative z-10 animate-float">
          <div className="code-preview-card max-w-sm">
            <div className="code-preview-header">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full editor-dot-red" />
                <span className="w-3 h-3 rounded-full editor-dot-yellow" />
                <span className="w-3 h-3 rounded-full editor-dot-green" />
              </div>
              <span className="text-[12px] text-[#7a6e6e] font-mono ml-2">snippet.js</span>
            </div>
            <div className="p-4 font-mono text-[12px] leading-relaxed">
              <span style={{ color: '#FF6D29' }}>const</span>{' '}
              <span style={{ color: '#ff8c55' }}>collaborate</span>{' '}
              <span style={{ color: '#BABABA' }}>=</span>{' '}
              <span style={{ color: '#FF6D29' }}>async</span>{' '}
              <span style={{ color: '#BABABA' }}>() {'=> {'}</span>
              <br />
              <span className="ml-4" style={{ color: '#7a6e6e' }}>// Real-time magic ✨</span>
              <br />
              <span className="ml-4" style={{ color: '#FF6D29' }}>await</span>{' '}
              <span style={{ color: '#BABABA' }}>share(code);</span>
              <br />
              <span style={{ color: '#BABABA' }}>{'}'}</span>
            </div>
          </div>

          {/* Live indicator */}
          <div className="absolute -top-3 -right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: 'rgba(255,109,41,0.15)', border: '1px solid rgba(255,109,41,0.35)', color: '#FF6D29' }}>
            <span className="live-dot" /> LIVE
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-3">Welcome back to DevCollab</h2>
          <p className="text-[#BABABA] text-base leading-relaxed">Your code. Your community. Collaborate in real time with developers worldwide.</p>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative" style={{ background: '#161316' }}>
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,109,41,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 font-extrabold text-xl gradient-brand-text mb-8 lg:hidden">
            <Code2 size={28} style={{ color: '#FF6D29' }} /> DevCollab
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Sign in</h1>
          <p className="text-[#BABABA] mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#BABABA]" htmlFor="login-email">Email</label>
              <div className="relative">
                
                <input
                  id="login-email"
                  type="email"
                  className="input-base pl-10"
                  placeholder="Enter you registered email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#BABABA]" htmlFor="login-password">Password</label>
              <div className="relative">
                
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-base pl-10 pr-10"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7a6e6e] hover:text-white transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={loading} className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-bold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all disabled:opacity-60">
              {loading ? 'Signing in...' : <><span>Sign In</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-[#BABABA] mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#FF6D29' }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
