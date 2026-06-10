import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Code2, ArrowRight, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AVATARS = ['#FF6D29','#453027','#ff8c55','#e05a1a','#BABABA'];

const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('All fields are required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try { await register(form.name, form.email, form.password); toast.success('Account created! Welcome 🎉'); navigate('/'); }
    catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const fields = [
    { id: 'reg-name',     Icon: User, label: 'Full Name',  type: 'text',     placeholder: 'Enter your username',          key: 'name',     autoComplete: 'name' },
    { id: 'reg-email',    Icon: Mail, label: 'Email',      type: 'email',    placeholder: 'you@example.com',   key: 'email',    autoComplete: 'email' },
    { id: 'reg-password', Icon: Lock, label: 'Password',   type: null,       placeholder: 'Min. 6 characters', key: 'password', autoComplete: 'new-password' },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-12" style={{ background: 'linear-gradient(145deg, #241f1f 0%, #1e1a1b 100%)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,109,41,0.18) 0%, transparent 65%)', filter: 'blur(50px)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 font-extrabold text-xl gradient-brand-text">
            <Code2 size={28} style={{ color: '#FF6D29' }} /> DevCollab
          </div>
        </div>

        {/* Community avatar stack */}
        <div className="relative z-10 animate-fade-in">
          <div className="mb-6">
            <p className="text-sm text-[#BABABA] mb-3 flex items-center gap-2">
              <Users size={14} style={{ color: '#FF6D29' }} /> Join 1,000+ developers already collaborating
            </p>
            <div className="flex -space-x-3">
              {AVATARS.map((color, i) => (
                <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderColor: '#1e1a1b', zIndex: 5 - i }}>
                  {['J','A','M','S','K'][i]}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ background: '#2e2828', borderColor: '#1e1a1b', color: '#BABABA' }}>
                +1k
              </div>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-col gap-3">
            {[
              { label: 'Code snippets shared', value: '10K+', icon: '📦' },
              { label: 'Active collaborations', value: '500+', icon: '⚡' },
              { label: 'Countries represented', value: '80+', icon: '🌍' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,109,41,0.08)', border: '1px solid rgba(255,109,41,0.15)' }}>
                <span className="text-xl">{icon}</span>
                <span className="text-white font-bold text-lg">{value}</span>
                <span className="text-[#BABABA] text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-3">Join the community</h2>
          <p className="text-[#BABABA] leading-relaxed">Share code, learn from others, and collaborate in real time.</p>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative" style={{ background: '#161316' }}>
        <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,109,41,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="flex items-center gap-2 font-extrabold text-xl gradient-brand-text mb-8 lg:hidden">
            <Code2 size={28} style={{ color: '#FF6D29' }} /> DevCollab
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Create your account</h1>
          <p className="text-[#BABABA] mb-8">Free forever. No credit card required.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map(({ id, Icon, label, type, placeholder, key, autoComplete }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#BABABA]" htmlFor={id}>{label}</label>
                <div className="relative">
                  
                  <input
                    id={id}
                    type={key === 'password' ? (showPass ? 'text' : 'password') : type}
                    className={`input-base pl-10 ${key === 'password' ? 'pr-10' : ''}`}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    autoComplete={autoComplete}
                  />
                  {key === 'password' && (
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7a6e6e] hover:text-white transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <p className="text-xs text-[#7a6e6e] leading-relaxed">
              By creating an account you agree to our{' '}
              <a href="#" style={{ color: '#FF6D29' }}>Terms</a> and{' '}
              <a href="#" style={{ color: '#FF6D29' }}>Privacy Policy</a>.
            </p>

            <button id="register-submit" type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-bold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all disabled:opacity-60">
              {loading ? 'Creating account...' : <><span>Create Account</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-[#BABABA] mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#FF6D29' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
