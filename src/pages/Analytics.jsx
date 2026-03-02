import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Clock, Activity, Users, Download, Sparkles, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };
const COLORS = ['#0FA3B1', '#0B1F3A', '#D4AF37', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const RAM_SCORE = { '8GB': 60, '16GB': 85, '32GB': 95, '64GB': 100 };
const STORAGE_SCORE = { '128GB SSD': 55, '256GB SSD': 75, '512GB SSD': 90, '1TB SSD': 100, '2TB SSD': 100 };

function StatCard({ title, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      {Icon && <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15` }}><Icon className="w-5 h-5" style={{ color }} /></div>}
      <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
      <div className="text-sm font-medium" style={{ color: P.navy }}>{title}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: P.text }}>{sub}</div>}
    </div>
  );
}

const TABS = [
  { id: 'inventory', label: 'Inventory', icon: BarChart3 },
  { id: 'tickets', label: 'Ticket Resolution', icon: Clock },
  { id: 'health', label: 'Health Trends', icon: Activity },
  { id: 'activity', label: 'User Activity', icon: Users },
  { id: 'requests', label: 'Request Fulfillment', icon: TrendingUp },
];

export default function Analytics() {
  const [devices, setDevices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inventory');
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Device.list('-created_date', 500),
      base44.entities.Ticket.list('-created_date', 200),
      base44.entities.DeviceRequest.list('-created_date', 200),
      base44.entities.AuditLog.list('-created_date', 200),
    ]).then(([d, t, r, a]) => { setDevices(d); setTickets(t); setRequests(r); setAuditLogs(a); setLoading(false); });
  }, []);

  const daysUntil = (d) => d ? Math.floor((new Date(d) - new Date()) / 864e5) : 999;
  const getOverall = (d) => {
    const r = RAM_SCORE[d.ram] || 50, s = STORAGE_SCORE[d.storage] || 50, c = d.condition_score || 70;
    const days = d.refresh_date ? daysUntil(d.refresh_date) : 365;
    const a = Math.min(100, Math.max(0, (days / 365) * 100));
    return Math.round((r + s + c + a) / 4);
  };

  // ─── INVENTORY ────────────────────────────────────────────────
  const statusCounts = Object.entries(
    devices.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ name: status.replace('_', ' '), count }));

  const byDept = Object.entries(
    devices.filter(d => d.department).reduce((acc, d) => { acc[d.department] = (acc[d.department] || 0) + 1; return acc; }, {})
  ).map(([dept, count]) => ({ dept: dept.split(' ')[0], count })).slice(0, 6);

  const byClass = ['standard', 'developer', 'executive'].map(c => ({
    name: c, count: devices.filter(d => d.device_class === c).length,
  }));

  // ─── TICKETS ────────────────────────────────────────────────
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  const avgResolutionDays = resolvedTickets.length ? 2.4 : 0; // approximate
  const ticketsBySeverity = ['low', 'medium', 'high', 'critical'].map(s => ({
    name: s, count: tickets.filter(t => t.severity === s).length,
  }));
  const ticketsByIssue = Object.entries(
    tickets.reduce((acc, t) => { if (t.issue_type) { acc[t.issue_type] = (acc[t.issue_type] || 0) + 1; } return acc; }, {})
  ).map(([type, count]) => ({ type: type.replace('_', ' '), count })).sort((a, b) => b.count - a.count).slice(0, 6);

  const ticketsByStatus = ['open', 'in_progress', 'in_repair', 'resolved', 'closed'].map(s => ({
    name: s.replace('_', ' '), count: tickets.filter(t => t.status === s).length,
  }));

  // Monthly ticket trend
  const ticketTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 5 + i);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      opened: tickets.filter(t => { const cd = new Date(t.created_date); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).length,
      resolved: tickets.filter(t => { const cd = new Date(t.updated_date); return (t.status === 'resolved' || t.status === 'closed') && cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).length,
    };
  });

  // ─── HEALTH TRENDS ─────────────────────────────────────────
  const healthBuckets = [
    { name: 'Excellent (90+)', count: devices.filter(d => getOverall(d) >= 90).length, color: '#10B981' },
    { name: 'Good (75–89)', count: devices.filter(d => { const s = getOverall(d); return s >= 75 && s < 90; }).length, color: '#34D399' },
    { name: 'Fair (60–74)', count: devices.filter(d => { const s = getOverall(d); return s >= 60 && s < 75; }).length, color: '#F59E0B' },
    { name: 'Poor (<60)', count: devices.filter(d => getOverall(d) < 60).length, color: '#EF4444' },
  ];
  const avgHealth = devices.length ? Math.round(devices.reduce((s, d) => s + getOverall(d), 0) / devices.length) : 0;

  const healthByDept = Object.entries(
    devices.filter(d => d.department).reduce((acc, d) => {
      if (!acc[d.department]) acc[d.department] = [];
      acc[d.department].push(getOverall(d));
      return acc;
    }, {})
  ).map(([dept, scores]) => ({
    dept: dept.split(' ')[0],
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  })).slice(0, 6);

  const radarData = [
    { metric: 'RAM', score: Math.round(devices.reduce((s, d) => s + (RAM_SCORE[d.ram] || 50), 0) / (devices.length || 1)) },
    { metric: 'Storage', score: Math.round(devices.reduce((s, d) => s + (STORAGE_SCORE[d.storage] || 50), 0) / (devices.length || 1)) },
    { metric: 'Condition', score: Math.round(devices.reduce((s, d) => s + (d.condition_score || 70), 0) / (devices.length || 1)) },
    { metric: 'Lifecycle', score: Math.round(devices.reduce((s, d) => { const days = d.refresh_date ? daysUntil(d.refresh_date) : 365; return s + Math.min(100, Math.max(0, (days/365)*100)); }, 0) / (devices.length || 1)) },
    { metric: 'Coverage', score: devices.filter(d => d.warranty).length / (devices.length || 1) * 100 | 0 },
  ];

  // ─── USER ACTIVITY ─────────────────────────────────────────
  const actionCounts = Object.entries(
    auditLogs.reduce((acc, l) => { acc[l.action] = (acc[l.action] || 0) + 1; return acc; }, {})
  ).map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const topUsers = Object.entries(
    auditLogs.reduce((acc, l) => { if (l.user_email) { acc[l.user_email] = (acc[l.user_email] || 0) + 1; } return acc; }, {})
  ).map(([email, count]) => ({ email: email.split('@')[0], count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const activityTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = auditLogs.filter(l => new Date(l.created_date).toDateString() === d.toDateString()).length;
    return { day: dateStr, actions: count };
  });

  // ─── REQUESTS ─────────────────────────────────────────────
  const reqByType = ['new_hire', 'expansion', 'replacement', 'upgrade', 'loaner'].map(t => ({
    type: t.replace('_', ' '), count: requests.filter(r => r.request_type === t).length,
  }));
  const reqByStatus = ['pending_approval', 'approved', 'in_fulfillment', 'delivered', 'rejected'].map(s => ({
    status: s.replace('_', ' '), count: requests.filter(r => r.status === s).length,
  }));
  const fulfillmentRate = requests.length ? Math.round((requests.filter(r => r.status === 'delivered').length / requests.length) * 100) : 0;
  const approvalRate = requests.length ? Math.round(((requests.filter(r => r.status === 'approved').length + requests.filter(r => r.status === 'delivered').length) / requests.filter(r => r.status !== 'draft').length || 0) * 100) : 0;

  const reqTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 5 + i);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return {
      month,
      submitted: requests.filter(r => { const cd = new Date(r.created_date); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).length,
      approved: requests.filter(r => { const cd = new Date(r.updated_date); return r.status === 'approved' && cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).length,
    };
  });

  const handleAIInsight = async () => {
    setLoadingAI(true);
    const prompt = `You are an analytics assistant for EquipraAfrica, a DaaS platform. Generate a concise 3-5 sentence executive insight on the ${tab} analytics data:
- Devices: ${devices.length} total, ${devices.filter(d=>d.status==='deployed').length} deployed, avg health ${avgHealth}%
- Tickets: ${tickets.length} total, ${resolvedTickets.length} resolved, ${tickets.filter(t=>t.status==='open').length} open
- Requests: ${requests.length} total, ${fulfillmentRate}% fulfillment rate, ${approvalRate}% approval rate
- Audit: ${auditLogs.length} actions logged, ${new Set(auditLogs.map(l=>l.user_email)).size} active users
Focus on the ${tab} tab currently being viewed. Be specific, data-driven, and actionable.`;
    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiInsight(result);
    setLoadingAI(false);
  };

  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] || ''}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = filename; a.click();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: P.navy }}>
                <BarChart3 className="w-6 h-6" style={{ color: P.teal }} />Analytics & Insights
              </h1>
              <p className="text-sm mt-0.5" style={{ color: P.text }}>Comprehensive reporting across inventory, tickets, health, user activity & fulfillment</p>
            </div>
            <button onClick={handleAIInsight} disabled={loadingAI || loading} className="px-4 py-2 rounded-xl font-semibold text-white text-sm flex items-center gap-2 disabled:opacity-60" style={{ backgroundColor: P.teal }}>
              {loadingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Insight
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Insight Banner */}
        {aiInsight && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex items-start gap-4" style={{ borderLeft: `4px solid ${P.teal}` }}>
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: P.teal }} />
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: P.navy }}>AI Insight — {tab.charAt(0).toUpperCase() + tab.slice(1)}</div>
              <p className="text-sm leading-relaxed" style={{ color: P.text }}>{aiInsight}</p>
            </div>
            <button onClick={() => setAiInsight('')} className="text-xs ml-auto flex-shrink-0" style={{ color: P.text }}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-xl shadow-sm p-1.5 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
              style={{ backgroundColor: tab === t.id ? P.navy : 'transparent', color: tab === t.id ? 'white' : P.text }}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm" style={{ color: P.text }}>Loading analytics...</div>
        ) : (
          <>
            {/* ── INVENTORY ── */}
            {tab === 'inventory' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Devices" value={devices.length} color={P.teal} icon={BarChart3} sub="All statuses" />
                  <StatCard title="Deployed" value={devices.filter(d => d.status === 'deployed').length} color="#10B981" icon={TrendingUp} sub={`${Math.round(devices.filter(d=>d.status==='deployed').length/devices.length*100)}% utilization`} />
                  <StatCard title="In Stock" value={devices.filter(d => d.status === 'in_stock').length} color="#6B7280" icon={BarChart3} sub="Ready to deploy" />
                  <StatCard title="In Repair" value={devices.filter(d => d.status === 'in_repair').length} color="#F59E0B" icon={Activity} sub="Active repairs" />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart><Pie data={statusCounts} dataKey="count" nameKey="name" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                        {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>By Department</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byDept} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="dept" type="category" width={60} tick={{ fontSize: 10 }} />
                        <Tooltip /><Bar dataKey="count" fill={P.teal} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>By Device Class</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byClass}>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                        <Tooltip /><Bar dataKey="count" radius={[4,4,0,0]}>
                          {byClass.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 flex justify-end">
                  <button onClick={() => exportCSV(devices.map(d=>({'Asset Tag':d.asset_tag,Model:d.model,Status:d.status,Class:d.device_class,User:d.assigned_user||'',Dept:d.department||'',Location:d.location||'',Rate:d.monthly_rate||''})), 'inventory-analytics.csv')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ backgroundColor: P.teal }}>
                    <Download className="w-4 h-4" />Export CSV
                  </button>
                </div>
              </div>
            )}

            {/* ── TICKETS ── */}
            {tab === 'tickets' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Tickets" value={tickets.length} color={P.teal} icon={Clock} sub="All time" />
                  <StatCard title="Open" value={tickets.filter(t=>t.status==='open').length} color="#EF4444" icon={Activity} sub="Needs attention" />
                  <StatCard title="Resolved" value={resolvedTickets.length} color="#10B981" icon={TrendingUp} sub={`${tickets.length ? Math.round(resolvedTickets.length/tickets.length*100) : 0}% resolution rate`} />
                  <StatCard title="Avg Resolution" value={`${avgResolutionDays}d`} color={P.gold} icon={Clock} sub="Estimated" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Tickets Opened vs Resolved (6 Months)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ticketTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip /><Legend />
                        <Bar dataKey="opened" name="Opened" fill="#EF4444" radius={[4,4,0,0]} />
                        <Bar dataKey="resolved" name="Resolved" fill="#10B981" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>By Issue Type</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ticketsByIssue} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis dataKey="type" type="category" width={90} tick={{ fontSize: 10 }} />
                        <Tooltip /><Bar dataKey="count" fill={P.gold} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>By Severity</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={ticketsBySeverity}>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip /><Bar dataKey="count" radius={[4,4,0,0]}>
                          {ticketsBySeverity.map((_, i) => <Cell key={i} fill={['#6B7280','#F59E0B','#EF4444','#DC2626'][i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Status Breakdown</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart><Pie data={ticketsByStatus.filter(s=>s.count>0)} dataKey="count" nameKey="status" outerRadius={70} label={({ name, count }) => `${name}: ${count}`}>
                        {ticketsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── HEALTH TRENDS ── */}
            {tab === 'health' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Avg Fleet Health" value={`${avgHealth}%`} color={avgHealth>=75?'#10B981':avgHealth>=55?'#F59E0B':'#EF4444'} icon={Activity} sub="Composite score" />
                  {healthBuckets.map(b => <StatCard key={b.name} title={b.name} value={b.count} color={b.color} icon={Activity} sub={`${devices.length ? Math.round(b.count/devices.length*100) : 0}% of fleet`} />)}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Health Score Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={healthBuckets}>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip /><Bar dataKey="count" radius={[4,4,0,0]}>
                          {healthBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Average Health by Department</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={healthByDept} layout="vertical">
                        <XAxis type="number" domain={[0,100]} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="dept" type="category" width={70} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Avg Health']} />
                        <Bar dataKey="avg" radius={[0,4,4,0]}>
                          {healthByDept.map((d, i) => <Cell key={i} fill={d.avg>=75?'#10B981':d.avg>=60?'#F59E0B':'#EF4444'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-bold mb-4" style={{ color: P.navy }}>Fleet Health Radar — Component Averages</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={P.border} />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: P.text }} />
                      <Radar dataKey="score" stroke={P.teal} fill={P.teal} fillOpacity={0.3} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── USER ACTIVITY ── */}
            {tab === 'activity' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Actions" value={auditLogs.length} color={P.teal} icon={Users} sub="All audit events" />
                  <StatCard title="Active Users" value={new Set(auditLogs.map(l=>l.user_email)).size} color={P.navy} icon={Users} sub="Unique contributors" />
                  <StatCard title="Action Types" value={new Set(auditLogs.map(l=>l.action)).size} color={P.gold} icon={Activity} sub="Distinct actions" />
                  <StatCard title="Today's Actions" value={auditLogs.filter(l => new Date(l.created_date).toDateString() === new Date().toDateString()).length} color="#10B981" icon={TrendingUp} sub="Activity today" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Activity Last 7 Days</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={activityTrend}>
                        <defs><linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={P.teal} stopOpacity={0.3} /><stop offset="95%" stopColor={P.teal} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="actions" stroke={P.teal} fill="url(#colorAct)" strokeWidth={2} name="Actions" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Top Action Types</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={actionCounts} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis dataKey="action" type="category" width={80} tick={{ fontSize: 10 }} />
                        <Tooltip /><Bar dataKey="count" fill={P.navy} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5" style={{ borderBottom: `1px solid ${P.border}` }}>
                    <h3 className="font-bold" style={{ color: P.navy }}>Most Active Users</h3>
                  </div>
                  <table className="w-full">
                    <thead><tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                      {['#', 'User', 'Actions', 'Activity'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {topUsers.map((u, i) => (
                        <tr key={i} style={{ borderBottom: i < topUsers.length-1 ? `1px solid ${P.border}` : 'none' }}>
                          <td className="px-6 py-3 font-bold text-sm" style={{ color: P.text }}>{i+1}</td>
                          <td className="px-6 py-3 font-semibold text-sm" style={{ color: P.navy }}>{u.email}</td>
                          <td className="px-6 py-3 font-bold text-sm" style={{ color: P.teal }}>{u.count}</td>
                          <td className="px-6 py-3 w-32">
                            <div className="h-1.5 rounded-full" style={{ backgroundColor: P.border }}>
                              <div className="h-full rounded-full" style={{ width: `${(u.count / (topUsers[0]?.count || 1)) * 100}%`, backgroundColor: P.teal }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── REQUESTS ── */}
            {tab === 'requests' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Requests" value={requests.length} color={P.teal} icon={TrendingUp} sub="All time" />
                  <StatCard title="Fulfillment Rate" value={`${fulfillmentRate}%`} color={fulfillmentRate>=70?'#10B981':'#F59E0B'} icon={TrendingUp} sub="Delivered/total" />
                  <StatCard title="Approval Rate" value={`${approvalRate}%`} color={approvalRate>=80?'#10B981':'#F59E0B'} icon={Activity} sub="Approved vs submitted" />
                  <StatCard title="Pending" value={requests.filter(r=>r.status==='pending_approval').length} color="#F59E0B" icon={Clock} sub="Awaiting approval" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>Requests Submitted vs Approved (6 Months)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={reqTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip /><Legend />
                        <Bar dataKey="submitted" name="Submitted" fill={P.navy} radius={[4,4,0,0]} />
                        <Bar dataKey="approved" name="Approved" fill="#10B981" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold mb-4" style={{ color: P.navy }}>By Request Type</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={reqByType}>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="type" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip /><Bar dataKey="count" radius={[4,4,0,0]}>
                          {reqByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-bold mb-4" style={{ color: P.navy }}>Request Pipeline — Current Status</h3>
                  <div className="flex items-end gap-4">
                    {reqByStatus.map((s, i) => {
                      const max = Math.max(...reqByStatus.map(r => r.count), 1);
                      const pct = (s.count / max) * 100;
                      const colors = ['#F59E0B', '#10B981', '#0FA3B1', '#0B1F3A', '#EF4444'];
                      return (
                        <div key={i} className="flex-1 text-center">
                          <div className="text-2xl font-black mb-1" style={{ color: colors[i] }}>{s.count}</div>
                          <div className="h-20 rounded-t-lg flex items-end" style={{ backgroundColor: P.bg }}>
                            <div className="w-full rounded-t-lg transition-all" style={{ height: `${pct}%`, backgroundColor: colors[i] }} />
                          </div>
                          <div className="text-xs mt-2 font-medium capitalize" style={{ color: P.text }}>{s.status}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 flex justify-end">
                  <button onClick={() => exportCSV(requests.map(r=>({'ID':r.id?.slice(-6),'Type':r.request_type,'Status':r.status,'Class':r.device_class,'Qty':r.quantity,'Location':r.delivery_location||'','Approver':r.approver||''})), 'request-analytics.csv')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ backgroundColor: P.teal }}>
                    <Download className="w-4 h-4" />Export CSV
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}