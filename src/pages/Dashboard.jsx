import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Monitor, Clock, AlertCircle, CheckCircle, FileText, DollarSign, Plus, Wrench, Package, ChevronRight, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const QUICK_ACTIONS = [
  { label: 'Request Devices', icon: Plus, page: 'Requests', color: P.teal },
  { label: 'Log a Ticket', icon: Wrench, page: 'Tickets', color: P.teal },
  { label: 'View Inventory', icon: Package, page: 'Devices', color: P.navy },
  { label: 'Billing', icon: DollarSign, page: 'Billing', color: P.navy },
];

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Device.list('-created_date', 50),
      base44.entities.Ticket.list('-created_date', 10),
      base44.entities.DeviceRequest.list('-created_date', 10),
    ]).then(([devs, tix, reqs]) => {
      setDevices(devs);
      setTickets(tix);
      setRequests(reqs);
      setLoading(false);
    });
  }, []);

  const deployed = devices.filter(d => d.status === 'deployed').length;
  const inRepair = devices.filter(d => d.status === 'in_repair').length;
  const dueRefresh = devices.filter(d => {
    if (!d.refresh_date) return false;
    const days = Math.floor((new Date(d.refresh_date) - new Date()) / (1000 * 60 * 60 * 24));
    return days < 90 && days > 0;
  }).length;
  const openTickets = tickets.filter(t => !['resolved','closed'].includes(t.status)).length;
  const pendingReqs = requests.filter(r => r.status === 'pending_approval').length;

  const stats = [
    { title: 'Active Devices', value: loading ? '—' : deployed, icon: Monitor, color: P.teal, sub: 'Deployed fleet' },
    { title: 'Open Tickets', value: loading ? '—' : openTickets, icon: AlertCircle, color: '#F59E0B', sub: 'Needs attention' },
    { title: 'Due for Refresh', value: loading ? '—' : dueRefresh, icon: Clock, color: P.gold, sub: 'Next 90 days' },
    { title: 'Pending Approvals', value: loading ? '—' : pendingReqs, icon: FileText, color: P.navy, sub: 'Requests queued' },
    { title: 'In Repair', value: loading ? '—' : inRepair, icon: Wrench, color: '#EF4444', sub: 'Devices serviced' },
    { title: 'SLA Compliance', value: '98.5%', icon: CheckCircle, color: '#10B981', sub: 'This month' },
  ];

  const recentTickets = tickets.slice(0, 5);
  const recentRequests = requests.slice(0, 4);

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: P.navy }}>Dashboard</h1>
          <p style={{ color: P.text }}>Welcome back. Here's your device fleet overview.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.page} to={createPageUrl(a.page)} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${a.color}15` }}>
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
              </div>
              <span className="font-semibold text-sm" style={{ color: P.navy }}>{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: P.navy }}>{s.value}</div>
              <div className="text-sm font-medium mb-0.5" style={{ color: P.navy }}>{s.title}</div>
              <div className="text-xs" style={{ color: P.text }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Tickets */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: P.navy }}>Recent Tickets</h2>
              <Link to={createPageUrl('Tickets')} className="text-sm font-medium flex items-center" style={{ color: P.teal }}>
                View All <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
            <div>
              {loading ? (
                <div className="p-8 text-center text-sm" style={{ color: P.text }}>Loading...</div>
              ) : recentTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#10B981' }} />
                  <p className="text-sm font-medium" style={{ color: P.navy }}>No open tickets</p>
                  <p className="text-xs mt-1" style={{ color: P.text }}>All clear!</p>
                </div>
              ) : recentTickets.map((t, i) => (
                <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors" style={{ borderBottom: i < recentTickets.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold" style={{ color: P.teal }}>TK-{t.id?.slice(-4)?.toUpperCase()}</div>
                      <div className="font-semibold text-sm mt-0.5" style={{ color: P.navy }}>{t.device_model || 'Device'}</div>
                      <div className="text-xs mt-0.5" style={{ color: P.text }}>{(t.issue_type || '').replace(/_/g,' ')} • {t.assigned_user}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      t.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {(t.status || 'open').replace('_',' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: P.navy }}>Device Requests</h2>
              <Link to={createPageUrl('Requests')} className="text-sm font-medium flex items-center" style={{ color: P.teal }}>
                View All <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
            <div>
              {loading ? (
                <div className="p-8 text-center text-sm" style={{ color: P.text }}>Loading...</div>
              ) : recentRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-10 h-10 mx-auto mb-3" style={{ color: P.teal, opacity: 0.4 }} />
                  <p className="text-sm font-medium" style={{ color: P.navy }}>No requests yet</p>
                  <Link to={createPageUrl('Requests')} className="text-xs mt-1 font-medium" style={{ color: P.teal }}>Create your first request →</Link>
                </div>
              ) : recentRequests.map((r, i) => (
                <div key={r.id} className="p-4 hover:bg-gray-50 transition-colors" style={{ borderBottom: i < recentRequests.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: P.navy }}>
                        {r.quantity}× {(r.device_class || 'device').replace('_',' ')} ({(r.request_type || '').replace('_',' ')})
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: P.text }}>{r.delivery_location || 'No location'}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      r.status === 'approved' ? 'bg-green-100 text-green-700' :
                      r.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {(r.status || 'draft').replace('_',' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}