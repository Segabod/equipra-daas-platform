import React, { useState } from 'react';
import { Monitor, Mail, Phone, MapPin, Shield, Lock, Cookie, FileText, X } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', border: 'rgba(255,255,255,0.1)' };

const MODALS = {
  disclaimer: {
    title: 'Disclaimer',
    content: `EquipraAfrica provides this platform and its information on an "as-is" basis. While we endeavour to keep information accurate and up to date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or availability of the platform. Any reliance you place on such information is strictly at your own risk.

Device availability, specifications, pricing, and service terms are subject to change without notice. SLA commitments are governed solely by your signed service agreement with EquipraAfrica.`,
  },
  privacy: {
    title: 'Data Privacy Policy',
    content: `EquipraAfrica is committed to protecting your personal data. We collect only the information necessary to deliver our Device-as-a-Service (DaaS) platform, including device assignment details, user profiles, and service request history.

Your data is stored securely in accordance with the Nigeria Data Protection Regulation (NDPR) and is never sold to third parties. You have the right to access, correct, or request deletion of your personal data at any time by contacting privacy@equipraafrica.ng.`,
  },
  protection: {
    title: 'Data Protection',
    content: `All data transmitted through the EquipraAfrica platform is encrypted using industry-standard TLS/SSL protocols. Sensitive records are stored with AES-256 encryption at rest. 

Access to personal data is restricted to authorised personnel only. We conduct regular security audits and maintain an incident response plan in compliance with the NDPR and applicable international standards.`,
  },
  cookies: {
    title: 'Cookie Policy',
    content: `EquipraAfrica uses essential cookies to enable core functionality of the platform, including authentication sessions and user preferences. We do not use tracking cookies or third-party advertising cookies.

By continuing to use the platform, you consent to our use of essential cookies. You may disable cookies in your browser settings, but this may affect the functionality of certain features.`,
  },
};

export default function Footer() {
  const [openModal, setOpenModal] = useState(null);

  return (
    <>
      {/* Legal Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid #E1E6EF' }}>
              <h2 className="text-lg font-bold" style={{ color: P.navy }}>{MODALS[openModal].title}</h2>
              <button onClick={() => setOpenModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: '#6B7280' }} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}>
                {MODALS[openModal].content}
              </p>
              <p className="text-xs mt-4" style={{ color: '#9CA3AF' }}>Last updated: March 2026 · EquipraAfrica Limited</p>
            </div>
          </div>
        </div>
      )}

      <footer style={{ backgroundColor: P.navy }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          {/* Top section */}
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.teal }}>
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-white text-lg">EquipraAfrica</span>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>DaaS Platform</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Enterprise Device-as-a-Service for modern African businesses. One subscription. Total device lifecycle management.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: P.teal }} />
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Plot 1234, Adeola Odeku Street<br />
                    Victoria Island, Lagos 101001<br />
                    Nigeria
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 flex-shrink-0" style={{ color: P.teal }} />
                  <a href="tel:+2341234567890" className="text-sm hover:underline" style={{ color: 'rgba(255,255,255,0.7)' }}>+234 (0) 123 456 7890</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: P.teal }} />
                  <a href="mailto:hello@equipraafrica.ng" className="text-sm hover:underline" style={{ color: 'rgba(255,255,255,0.7)' }}>hello@equipraafrica.ng</a>
                </div>
              </div>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Legal & Compliance</h3>
              <div className="space-y-2">
                {[
                  { key: 'disclaimer', label: 'Disclaimer', icon: FileText },
                  { key: 'privacy', label: 'Data Privacy Policy', icon: Shield },
                  { key: 'protection', label: 'Data Protection', icon: Lock },
                  { key: 'cookies', label: 'Cookie Policy', icon: Cookie },
                ].map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setOpenModal(key)}
                    className="flex items-center gap-2 text-sm hover:underline transition-opacity hover:opacity-80 w-full text-left"
                    style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: P.teal }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              © {new Date().getFullYear()} EquipraAfrica Limited. All rights reserved. RC: 1234567. Registered in Nigeria.
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Regulated & Compliant · NDPR · ISO 27001
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}