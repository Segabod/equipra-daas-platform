import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Monitor, Shield, Clock, TrendingUp, Users, Wrench, ChevronRight, Check, ArrowRight } from 'lucide-react';

const PALETTE = {
  navy: '#0B1F3A',
  teal: '#0FA3B1',
  gold: '#D4AF37',
  bg: '#F7F9FC',
  text: '#2E3440',
  border: '#E1E6EF',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-16 pb-24 px-4" style={{ background: `linear-gradient(135deg, ${PALETTE.navy} 0%, #1a3a5c 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full mb-8 text-sm font-semibold" style={{ backgroundColor: 'rgba(15,163,177,0.15)', color: PALETTE.teal }}>
                <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: PALETTE.teal }}></span>
                Enterprise Device-as-a-Service · Africa
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Focus on Growth.<br />
                <span style={{ color: PALETTE.teal }}>We Handle</span> Your Devices.
              </h1>
              <p className="text-lg mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Complete device lifecycle management for modern African enterprises. Procurement, maintenance, insurance, and refresh — all in one subscription.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={createPageUrl('Requests')} className="px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center group transition-all" style={{ backgroundColor: PALETTE.teal }}>
                  Request Devices
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to={createPageUrl('Dashboard')} className="px-8 py-4 rounded-xl font-semibold flex items-center justify-center border-2 transition-all" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  Client Portal
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-6">
                {['99.5% Uptime SLA', '24hr Response', 'Pan-African Coverage'].map((item) => (
                  <div key={item} className="flex items-center text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <Check className="w-4 h-4 mr-2" style={{ color: PALETTE.teal }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="hidden md:block">
              <div className="rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: '500K+', label: 'Devices Managed', accent: true },
                    { value: '99.5%', label: 'SLA Compliance', accent: false },
                    { value: '24hr', label: 'Avg. Response', accent: false },
                    { value: '250+', label: 'Enterprise Clients', accent: false },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-3xl font-bold mb-1" style={{ color: s.accent ? PALETTE.gold : 'white' }}>{s.value}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(15,163,177,0.1)', border: '1px solid rgba(15,163,177,0.3)' }}>
                  <div className="text-sm font-medium mb-1" style={{ color: PALETTE.teal }}>Trusted across industries</div>
                  <div className="flex flex-wrap gap-2">
                    {['Banking', 'Insurance', 'Telecoms', 'FMCG', 'Consulting'].map((ind) => (
                      <span key={ind} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>{ind}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: PALETTE.navy }}>Everything Included</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: PALETTE.text }}>Monthly subscription. Zero capital expenditure. Total peace of mind.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Monitor, title: 'Device Lifecycle', desc: 'From procurement to secure retirement. We manage every stage with precision.' },
              { icon: Clock, title: '24hr Response SLA', desc: 'Premium support with guaranteed response times. Your team never loses productivity.' },
              { icon: Shield, title: 'Insurance & Protection', desc: 'Comprehensive coverage for damage, loss, and theft. Assets always protected.' },
              { icon: Wrench, title: 'Repairs & Maintenance', desc: 'Expert technicians, genuine parts, and swap devices to minimize downtime.' },
              { icon: TrendingUp, title: 'Refresh Management', desc: 'Proactive refresh cycles. Never worry about obsolete technology again.' },
              { icon: Users, title: 'Self-Service Portal', desc: 'Empower your IT team with intuitive tools to request, track, and manage devices.' },
            ].map((b, i) => (
              <div key={i} className="p-8 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer" style={{ backgroundColor: PALETTE.bg, borderColor: PALETTE.border }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(15,163,177,0.1)' }}>
                  <b.icon className="w-6 h-6" style={{ color: PALETTE.teal }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: PALETTE.navy }}>{b.title}</h3>
                <p className="leading-relaxed" style={{ color: PALETTE.text }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4" style={{ backgroundColor: PALETTE.bg }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: PALETTE.navy }}>How It Works</h2>
            <p className="text-lg" style={{ color: PALETTE.text }}>Simple, streamlined, designed for enterprise scale</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Request', desc: 'Select device specs from our catalog or configure custom requirements.' },
              { step: '02', title: 'Approve & Deploy', desc: 'Automated approval flows and rapid deployment to your team.' },
              { step: '03', title: 'Manage', desc: 'Track assets, log tickets, and monitor SLA compliance in real time.' },
              { step: '04', title: 'Refresh & Retire', desc: 'Proactive refresh cycles and secure data wiping at end of life.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-7xl font-black mb-4 select-none" style={{ color: PALETTE.teal, opacity: 0.08 }}>{s.step}</div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-4 -mt-12" style={{ backgroundColor: PALETTE.teal, fontSize: '14px' }}>{s.step}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: PALETTE.navy }}>{s.title}</h3>
                <p style={{ color: PALETTE.text }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4" style={{ backgroundColor: PALETTE.navy }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Device Management?</h2>
          <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.7)' }}>Join 250+ enterprises that trust EquipraAfrica with their device lifecycle</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Requests')} className="px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center" style={{ backgroundColor: PALETTE.teal }}>
              Request a Quote <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to={createPageUrl('Dashboard')} className="px-8 py-4 rounded-xl font-semibold border-2 text-white flex items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              Go to Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}