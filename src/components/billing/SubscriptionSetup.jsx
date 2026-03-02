import React, { useState } from 'react';
import { RefreshCw, CheckCircle, CreditCard, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

export default function SubscriptionSetup({ monthlyAmount, onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    const isIframe = window.self !== window.top;
    if (isIframe) {
      alert('Subscription setup only works from the published app. Please open it in a new tab.');
      return;
    }
    setLoading(true);
    setError('');
    const response = await base44.functions.invoke('createSubscription', {
      email,
      name,
      monthlyAmountNGN: monthlyAmount,
    });
    setLoading(false);
    if (response.data?.url) {
      window.location.href = response.data.url;
    } else {
      setError(response.data?.error || 'Failed to set up subscription. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${P.teal}15` }}>
              <RefreshCw className="w-5 h-5" style={{ color: P.teal }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: P.navy }}>Auto-Pay Subscription</h2>
              <p className="text-xs" style={{ color: P.text }}>Set up recurring monthly payments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" style={{ color: P.text }} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: `${P.teal}10`, border: `1px solid ${P.teal}30` }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: P.navy }}>Monthly Subscription</p>
              <p className="text-xs mt-0.5" style={{ color: P.text }}>EquipraAfrica DaaS — Auto-renews monthly</p>
            </div>
            <p className="text-xl font-black" style={{ color: P.gold }}>₦{Number(monthlyAmount).toLocaleString()}<span className="text-sm font-normal">/mo</span></p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: P.navy }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Billing contact name"
                className="w-full px-4 py-3 border-2 rounded-xl text-sm outline-none focus:border-teal-400"
                style={{ borderColor: P.border, color: P.navy }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: P.navy }}>Email Address *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="billing@company.com"
                className="w-full px-4 py-3 border-2 rounded-xl text-sm outline-none focus:border-teal-400"
                style={{ borderColor: P.border, color: P.navy }} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

          <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: P.bg, color: P.text }}>
            <p className="font-semibold mb-1" style={{ color: P.navy }}>How it works:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>You'll be redirected to Stripe's secure checkout</li>
              <li>Enter your card details once</li>
              <li>Payments are automatically charged on the 1st of each month</li>
              <li>Cancel anytime from your account</li>
            </ul>
          </div>
        </div>

        <div className="p-6 flex gap-3" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium border-2 text-sm" style={{ borderColor: P.border, color: P.navy }}>Cancel</button>
          <button onClick={handleSetup} disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: P.teal }}>
            <CreditCard className="w-4 h-4" />
            {loading ? 'Setting up...' : 'Set Up Auto-Pay'}
          </button>
        </div>
      </div>
    </div>
  );
}