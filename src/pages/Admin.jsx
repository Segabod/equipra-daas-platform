import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Monitor, AlertCircle, CheckCircle, DollarSign, Clock, Package, TrendingUp, BarChart3, ChevronRight, Shield, CreditCard } from 'lucide-react';
import UserRoleManager from '../components/UserRoleManager';
import AuditLogPanel from '../components/AuditLogPanel';
import BillingDashboard from '../components/admin/BillingDashboard';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const CLIENTS = [
  { name: 'Consolidated Hallmark Group', devices: 247, contract: 'Premium', mrr: 28450000, compliance: 98.5 },
  { name: 'First Bank Nigeria', devices: 892, contract: 'Enterprise', mrr: 89200000, compliance: 99.2 },
  { name: 'MTN Nigeria', devices: 450, contract: 'Executive', mrr: 67500000, compliance: 97.1 },
  { name: 'Access Bank', devices: 320, contract: 'Premium', mrr: 42000000, compliance: 96.8 },
  { name: 'Dangote Group', devices: 180, contract: 'Standard', mrr: 18000000, compliance: 99.0 },
];

const DEPLOYMENT_QUEUE = [
  { order: 'ORD-1024', client: 'Consolidated Hallmark Group', devices: 12, model: 'Dell Latitude 5420', dueDate: '2026-03-10', status: 'imaging' },
  { order: 'ORD-1023', client: 'Access Bank', devices: 25, model: 'HP EliteBook 840', dueDate: '2026-03-08', status: 'ready' },
  { order: 'ORD-1022', client: 'Dangote Group', devices: 8, model: 'MacBook Pro 16"', dueDate: '2026-03-12', status: 'procurement' },
];

const SLA_BREAKDOWN = [
  { label: 'Critical (4hrs)', compliance: 100, count: 12 },
  { label: 'High (24hrs)', compliance: 98.5, count: 45 },
  { label: 'Medium (48hrs)', compliance: 96.2, count: 87 },
  { label: 'Low (72hrs)', compliance: 99.1, count: 268 },
];

export default function Admin() {
  const [devices, setDevices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('operations');

  useEffect(() => {
    Promise.all([
      base44.entities.Device.list('-created_date', 200),
      base44.entities.Ticket.list('-created_date', 50),
      base44.entities.DeviceRequest.list('-created_date', 50),
    ]).then(([d, t, r]) => { setDevices(d); setTickets(t); setRequests(r); setLoading(false); });
  }, []);

  const openTickets = tickets.filter(t => !['resolved','closed'].includes(t.status));
  const pendingReqs = requests.filter(r => r.status === 'pending_approval');

  const metrics = [
    { title: 'Total Clients', value: CLIENTS.length, sub: '+1 this month', icon: Users, color: P.teal },
    { title: 'Managed Devices', value: loading ? '—' : devices.length, sub: 'In database', icon: Monitor, color: P.teal },
    { title: 'Open Tickets', value: loading ? '—' : openTickets.length, sub: 'Needs attention', icon: AlertCircle, color: '#F59E0B' },
    { title: 'SLA Compliance', value: '97.8%', sub: 'This month', icon: CheckCircle, color: '#10B981' },
    { title: 'Monthly Revenue', value: '₦285M', sub: '+8.5% vs last month', icon: DollarSign, color: P.gold },
    { title: 'Pending Approvals', value: loading ? '—' : pendingReqs.length, sub: 'Requests queued', icon: Clock, color: P.navy },
    { title: 'Due for Refresh', value: devices.filter(d => { if (!d.refresh_date) return false; return Math.floor((new Date(d.refresh_date) - new Date()) / (1000*60*60*24)) < 90; }).length, sub: 'Next 90 days', icon: TrendingUp, color: P.gold },
    { title: 'Inventory Value', value: '₦1.85B', sub: 'Total assets', icon: Package, color: P.navy },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center" style={{ color: P.navy }}>
                Admin Portal
                <span className="ml-3 px-2 py-0.5 text-xs font-bold rounded" style={{ backgroundColor: P.gold, color: 'white' }}>OPERATIONS</span>
              </h1>
              <p className="text-sm mt-0.5" style={{ color: P.text }}>Real-time DaaS operations overview</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTab('operations')} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: tab === 'operations' ? P.navy : 'transparent', color: tab === 'operations' ? 'white' : P.text }}>
                <BarChart3 className="w-4 h-4" />Operations
              </button>
              <button onClick={() => setTab('users')} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: tab === 'users' ? P.navy : 'transparent', color: tab === 'users' ? 'white' : P.text }}>
                <Shield className="w-4 h-4" />User Roles
              </button>
              <button onClick={() => setTab('audit')} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: tab === 'audit' ? P.navy : 'transparent', color: tab === 'audit' ? 'white' : P.text }}>
                <BarChart3 className="w-4 h-4" />Audit Log
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === 'users' && <UserRoleManager />}
        {tab === 'audit' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Audit Trail</h2>
            <AuditLogPanel limit={100} />
          </div>
        )}
        {tab === 'operations' && <>
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${m.color}15` }}>
                <m.icon className="w-5 h-5" style={{ color: m.color }} />
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: P.navy }}>{m.value}</div>
              <div className="text-sm font-medium" style={{ color: P.navy }}>{m.title}</div>
              <div className="text-xs mt-0.5" style={{ color: P.text }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Active Clients */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: P.navy }}>Active Clients</h2>
              <button className="text-sm font-medium flex items-center" style={{ color: P.teal }}>
                View All <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                  {['Client', 'Devices', 'Plan', 'MRR', 'SLA'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CLIENTS.map((c, i) => (
                  <tr key={c.name} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < CLIENTS.length-1 ? `1px solid ${P.border}` : 'none' }}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm" style={{ color: P.navy }}>{c.name}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-sm" style={{ color: P.navy }}>{c.devices}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${P.teal}15`, color: P.teal }}>{c.contract}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm" style={{ color: P.gold }}>₦{(c.mrr/1000000).toFixed(1)}M</td>
                    <td className="px-6 py-4 font-semibold text-sm" style={{ color: c.compliance >= 98 ? '#10B981' : '#F59E0B' }}>{c.compliance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SLA Performance */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6" style={{ borderBottom: `1px solid ${P.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: P.navy }}>SLA Performance</h2>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-black mb-1" style={{ color: '#10B981' }}>97.8%</div>
                <div className="text-sm" style={{ color: P.text }}>Overall Compliance</div>
              </div>
              <div className="space-y-4">
                {SLA_BREAKDOWN.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span style={{ color: P.text }}>{s.label}</span>
                      <span className="font-semibold" style={{ color: P.navy }}>{s.compliance}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: P.border }}>
                      <div className="h-full rounded-full" style={{ width: `${s.compliance}%`, backgroundColor: s.compliance >= 98 ? '#10B981' : '#F59E0B' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Queue */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
            <h2 className="text-lg font-bold" style={{ color: P.navy }}>Deployment Queue</h2>
            <button className="text-sm font-medium flex items-center" style={{ color: P.teal }}>
              Manage All <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                {['Order', 'Client', 'Devices', 'Due Date', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPLOYMENT_QUEUE.map((o, i) => (
                <tr key={o.order} className="hover:bg-gray-50" style={{ borderBottom: i < DEPLOYMENT_QUEUE.length-1 ? `1px solid ${P.border}` : 'none' }}>
                  <td className="px-6 py-4 font-mono font-bold text-sm" style={{ color: P.teal }}>{o.order}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm" style={{ color: P.navy }}>{o.client}</div>
                    <div className="text-xs" style={{ color: P.text }}>{o.devices}× {o.model}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-sm" style={{ color: P.navy }}>{o.devices}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{new Date(o.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${o.status==='ready' ? 'bg-green-100 text-green-700' : o.status==='imaging' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending Requests from DB */}
        {!loading && pendingReqs.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6" style={{ borderBottom: `1px solid ${P.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: P.navy }}>Pending Approvals ({pendingReqs.length})</h2>
            </div>
            <div>
              {pendingReqs.map((r, i) => (
                <div key={r.id} className="p-5 flex items-center justify-between hover:bg-gray-50" style={{ borderBottom: i < pendingReqs.length-1 ? `1px solid ${P.border}` : 'none' }}>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: P.navy }}>{r.quantity}× {r.device_class} ({r.request_type?.replace('_',' ')})</div>
                    <div className="text-xs mt-0.5" style={{ color: P.text }}>{r.delivery_location} · {r.cost_center}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={async () => { await base44.entities.DeviceRequest.update(r.id, { status: 'approved' }); const updated = await base44.entities.DeviceRequest.list('-created_date',50); setRequests(updated); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#10B981' }}>
                      Approve
                    </button>
                    <button onClick={async () => { await base44.entities.DeviceRequest.update(r.id, { status: 'rejected' }); const updated = await base44.entities.DeviceRequest.list('-created_date',50); setRequests(updated); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#EF4444' }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>}
      </div>
    </div>
  );
}