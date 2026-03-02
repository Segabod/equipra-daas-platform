import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Download, Eye, CreditCard, Users } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const REVENUE_TREND = [
  { month: 'Aug', revenue: 195, paid: 195, overdue: 0 },
  { month: 'Sep', revenue: 210, paid: 210, overdue: 0 },
  { month: 'Oct', revenue: 238, paid: 230, overdue: 8 },
  { month: 'Nov', revenue: 252, paid: 252, overdue: 0 },
  { month: 'Dec', revenue: 291, paid: 291, overdue: 0 },
  { month: 'Jan', revenue: 279, paid: 279, overdue: 0 },
  { month: 'Feb', revenue: 285, paid: 0, overdue: 285 },
];

const CLIENT_REVENUE = [
  { name: 'First Bank', value: 89.2, color: '#0FA3B1' },
  { name: 'MTN Nigeria', value: 67.5, color: '#0B1F3A' },
  { name: 'Access Bank', value: 42.0, color: '#D4AF37' },
  { name: 'Hallmark Group', value: 28.5, color: '#10B981' },
  { name: 'Dangote', value: 18.0, color: '#6B7280' },
];

const ALL_INVOICES = [
  { id: 'INV-2026-02-001', client: 'Consolidated Hallmark Group', month: 'February 2026', dueDate: '2026-02-15', amount: 28450000, status: 'overdue' },
  { id: 'INV-2026-02-002', client: 'First Bank Nigeria', month: 'February 2026', dueDate: '2026-02-15', amount: 89200000, status: 'pending' },
  { id: 'INV-2026-02-003', client: 'MTN Nigeria', month: 'February 2026', dueDate: '2026-02-15', amount: 67500000, status: 'paid' },
  { id: 'INV-2026-01-001', client: 'Consolidated Hallmark Group', month: 'January 2026', dueDate: '2026-01-15', amount: 27890000, status: 'paid' },
  { id: 'INV-2026-01-002', client: 'First Bank Nigeria', month: 'January 2026', dueDate: '2026-01-15', amount: 87100000, status: 'paid' },
  { id: 'INV-2026-01-003', client: 'Access Bank', month: 'January 2026', dueDate: '2026-01-15', amount: 42000000, status: 'paid' },
  { id: 'INV-2025-12-001', client: 'Consolidated Hallmark Group', month: 'December 2025', dueDate: '2025-12-15', amount: 29120000, status: 'paid' },
];

const ALL_SUBSCRIPTIONS = [
  { client: 'First Bank Nigeria', plan: 'Enterprise', devices: 892, mrr: 89200000, nextBilling: '2026-03-15', status: 'active' },
  { client: 'MTN Nigeria', plan: 'Executive', devices: 450, mrr: 67500000, nextBilling: '2026-03-15', status: 'active' },
  { client: 'Access Bank', plan: 'Premium', devices: 320, mrr: 42000000, nextBilling: '2026-03-15', status: 'active' },
  { client: 'Consolidated Hallmark Group', plan: 'Premium', devices: 247, mrr: 28450000, nextBilling: '2026-03-15', status: 'overdue' },
  { client: 'Dangote Group', plan: 'Standard', devices: 180, mrr: 18000000, nextBilling: '2026-03-15', status: 'active' },
];

const STATUS_STYLE = {
  paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
  active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
};

function exportCSV(data, filename, columns) {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => `"${row[c.key] ?? ''}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); a.remove();
}

export default function BillingDashboard() {
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [subSearch, setSubSearch] = useState('');

  const totalMRR = ALL_SUBSCRIPTIONS.reduce((s, x) => s + x.mrr, 0);
  const activeSubs = ALL_SUBSCRIPTIONS.filter(s => s.status === 'active').length;
  const overdueAmt = ALL_INVOICES.filter(i => i.status === 'overdue').reduce((s, x) => s + x.amount, 0);
  const paidYTD = ALL_INVOICES.filter(i => i.status === 'paid').reduce((s, x) => s + x.amount, 0);

  const filteredInvoices = ALL_INVOICES.filter(i => invoiceFilter === 'all' || i.status === invoiceFilter);
  const filteredSubs = ALL_SUBSCRIPTIONS.filter(s => s.client.toLowerCase().includes(subSearch.toLowerCase()));

  const metrics = [
    { title: 'Total MRR', value: `₦${(totalMRR/1000000).toFixed(0)}M`, sub: '+8.5% vs last month', icon: DollarSign, color: P.gold },
    { title: 'Active Subscriptions', value: activeSubs, sub: `${ALL_SUBSCRIPTIONS.length} total clients`, icon: Users, color: P.teal },
    { title: 'Overdue Accounts', value: `₦${(overdueAmt/1000000).toFixed(1)}M`, sub: '1 account overdue', icon: AlertCircle, color: '#EF4444' },
    { title: 'Collected YTD', value: `₦${(paidYTD/1000000).toFixed(0)}M`, sub: '2026 payments received', icon: CheckCircle, color: '#10B981' },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${m.color}18` }}>
              <m.icon className="w-5 h-5" style={{ color: m.color }} />
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: P.navy }}>{m.value}</div>
            <div className="text-sm font-medium" style={{ color: P.navy }}>{m.title}</div>
            <div className="text-xs mt-0.5" style={{ color: P.text }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-bold mb-6" style={{ color: P.navy }}>Revenue Trend (₦M)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_TREND}>
              <defs>
                <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={P.teal} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={P.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="overdueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: P.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: P.text }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `₦${v}M`} />
              <Area type="monotone" dataKey="paid" name="Collected" stroke={P.teal} fill="url(#paidGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="overdue" name="Overdue" stroke="#EF4444" fill="url(#overdueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-bold mb-4" style={{ color: P.navy }}>Revenue by Client</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={CLIENT_REVENUE} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {CLIENT_REVENUE.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `₦${v}M`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {CLIENT_REVENUE.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />{c.name}</span>
                <span className="font-semibold" style={{ color: P.navy }}>₦{c.value}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Invoices */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${P.border}` }}>
          <h3 className="text-base font-bold" style={{ color: P.navy }}>All Invoices</h3>
          <div className="flex items-center gap-3">
            <select value={invoiceFilter} onChange={e => setInvoiceFilter(e.target.value)} className="px-3 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              onClick={() => exportCSV(filteredInvoices, 'invoices.csv', [
                { key: 'id', label: 'Invoice ID' }, { key: 'client', label: 'Client' },
                { key: 'month', label: 'Period' }, { key: 'dueDate', label: 'Due Date' },
                { key: 'amount', label: 'Amount (NGN)' }, { key: 'status', label: 'Status' }
              ])}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 border-2"
              style={{ borderColor: P.border, color: P.navy }}
            >
              <Download className="w-4 h-4" />Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                {['Invoice', 'Client', 'Period', 'Due Date', 'Amount', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv, i) => {
                const s = STATUS_STYLE[inv.status];
                const Icon = s.icon;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50" style={{ borderBottom: i < filteredInvoices.length-1 ? `1px solid ${P.border}` : 'none' }}>
                    <td className="px-6 py-4 font-mono font-bold text-sm" style={{ color: P.teal }}>{inv.id}</td>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: P.navy }}>{inv.client}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{inv.month}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: inv.status === 'overdue' ? '#EF4444' : P.navy }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-sm" style={{ color: P.gold }}>₦{(inv.amount/1000000).toFixed(2)}M</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${s.bg} ${s.text}`}>
                        <Icon className="w-3 h-3" />{inv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Subscriptions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${P.border}` }}>
          <h3 className="text-base font-bold" style={{ color: P.navy }}>Subscription Details</h3>
          <div className="flex items-center gap-3">
            <input
              value={subSearch} onChange={e => setSubSearch(e.target.value)}
              placeholder="Search client..."
              className="px-3 py-2 border-2 rounded-lg text-sm"
              style={{ borderColor: P.border, color: P.navy }}
            />
            <button
              onClick={() => exportCSV(filteredSubs, 'subscriptions.csv', [
                { key: 'client', label: 'Client' }, { key: 'plan', label: 'Plan' },
                { key: 'devices', label: 'Devices' }, { key: 'mrr', label: 'MRR (NGN)' },
                { key: 'nextBilling', label: 'Next Billing' }, { key: 'status', label: 'Status' }
              ])}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 border-2"
              style={{ borderColor: P.border, color: P.navy }}
            >
              <Download className="w-4 h-4" />Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                {['Client', 'Plan', 'Devices', 'MRR', 'Next Billing', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub, i) => {
                const s = STATUS_STYLE[sub.status];
                const Icon = s.icon;
                return (
                  <tr key={sub.client} className="hover:bg-gray-50" style={{ borderBottom: i < filteredSubs.length-1 ? `1px solid ${P.border}` : 'none' }}>
                    <td className="px-6 py-4 font-semibold text-sm" style={{ color: P.navy }}>{sub.client}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${P.teal}18`, color: P.teal }}>{sub.plan}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: P.navy }}>{sub.devices}</td>
                    <td className="px-6 py-4 font-bold text-sm" style={{ color: P.gold }}>₦{(sub.mrr/1000000).toFixed(1)}M</td>
                    <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{new Date(sub.nextBilling).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${s.bg} ${s.text}`}>
                        <Icon className="w-3 h-3" />{sub.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}