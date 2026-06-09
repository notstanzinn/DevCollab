import { Check, X, Zap, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES_FREE = [
  { text: 'Create up to 10 public snippets',   included: true },
  { text: 'Browse the snippet feed',           included: true },
  { text: 'Star & comment on snippets',        included: true },
  { text: 'Follow other developers',           included: true },
  { text: 'Unlimited snippets',                included: false },
  { text: 'Private snippets',                  included: false },
  { text: 'Real-time collaboration',           included: false },
  { text: 'Priority support',                  included: false },
];

const FEATURES_PRO = [
  { text: 'Unlimited public & private snippets',  included: true },
  { text: 'Real-time collaboration rooms',        included: true },
  { text: 'Star & comment on snippets',           included: true },
  { text: 'Follow other developers',              included: true },
  { text: 'Advanced analytics',                   included: true },
  { text: 'Pro badge on profile',                 included: true },
  { text: 'Priority support',                     included: true },
  { text: 'Early access to new features',         included: true },
];

const FeatureList = ({ features }) => (
  <ul className="flex flex-col gap-3 flex-1">
    {features.map((f, i) => (
      <li key={i} className={`flex items-center gap-3 text-sm ${f.included ? 'text-[#e2e8f0]' : 'text-[#475569] line-through'}`}>
        {f.included
          ? <Check size={15} className="text-emerald-400 shrink-0" />
          : <X size={15} className="text-[#475569] shrink-0" />
        }
        {f.text}
      </li>
    ))}
  </ul>
);

const Pricing = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) { toast.error('Sign in to upgrade'); navigate('/login'); return; }
    if (user.plan === 'pro') { toast.success("You're already Pro!"); return; }
    setLoading(true);
    try { const { data } = await api.post('/payments/create-checkout'); window.location.href = data.url; }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to start checkout'); }
    finally { setLoading(false); }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try { const { data } = await api.post('/payments/portal'); window.location.href = data.url; }
    catch { toast.error('Failed to open billing portal'); }
    finally { setLoading(false); }
  };

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#8b85ff] bg-[rgba(108,99,255,0.12)] border border-[rgba(108,99,255,0.3)]">
            <Zap size={13} /> Simple Pricing
          </div>
          <h1 className="text-3xl font-extrabold gradient-brand-text">Choose Your Plan</h1>
          <p className="text-[#94a3b8] text-base max-w-md">Start free. Upgrade when you're ready to unlock the full DevCollab experience.</p>
        </div>

        {/* Pro user banner */}
        {user?.plan === 'pro' && (
          <div className="flex items-center gap-3 bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.3)] rounded-2xl px-5 py-4 mb-8">
            <Shield size={20} className="text-[#8b85ff] shrink-0" />
            <span className="flex-1 text-sm text-[#e2e8f0]">You're on the <strong>Pro plan</strong>. Enjoy all features!</span>
            <button onClick={handleManageBilling} className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#94a3b8] bg-[#131720] border border-white/[0.06] hover:border-[rgba(108,99,255,0.4)] transition-all">Manage Billing</button>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="gradient-card-bg border border-white/[0.06] rounded-3xl p-8 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">Free</h2>
              <div className="flex items-baseline gap-0.5 mb-2">
                <span className="text-4xl font-black gradient-brand-text">$0</span>
                <span className="text-sm text-[#94a3b8] ml-1">forever</span>
              </div>
              <p className="text-[13px] text-[#94a3b8]">Perfect for getting started and exploring the platform</p>
            </div>
            <FeatureList features={FEATURES_FREE} />
            <button id="free-plan-btn" className="w-full py-3 rounded-xl text-sm font-medium text-[#94a3b8] border border-white/[0.06] bg-transparent hover:bg-[#1a2030] transition-all disabled:opacity-50" disabled={user?.plan === 'free'}>
              {user?.plan === 'free' ? '✓ Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro */}
          <div className="relative border border-[rgba(108,99,255,0.4)] rounded-3xl p-8 flex flex-col gap-6" style={{ background: 'linear-gradient(145deg, #1a1530, #0f1117)', boxShadow: '0 0 40px rgba(108,99,255,0.1)' }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wider gradient-brand-bg">
              Most Popular
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#e2e8f0] mb-2 flex items-center gap-2">Pro <Zap size={17} className="text-[#6c63ff]" /></h2>
              <div className="flex items-baseline gap-0.5 mb-2">
                <span className="text-4xl font-black gradient-brand-text">$9</span>
                <span className="text-sm text-[#94a3b8]">.99 / month</span>
              </div>
              <p className="text-[13px] text-[#94a3b8]">Everything you need to collaborate and build in public</p>
            </div>
            <FeatureList features={FEATURES_PRO} />
            <button id="pro-plan-btn" onClick={handleSubscribe} disabled={loading || user?.plan === 'pro'} className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-brand-bg glow-accent hover:-translate-y-px transition-all disabled:opacity-60">
              {loading ? 'Redirecting...' : user?.plan === 'pro' ? '✓ Current Plan' : 'Upgrade to Pro →'}
            </button>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#475569] mt-10 leading-relaxed">
          All plans include a 14-day money-back guarantee. No questions asked.<br />
          Payments processed securely via Stripe.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
