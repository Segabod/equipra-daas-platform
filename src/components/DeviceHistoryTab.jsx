import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Wrench, RefreshCw, Clock, ClipboardList, Package } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const ACTION_CONFIG = {
  create:        { color: '#10B981', bg: '#D1FAE5', label: 'Added',          icon: Package },
  assign:        { color: '#7C3AED', bg: '#EDE9FE', label: 'Assigned',       icon: User },
  unassign:      { color: '#F59E0B', bg: '#FEF3C7', label: 'Unassigned',     icon: User },
  status_change: { color: '#0FA3B1', bg: '#CFFAFE', label: 'Status Changed', icon: RefreshCw },
  update:        { color: '#2563EB', bg: '#DBEAFE', label: 'Updated',        icon: ClipboardList },
  delete:        { color: '#EF4444', bg: '#FEE2E2', label: 'Deleted',        icon: ClipboardList },
  repair:        { color: '#F59E0B', bg: '#FEF3C7', label: 'Repaired',       icon: Wrench },
};

export default function DeviceHistoryTab({ device }) {
  const [logs, setLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    Promise.all([
      base44.entities.AuditLog.filter({ entity_type: 'Device', entity_id: device.id }, '-created_date', 100),
      base44.entities.Ticket.filter({ device_asset_tag: device.asset_tag }, '-created_date', 50),
    ]).then(([auditLogs, deviceTickets]) => {
      setLogs(auditLogs);
      setTickets(deviceTickets);
      setLoading(false);
    });
  }, [device.id, device.asset_tag]);

  // Combine audit logs + tickets into a unified timeline
  const timeline = [
    ...logs.map(l => ({ ...l, _type: 'audit', _date: new Date(l.created_date) })),
    ...tickets.map(t => ({ ...t, _type: 'ticket', _date: new Date(t.created_date) })),
  ].sort((a, b) => b._date - a._date);

  const filtered = tab === 'all' ? timeline
    : tab === 'assignments' ? timeline.filter(e => e._type === 'audit' && (e.action === 'assign' || e.action === 'unassign'))
    : tab === 'repairs' ? timeline.filter(e => e._type === 'ticket')
    : timeline.filter(e => e._type === 'audit' && e.action === 'status_change');

  const tabs = [
    { key: 'all', label: 'All Events' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'repairs', label: 'Repairs / Tickets' },
    { key: 'status', label: 'Status Changes' },
  ];

  if (loading) return <div className="py-12 text-center text-sm" style={{ color: P.text }}>Loading history...</div>;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ backgroundColor: P.bg }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
            style={{ backgroundColor: tab === t.key ? 'white' : 'transparent', color: tab === t.key ? P.navy : P.text, boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: P.border }} />
          <p className="text-sm" style={{ color: P.text }}>No events recorded yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ backgroundColor: P.border }} />
          <div className="space-y-4">
            {filtered.map((event, i) => {
              if (event._type === 'audit') {
                const ac = ACTION_CONFIG[event.action] || { color: P.teal, bg: `${P.teal}20`, label: event.action, icon: ClipboardList };
                const Icon = ac.icon;
                return (
                  <div key={`audit-${event.id}`} className="flex gap-4 relative">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10" style={{ backgroundColor: ac.bg, border: `2px solid white` }}>
                      <Icon className="w-4 h-4" style={{ color: ac.color }} />
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 shadow-sm" style={{ border: `1px solid ${P.border}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-xs font-bold mr-2" style={{ backgroundColor: ac.bg, color: ac.color }}>{ac.label}</span>
                          {event.details && <span className="text-sm" style={{ color: P.navy }}>{event.details}</span>}
                          {(event.old_value || event.new_value) && (
                            <p className="text-xs mt-1.5" style={{ color: P.text }}>
                              {event.old_value && <span className="line-through mr-1">{event.old_value}</span>}
                              {event.new_value && <span className="font-semibold" style={{ color: P.navy }}>→ {event.new_value}</span>}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 text-xs" style={{ color: P.text }}>
                          <div className="font-medium" style={{ color: P.navy }}>{event.user_name || event.user_email}</div>
                          <div className="flex items-center gap-1 mt-0.5 justify-end">
                            <Clock className="w-3 h-3" />
                            {event._date.toLocaleDateString()} {event._date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Ticket event
                const severityColors = { low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#7C2D12' };
                const statusColors = { open: '#F59E0B', in_progress: '#2563EB', resolved: '#10B981', closed: '#6B7280' };
                return (
                  <div key={`ticket-${event.id}`} className="flex gap-4 relative">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10" style={{ backgroundColor: '#FEF3C7', border: '2px solid white' }}>
                      <Wrench className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 shadow-sm" style={{ border: `1px solid ${P.border}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">Ticket</span>
                            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: P.bg, color: P.teal }}>{event.ticket_id || event.id?.slice(0,8)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${severityColors[event.severity]}20`, color: severityColors[event.severity] }}>{event.severity}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${statusColors[event.status] || '#6B7280'}20`, color: statusColors[event.status] || '#6B7280' }}>{event.status?.replace('_', ' ')}</span>
                          </div>
                          <p className="text-sm" style={{ color: P.navy }}>{event.issue_type?.replace('_', ' ')}</p>
                          {event.description && <p className="text-xs mt-1" style={{ color: P.text }}>{event.description.slice(0, 120)}{event.description.length > 120 ? '…' : ''}</p>}
                          {event.technician && <p className="text-xs mt-1 font-medium" style={{ color: P.teal }}>Technician: {event.technician}</p>}
                        </div>
                        <div className="text-right flex-shrink-0 text-xs" style={{ color: P.text }}>
                          <div className="flex items-center gap-1 mt-0.5 justify-end">
                            <Clock className="w-3 h-3" />
                            {event._date.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}