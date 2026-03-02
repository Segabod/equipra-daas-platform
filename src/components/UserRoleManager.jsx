import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Shield, ChevronDown, Search, CheckCircle } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const ROLES = [
  { value: 'admin', label: 'Super Admin', desc: 'Full platform access', color: '#7C3AED', pages: ['All pages'] },
  { value: 'it_admin', label: 'IT Admin', desc: 'Full device & ticket access', color: P.teal, pages: ['Devices', 'Requests', 'Reports', 'Tickets', 'DeviceHealth'] },
  { value: 'manager', label: 'Manager', desc: 'View team devices & approve requests', color: '#2563EB', pages: ['Dashboard', 'RequestHistory', 'Reports'] },
  { value: 'approver', label: 'Approver', desc: 'Approve or reject device requests', color: P.gold, pages: ['RequestHistory', 'Dashboard'] },
  { value: 'end_user', label: 'End User', desc: 'Submit requests & view own device', color: '#6B7280', pages: ['Requests', 'Tickets', 'Dashboard'] },
];

const DEPARTMENTS = ['Information Technology', 'Finance', 'Human Resources', 'Sales & Marketing', 'Operations', 'Engineering'];

export default function UserRoleManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('end_user');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    base44.entities.User.list().then(u => { setUsers(u); setLoading(false); });
  }, []);

  const handleRoleChange = async (u, newRole) => {
    setSaving(u.id);
    await base44.entities.User.update(u.id, { role: newRole });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    setSaving(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole === 'admin' ? 'admin' : 'user');
    setInviteSuccess(true);
    setInviteEmail('');
    setTimeout(() => setInviteSuccess(false), 3000);
    setInviting(false);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email||'').toLowerCase().includes(q) || (u.full_name||'').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Role Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${r.color}20` }}>
              <Shield className="w-4 h-4" style={{ color: r.color }} />
            </div>
            <div className="text-sm font-bold" style={{ color: P.navy }}>{r.label}</div>
            <div className="text-xs mt-0.5 mb-2" style={{ color: P.text }}>{r.desc}</div>
            <div className="text-xs font-bold" style={{ color: r.color }}>
              {users.filter(u => (u.role || 'end_user') === r.value).length} users
            </div>
          </div>
        ))}
      </div>

      {/* Invite User */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-bold mb-4" style={{ color: P.navy }}>Invite New User</h3>
        <div className="flex gap-3 flex-wrap">
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address"
            className="flex-1 min-w-48 px-4 py-2.5 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="px-4 py-2.5 border-2 rounded-xl text-sm" style={{ borderColor: P.border, color: P.navy }}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={handleInvite} disabled={!inviteEmail || inviting}
            className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ backgroundColor: P.teal }}>
            {inviting ? 'Inviting...' : inviteSuccess ? '✓ Invited!' : 'Send Invite'}
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
          <h3 className="font-bold" style={{ color: P.navy }}>All Users ({users.length})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: P.text }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              className="pl-9 pr-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border }} />
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center" style={{ color: P.text }}>Loading users...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                {['User', 'Email', 'Current Role', 'Permissions', 'Change Role'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const role = ROLES.find(r => r.value === (u.role || 'end_user')) || ROLES[4];
                return (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: role.color }}>
                          {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: P.navy }}>{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${role.color}20`, color: role.color }}>{role.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {role.pages.slice(0, 3).map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: P.bg, color: P.text }}>{p}</span>
                        ))}
                        {role.pages.length > 3 && <span className="text-xs" style={{ color: P.text }}>+{role.pages.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role || 'end_user'}
                        onChange={e => handleRoleChange(u, e.target.value)}
                        disabled={saving === u.id}
                        className="px-3 py-1.5 border-2 rounded-lg text-xs font-medium"
                        style={{ borderColor: P.border, color: P.navy }}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      {saving === u.id && <span className="ml-2 text-xs" style={{ color: P.teal }}>Saving...</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold mb-4" style={{ color: P.navy }}>Role Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                <th className="text-left py-2 pr-4 text-xs font-semibold uppercase" style={{ color: P.text }}>Page / Feature</th>
                {ROLES.map(r => <th key={r.value} className="text-center py-2 px-3 text-xs font-semibold" style={{ color: r.color }}>{r.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { page: 'Dashboard', access: [true, true, true, true, true] },
                { page: 'Device Inventory', access: [true, true, false, false, false] },
                { page: 'New Requests', access: [true, true, true, false, true] },
                { page: 'Request History', access: [true, true, true, true, true] },
                { page: 'Approve Requests', access: [true, true, false, true, false] },
                { page: 'Tickets', access: [true, true, true, false, true] },
                { page: 'Reports', access: [true, true, true, false, false] },
                { page: 'Device Health', access: [true, true, false, false, false] },
                { page: 'Admin Portal', access: [true, false, false, false, false] },
                { page: 'User Management', access: [true, false, false, false, false] },
              ].map((row, i) => (
                <tr key={row.page} style={{ borderBottom: `1px solid ${P.border}`, backgroundColor: i % 2 === 0 ? 'white' : P.bg }}>
                  <td className="py-2.5 pr-4 font-medium text-sm" style={{ color: P.navy }}>{row.page}</td>
                  {row.access.map((has, j) => (
                    <td key={j} className="text-center py-2.5 px-3">
                      {has ? <CheckCircle className="w-4 h-4 mx-auto text-green-500" /> : <span className="text-gray-300 text-lg">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}