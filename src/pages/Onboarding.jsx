import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Monitor, Building2, Users, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const INDUSTRIES = ['Banking & Finance', 'Telecoms', 'Insurance', 'FMCG', 'Consulting', 'Healthcare', 'Education', 'Technology', 'Retail', 'Oil & Gas', 'Other'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const STEPS = ['Welcome', 'Company Info', 'Done'];

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', size: '', country: 'Nigeria', city: '', phone: '', address: '', plan: 'standard' });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Check if already onboarded
      if (u?.company_onboarded) {
        window.location.href = createPageUrl('Dashboard');
      }
    }).catch(() => {
      base44.auth.redirectToLogin(createPageUrl('Onboarding'));
    });
  }, []);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    // Create company record
    await base44.entities.Company.create({ ...form, onboarded: true });
    // Mark user as onboarded
    await base44.auth.updateMe({ company_name: form.name, company_onboarded: true, role: 'admin' });
    setSaving(false);
    setStep(2);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: P.bg }}>
        <div className="text-center"><div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: P.teal, borderTopColor: 'transparent' }}></div><p style={{ color: P.text }}>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-xl mx-auto flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.navy }}>
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: P.navy }}>EquipraAfrica</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: step > i ? '#10B981' : step === i ? P.teal : P.border, color: step >= i ? 'white' : P.text }}>
                    {step > i ? <CheckCircle className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className="text-xs mt-1.5 font-medium" style={{ color: step >= i ? P.navy : P.text }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-16 h-0.5 mx-2 mb-4" style={{ backgroundColor: step > i ? '#10B981' : P.border }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            {step === 0 && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${P.teal}15` }}>
                  <Building2 className="w-8 h-8" style={{ color: P.teal }} />
                </div>
                <h1 className="text-3xl font-bold mb-3" style={{ color: P.navy }}>Welcome to EquipraAfrica</h1>
                <p className="text-lg mb-2" style={{ color: P.text }}>Hi <strong>{user.full_name}</strong> 👋</p>
                <p className="mb-8" style={{ color: P.text }}>Let's set up your company profile to get started with device lifecycle management.</p>
                <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                  {[['Device Management', 'Track your entire fleet'], ['Service Requests', 'Order & track devices'], ['SLA Monitoring', 'Stay on top of uptime']].map(([t, d]) => (
                    <div key={t} className="p-4 rounded-xl text-center" style={{ backgroundColor: P.bg }}>
                      <div className="font-semibold mb-1" style={{ color: P.navy }}>{t}</div>
                      <div className="text-xs" style={{ color: P.text }}>{d}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center" style={{ backgroundColor: P.teal }}>
                  Set Up My Company <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Company Information</h2>
                <p className="mb-6" style={{ color: P.text }}>Tell us about your organization</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Company Name <span className="text-red-500">*</span></label>
                    <input value={form.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Consolidated Hallmark Group" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border, color: P.navy }} autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Industry</label>
                      <select value={form.industry} onChange={e=>update('industry',e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border, color: P.navy }}>
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Company Size</label>
                      <select value={form.size} onChange={e=>update('size',e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border, color: P.navy }}>
                        <option value="">Select size</option>
                        {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Country</label>
                      <input value={form.country} onChange={e=>update('country',e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border, color: P.navy }} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>City</label>
                      <input value={form.city} onChange={e=>update('city',e.target.value)} placeholder="Lagos" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border, color: P.navy }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Phone Number</label>
                    <input value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="+234..." className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border, color: P.navy }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Service Plan</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[{v:'standard',l:'Standard',p:'Included'},{v:'premium',l:'Premium',p:'+₦8k/device'},{v:'enterprise',l:'Enterprise',p:'Custom'}].map(opt => (
                        <button key={opt.v} onClick={() => update('plan',opt.v)} className="p-3 rounded-xl border-2 text-center" style={{ borderColor: form.plan===opt.v ? P.teal : P.border, backgroundColor: form.plan===opt.v ? '#F0FAFB' : 'white' }}>
                          <div className="font-semibold text-sm" style={{ color: P.navy }}>{opt.l}</div>
                          <div className="text-xs mt-0.5" style={{ color: P.text }}>{opt.p}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setStep(0)} className="px-5 py-3 rounded-xl font-medium" style={{ color: P.navy }}>Back</button>
                  <button onClick={handleSave} disabled={!form.name || saving} className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>
                    {saving ? 'Setting up...' : 'Complete Setup'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100">
                  <CheckCircle className="w-9 h-9 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold mb-3" style={{ color: P.navy }}>You're all set!</h2>
                <p className="text-lg mb-2" style={{ color: P.text }}><strong>{form.name}</strong> has been registered.</p>
                <p className="mb-8" style={{ color: P.text }}>Your DaaS portal is ready. Start by adding your devices or submitting your first device request.</p>
                <div className="space-y-3">
                  <a href={createPageUrl('Dashboard')} className="block w-full py-3.5 rounded-xl font-semibold text-white" style={{ backgroundColor: P.teal }}>
                    Go to Dashboard <ArrowRight className="w-5 h-5 inline ml-2" />
                  </a>
                  <a href={createPageUrl('Devices')} className="block w-full py-3.5 rounded-xl font-semibold border-2" style={{ borderColor: P.border, color: P.navy }}>
                    Add Devices
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}