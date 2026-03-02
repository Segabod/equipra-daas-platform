import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, Monitor, RefreshCw, Users, Download, CheckCircle, Package, AlertCircle, XCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const STATUS_COLORS = {
  deployed: '#10B981', in_stock: '#6B7280', in_repair: '#F59E0B',
  awaiting_swap: '#F59E0B', returned: '#9CA3AF', retired: '#EF4444', lost_stolen: '#DC2626',
};
const STATUS_LABELS = {
  deployed: 'Deployed', in_stock: 'In Stock', in_repair: 'In Repair',
  awaiting_swap: 'Awaiting Swap', returned: 'Returned', retired: 'Retired', lost_stolen: 'Lost/Stolen',
};

const TABS = [
  { id: 'status', label: 'Device Status Summary', icon: BarChart3 },
  { id: 'refresh', label: 'Refresh Report', icon: RefreshCw },
  { id: 'allocation', label: 'Allocation Report', icon: Users },
];

export default function Reports() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('status');

  useEffect(() => {
    base44.entities.Device.list('-created_date', 500).then(d => { setDevices(d); setLoading(false); });
  }, []);

  const statusCounts = Object.entries(
    devices.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count, label: STATUS_LABELS[status] || status, color: STATUS_COLORS[status] || P.teal }));

  const daysUntil = (date) => Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  const refreshDue = devices
    .filter(d => d.refresh_date && daysUntil(d.refresh_date) <= 90 && daysUntil(d.refresh_date) >= 0)
    .sort((a, b) => new Date(a.refresh_date) - new Date(b.refresh_date));

  const allocations = devices.filter(d => d.assigned_user && d.status === 'deployed');

  const exportCSV = (rows, filename) => {
    const keys = Object.keys(rows[0] || {});
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] || ''}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename;
    a.click();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: P.text }}>Device fleet analytics and reports</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-white rounded-xl shadow-sm p-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-1 justify-center transition-all"
              style={{ backgroundColor: tab === t.id ? P.navy : 'transparent', color: tab === t.id ? 'white' : P.text }}>
              <t.icon className="w-4 h-4" /><span>{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm" style={{ color: P.text }}>Loading data...</div>
        ) : (
          <>
            {/* Status Summary */}
            {tab === 'status' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statusCounts.map(s => (
                    <div key={s.status} className="bg-white rounded-xl p-5 shadow-sm">
                      <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.count}</div>
                      <div className="text-sm font-medium" style={{ color: P.navy }}>{s.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: P.text }}>{((s.count / devices.length) * 100).toFixed(1)}% of fleet</div>
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-6" style={{ color: P.navy }}>Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statusCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: P.text }} />
                        <YAxis tick={{ fontSize: 11, fill: P.text }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4,4,0,0]}>
                          {statusCounts.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-6" style={{ color: P.navy }}>Fleet Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={statusCounts} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({ label, percent }) => `${label} ${(percent*100).toFixed(0)}%`}>
                          {statusCounts.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 flex justify-end">
                  <button onClick={() => exportCSV(statusCounts.map(s=>({Status:s.label, Count:s.count, Percentage:`${((s.count/devices.length)*100).toFixed(1)}%`})), 'device-status-summary.csv')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center" style={{ backgroundColor: P.teal }}>
                    <Download className="w-4 h-4 mr-1.5" />Export CSV
                  </button>
                </div>
              </div>
            )}

            {/* Refresh Report */}
            {tab === 'refresh' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Due < 30 days', value: refreshDue.filter(d=>daysUntil(d.refresh_date)<30).length, color: '#EF4444' },
                    { label: 'Due 30–60 days', value: refreshDue.filter(d=>daysUntil(d.refresh_date)>=30&&daysUntil(d.refresh_date)<60).length, color: '#F59E0B' },
                    { label: 'Due 60–90 days', value: refreshDue.filter(d=>daysUntil(d.refresh_date)>=60).length, color: P.gold },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
                      <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-sm font-medium" style={{ color: P.navy }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
                    <h3 className="text-lg font-bold" style={{ color: P.navy }}>Devices Due for Refresh (Next 90 Days)</h3>
                    <button onClick={() => exportCSV(refreshDue.map(d=>({'Asset Tag':d.asset_tag, Model:d.model, User:d.assigned_user||'—', Department:d.department||'—', 'Refresh Date':d.refresh_date, 'Days Remaining':daysUntil(d.refresh_date)})), 'refresh-report.csv')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center" style={{ backgroundColor: P.teal }}>
                      <Download className="w-3.5 h-3.5 mr-1" />Export
                    </button>
                  </div>
                  {refreshDue.length === 0 ? (
                    <div className="p-12 text-center"><CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" /><p className="font-medium" style={{ color: P.navy }}>No devices due for refresh in the next 90 days</p></div>
                  ) : (
                    <table className="w-full">
                      <thead><tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                        {['Device', 'Assigned To', 'Location', 'Refresh Date', 'Days Left', 'Urgency'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {refreshDue.map((d, i) => {
                          const days = daysUntil(d.refresh_date);
                          const urgency = days < 30 ? { label: 'Critical', color: '#EF4444', bg: '#FEE2E2' } : days < 60 ? { label: 'High', color: '#F59E0B', bg: '#FEF3C7' } : { label: 'Medium', color: P.gold, bg: '#FEF9C3' };
                          return (
                            <tr key={d.id} style={{ borderBottom: i < refreshDue.length-1 ? `1px solid ${P.border}` : 'none' }}>
                              <td className="px-6 py-4"><div className="font-semibold text-sm" style={{ color: P.navy }}>{d.model}</div><div className="text-xs font-mono" style={{ color: P.text }}>{d.asset_tag}</div></td>
                              <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{d.assigned_user || '—'}</td>
                              <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{d.location || '—'}</td>
                              <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{new Date(d.refresh_date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-bold text-sm" style={{ color: urgency.color }}>{days} days</td>
                              <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: urgency.bg, color: urgency.color }}>{urgency.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Allocation Report */}
            {tab === 'allocation' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Deployed Devices', value: allocations.length, color: '#10B981' },
                    { label: 'Unique Users', value: new Set(allocations.map(d=>d.assigned_user)).size, color: P.teal },
                    { label: 'Departments', value: new Set(allocations.map(d=>d.department).filter(Boolean)).size, color: P.navy },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
                      <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-sm font-medium" style={{ color: P.navy }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
                    <h3 className="text-lg font-bold" style={{ color: P.navy }}>Device Allocation — All Assigned Devices</h3>
                    <button onClick={() => exportCSV(allocations.map(d=>({'Asset Tag':d.asset_tag, Model:d.model, Brand:d.brand||'—', 'Assigned User':d.assigned_user, Email:d.assigned_email||'—', Department:d.department||'—', Location:d.location||'—', 'Monthly Rate':d.monthly_rate||'—'})), 'allocation-report.csv')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center" style={{ backgroundColor: P.teal }}>
                      <Download className="w-3.5 h-3.5 mr-1" />Export
                    </button>
                  </div>
                  {allocations.length === 0 ? (
                    <div className="p-12 text-center"><Package className="w-10 h-10 mx-auto mb-3" style={{ color: P.border }} /><p className="font-medium" style={{ color: P.navy }}>No devices currently assigned</p></div>
                  ) : (
                    <table className="w-full">
                      <thead><tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                        {['Device', 'Assigned User', 'Email', 'Department', 'Location', 'Rate/mo'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {allocations.map((d, i) => (
                          <tr key={d.id} style={{ borderBottom: i < allocations.length-1 ? `1px solid ${P.border}` : 'none' }}>
                            <td className="px-6 py-4"><div className="font-semibold text-sm" style={{ color: P.navy }}>{d.model}</div><div className="text-xs font-mono" style={{ color: P.text }}>{d.asset_tag}</div></td>
                            <td className="px-6 py-4 font-medium text-sm" style={{ color: P.navy }}>{d.assigned_user}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{d.assigned_email || '—'}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{d.department || '—'}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{d.location || '—'}</td>
                            <td className="px-6 py-4 font-semibold text-sm" style={{ color: P.gold }}>{d.monthly_rate ? `₦${d.monthly_rate.toLocaleString()}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}