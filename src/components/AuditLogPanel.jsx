import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardList, RefreshCw, User, Clock } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const ACTION_COLORS = {
  create: { color: '#10B981', bg: '#D1FAE5', label: 'Created' },
  update: { color: '#2563EB', bg: '#DBEAFE', label: 'Updated' },
  delete: { color: '#EF4444', bg: '#FEE2E2', label: 'Deleted' },
  approve: { color: '#10B981', bg: '#D1FAE5', label: 'Approved' },
  reject: { color: '#EF4444', bg: '#FEE2E2', label: 'Rejected' },
  assign: { color: '#7C3AED', bg: '#EDE9FE', label: 'Assigned' },
  unassign: { color: '#F59E0B', bg: '#FEF3C7', label: 'Unassigned' },
  status_change: { color: '#0FA3B1', bg: '#CFFAFE', label: 'Status Changed' },
  role_change: { color: '#7C3AED', bg: '#EDE9FE', label: 'Role Changed' },
};

export default function AuditLogPanel({ limit = 50 }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');

  const load = () => {
    setLoading(true);
    base44.entities.AuditLog.list('-created_date', limit).then(l => { setLogs(l); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const entityTypes = ['all', ...new Set(logs.map(l => l.entity_type).filter(Boolean))];
  const filtered = entityFilter === 'all' ? logs : logs.filter(l => l.entity_type === entityFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
            {entityTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'All Actions' : t}</option>)}
          </select>
          <span className="text-sm" style={{ color: P.text }}>{filtered.length} events</span>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" style={{ color: P.text }} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: P.text }}>Loading audit log...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: P.border }} />
          <p style={{ color: P.text }}>No audit events recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const ac = ACTION_COLORS[log.action] || { color: P.teal, bg: `${P.teal}20`, label: log.action };
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: P.bg }}>
                <span className="px-2 py-0.5 rounded text-xs font-bold mt-0.5 whitespace-nowrap" style={{ backgroundColor: ac.bg, color: ac.color }}>
                  {ac.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: P.navy }}>{log.entity_type}</span>
                    {log.entity_label && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'white', color: P.teal }}>{log.entity_label}</span>}
                  </div>
                  {log.details && <p className="text-xs mt-0.5" style={{ color: P.text }}>{log.details}</p>}
                  {(log.old_value || log.new_value) && (
                    <p className="text-xs mt-0.5" style={{ color: P.text }}>
                      {log.old_value && <span className="line-through mr-1">{log.old_value}</span>}
                      {log.new_value && <span className="font-medium" style={{ color: P.navy }}>→ {log.new_value}</span>}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-medium flex items-center gap-1" style={{ color: P.navy }}>
                    <User className="w-3 h-3" />{log.user_name || log.user_email}
                  </div>
                  <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: P.text }}>
                    <Clock className="w-3 h-3" />{new Date(log.created_date).toLocaleDateString()} {new Date(log.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}