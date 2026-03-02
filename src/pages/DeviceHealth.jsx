import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Cpu, HardDrive, MemoryStick, Monitor, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const RAM_SCORE = { '8GB': 60, '16GB': 85, '32GB': 95, '64GB': 100 };
const STORAGE_SCORE = { '128GB SSD': 55, '256GB SSD': 75, '512GB SSD': 90, '1TB SSD': 100 };

function scoreColor(score) {
  if (score >= 85) return '#10B981';
  if (score >= 65) return '#F59E0B';
  return '#EF4444';
}

function HealthBar({ value, label }) {
  const color = scoreColor(value);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: P.text }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: P.border }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function DeviceHealthCard({ device }) {
  const ramScore = RAM_SCORE[device.ram] || 50;
  const storageScore = STORAGE_SCORE[device.storage] || 50;
  const condScore = device.condition_score || 70;
  const daysToRefresh = device.refresh_date ? Math.floor((new Date(device.refresh_date) - new Date()) / (1000*60*60*24)) : 365;
  const ageScore = Math.min(100, Math.max(0, (daysToRefresh / 365) * 100));
  const overall = Math.round((ramScore + storageScore + condScore + ageScore) / 4);

  const issues = [];
  if (ramScore < 65) issues.push('RAM may be insufficient');
  if (storageScore < 65) issues.push('Low storage capacity');
  if (condScore < 70) issues.push('Poor physical condition');
  if (daysToRefresh < 90) issues.push(`Refresh due in ${daysToRefresh} days`);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-bold" style={{ color: P.navy }}>{device.model}</div>
          <div className="text-xs font-mono mt-0.5" style={{ color: P.teal }}>{device.asset_tag}</div>
          <div className="text-xs mt-0.5" style={{ color: P.text }}>{device.assigned_user || 'Unassigned'} · {device.department || '—'}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black" style={{ color: scoreColor(overall) }}>{overall}</div>
          <div className="text-xs font-medium" style={{ color: P.text }}>Health</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <HealthBar value={ramScore} label={`RAM · ${device.ram || '—'}`} />
        <HealthBar value={storageScore} label={`Storage · ${device.storage || '—'}`} />
        <HealthBar value={condScore} label={`Physical Condition`} />
        <HealthBar value={Math.round(ageScore)} label={`Lifecycle (${daysToRefresh > 0 ? daysToRefresh + 'd left' : 'overdue'})`} />
      </div>

      <div className="mt-auto">
        {issues.length === 0 ? (
          <div className="flex items-center text-xs text-green-600">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />All health checks passed
          </div>
        ) : (
          <div className="space-y-1">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-center text-xs" style={{ color: '#F59E0B' }}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{issue}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specs */}
      <div className="mt-4 pt-4 grid grid-cols-2 gap-2 text-xs" style={{ borderTop: `1px solid ${P.border}` }}>
        {[['Processor', device.processor], ['OS', device.os], ['Brand', device.brand], ['Screen', device.screen_size]].map(([l,v]) => v ? (
          <div key={l}><span style={{ color: P.text }}>{l}:</span> <span className="font-medium" style={{ color: P.navy }}>{v}</span></div>
        ) : null)}
      </div>
    </div>
  );
}

export default function DeviceHealth() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { base44.entities.Device.list('-created_date', 200).then(d => { setDevices(d); setLoading(false); }); }, []);

  const getOverall = (d) => {
    const r = RAM_SCORE[d.ram] || 50;
    const s = STORAGE_SCORE[d.storage] || 50;
    const c = d.condition_score || 70;
    const days = d.refresh_date ? Math.floor((new Date(d.refresh_date) - new Date()) / (1000*60*60*24)) : 365;
    const a = Math.min(100, Math.max(0, (days / 365) * 100));
    return Math.round((r + s + c + a) / 4);
  };

  const filtered = devices
    .filter(d => {
      if (search) { const q = search.toLowerCase(); return (d.model||'').toLowerCase().includes(q) || (d.asset_tag||'').toLowerCase().includes(q) || (d.assigned_user||'').toLowerCase().includes(q); }
      return true;
    })
    .filter(d => {
      const score = getOverall(d);
      if (filter === 'critical') return score < 65;
      if (filter === 'warning') return score >= 65 && score < 85;
      if (filter === 'good') return score >= 85;
      return true;
    })
    .sort((a, b) => getOverall(a) - getOverall(b));

  const avgHealth = devices.length ? Math.round(devices.reduce((s, d) => s + getOverall(d), 0) / devices.length) : 0;
  const critical = devices.filter(d => getOverall(d) < 65).length;
  const warning = devices.filter(d => { const s = getOverall(d); return s >= 65 && s < 85; }).length;
  const good = devices.filter(d => getOverall(d) >= 85).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-bold flex items-center" style={{ color: P.navy }}>
            <Activity className="w-6 h-6 mr-2" style={{ color: P.teal }} />Device Health Monitor
          </h1>
          <p className="text-sm mt-0.5" style={{ color: P.text }}>RAM, storage, condition, and lifecycle scoring across your fleet</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Avg. Fleet Health', value: `${avgHealth}%`, color: scoreColor(avgHealth), sub: 'Overall score' },
            { label: 'Critical', value: critical, color: '#EF4444', sub: 'Score < 65' },
            { label: 'Warning', value: warning, color: '#F59E0B', sub: 'Score 65–84' },
            { label: 'Good', value: good, color: '#10B981', sub: 'Score ≥ 85' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter(i === 0 ? 'all' : i === 1 ? 'critical' : i === 2 ? 'warning' : 'good')}>
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              <div className="text-sm font-medium" style={{ color: P.navy }}>{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: P.text }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devices..." className="flex-1 min-w-48 px-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border }} />
          <div className="flex gap-2">
            {['all', 'critical', 'warning', 'good'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={{ backgroundColor: filter === f ? P.navy : P.bg, color: filter === f ? 'white' : P.text }}>
                {f === 'all' ? 'All Devices' : f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm" style={{ color: P.text }}>Loading health data...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm">
            <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: P.border }} />
            <p className="font-medium" style={{ color: P.navy }}>No devices match your filter</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(d => <DeviceHealthCard key={d.id} device={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}