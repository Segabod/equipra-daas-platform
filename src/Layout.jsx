import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Monitor, LayoutDashboard, Package, Wrench, FileText, BarChart3, Settings, Menu, X, Bell, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', page: 'Home', icon: Monitor },
  { label: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { label: 'Devices', page: 'Devices', icon: Package },
  { label: 'Requests', page: 'Requests', icon: FileText },
  { label: 'Req. History', page: 'RequestHistory', icon: BarChart3 },
  { label: 'Tickets', page: 'Tickets', icon: Wrench },
  { label: 'Billing', page: 'Billing', icon: BarChart3 },
  { label: 'Admin', page: 'Admin', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" style={{ color: '#2E3440' }} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#0FA3B1' }}></span>
              </button>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#0FA3B1' }}>
                  IT
                </div>
                <span className="text-sm font-medium" style={{ color: '#0B1F3A' }}>IT Manager</span>
                <ChevronDown className="w-4 h-4" style={{ color: '#2E3440' }} />
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