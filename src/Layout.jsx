import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Monitor, LayoutDashboard, Package, Wrench, FileText, BarChart3, Settings, Menu, X, ChevronDown, Activity, CreditCard, LogOut, User, Brain, Shield } from 'lucide-react';
import NotificationBell from './components/NotificationBell';
import { base44 } from '@/api/base44Client';

const ALL_NAV_ITEMS = [
  { label: 'Home', page: 'Home', icon: Monitor, roles: ['admin', 'it_admin', 'manager', 'approver', 'end_user', 'user'] },
  { label: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'it_admin', 'manager', 'approver', 'end_user', 'user'] },
  { label: 'Devices', page: 'Devices', icon: Package, roles: ['admin', 'it_admin'] },
  { label: 'Requests', page: 'Requests', icon: FileText, roles: ['admin', 'it_admin', 'manager', 'end_user', 'user'] },
  { label: 'Req. History', page: 'RequestHistory', icon: BarChart3, roles: ['admin', 'it_admin', 'manager', 'approver'] },
  { label: 'Tickets', page: 'Tickets', icon: Wrench, roles: ['admin', 'it_admin', 'manager', 'end_user', 'user'] },
  { label: 'Health', page: 'DeviceHealth', icon: Activity, roles: ['admin', 'it_admin'] },
  { label: 'Predictive AI', page: 'PredictiveMaintenance', icon: Brain, roles: ['admin', 'it_admin'] },
  { label: 'Procurement', page: 'Procurement', icon: BarChart3, roles: ['admin', 'it_admin'] },
  { label: 'Insurance', page: 'InsuranceClaims', icon: Shield, roles: ['admin', 'it_admin', 'manager', 'end_user', 'user'] },
  { label: 'Billing', page: 'Billing', icon: CreditCard, roles: ['admin'] },
  { label: 'Analytics', page: 'Analytics', icon: BarChart3, roles: ['admin', 'it_admin', 'manager'] },
  { label: 'Admin', page: 'Admin', icon: Settings, roles: ['admin'] },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    if (!profileOpen) return;
    const close = (e) => { if (!e.target.closest('#profile-menu')) setProfileOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const userRole = user?.role || 'user';
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));
  const isPublicPage = currentPageName === 'Home';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F9FC', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        :root {
          --navy: #0B1F3A;
          --teal: #0FA3B1;
          --gold: #D4AF37;
          --bg: #F7F9FC;
          --text: #2E3440;
          --border: #E1E6EF;
        }
        .nav-link { transition: all 0.15s ease; }
        .nav-link:hover { opacity: 0.8; }
        .btn-primary { transition: all 0.15s ease; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { box-shadow: 0 8px 30px rgba(11,31,58,0.12); transform: translateY(-2px); }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0B1F3A' }}>
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold" style={{ color: '#0B1F3A' }}>EquipraAfrica</span>
                <span className="block text-xs font-medium" style={{ color: '#0FA3B1' }}>DaaS Platform</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {NAV_ITEMS.map((item) => {
                const active = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium nav-link"
                    style={{
                      backgroundColor: active ? '#0B1F3A' : 'transparent',
                      color: active ? 'white' : '#2E3440',
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right */}
            <div className="hidden md:flex items-center space-x-3">
              <NotificationBell userEmail={user?.email} />
              <div id="profile-menu" className="relative">
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#0FA3B1' }}>
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium" style={{ color: '#0B1F3A' }}>{user?.full_name || 'User'}</div>
                    <div className="text-xs capitalize" style={{ color: '#0FA3B1' }}>{user?.role || 'user'}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} style={{ color: '#2E3440' }} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border z-50 overflow-hidden" style={{ borderColor: '#E1E6EF' }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid #E1E6EF' }}>
                      <div className="text-sm font-semibold" style={{ color: '#0B1F3A' }}>{user?.full_name}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>{user?.email}</div>
                      {user?.department && <div className="text-xs mt-0.5" style={{ color: '#0FA3B1' }}>{user.department}</div>}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setProfileOpen(false); base44.auth.logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors"
                        style={{ color: '#EF4444' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X style={{ color: '#0B1F3A' }} /> : <Menu style={{ color: '#0B1F3A' }} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: '#E1E6EF', backgroundColor: 'white' }}>
            {NAV_ITEMS.map((item) => {
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: active ? '#0B1F3A' : 'transparent',
                    color: active ? 'white' : '#2E3440',
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 mt-2" style={{ borderTop: '1px solid #E1E6EF' }}>
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#0FA3B1' }}>
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#0B1F3A' }}>{user?.full_name}</div>
                  <div className="text-xs capitalize" style={{ color: '#0FA3B1' }}>{user?.role || 'user'}</div>
                </div>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#EF4444' }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-16 py-8 px-4" style={{ backgroundColor: '#0B1F3A' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0FA3B1' }}>
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">EquipraAfrica</span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>© 2026 EquipraAfrica DaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}