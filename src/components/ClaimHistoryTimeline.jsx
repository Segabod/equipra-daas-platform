import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', text: '#2E3440', border: '#E1E6EF', gold: '#D4AF37' };

const ACTION_ICON = {
  create:        { icon: Clock, color: '#0FA3B1' },
  status_change: { icon: Clock, color: '#2563EB' },
  approve:       { icon: CheckCircle, color: '#059669' },
  reject:        { icon: XCircle, color: '#DC2626' },
  update:        { icon: AlertCircle, color: '#D97706' },
};

export default function ClaimHistoryTimeline({ claimId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AuditLog.filter(
      { entity_type: 'InsuranceClaim', entity_id: claimId },
      '-created_date',
      50
    ).then(l => {
      setLogs(l);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [claimId]);

  if (loading) {
    return <div className="text-center py-8 text-sm" style={{ color: P.text }}>Loading history...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-sm" style={{ color: P.text }}>No history recorded yet</div>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log, i) => {
        const cfg = ACTION_ICON[log.action] || ACTION_ICON.update;
        const Icon = cfg.icon;
        const date = log.created_date ? new Date(log.created_date).toLocaleString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }) : 'Unknown';

        return (
          <div key={log.id} className="relative flex gap-4 pb-4" style={{ borderBottom: i < logs.length - 1 ? `1px solid ${P.border}` : 'none' }}>
            {/* Timeline dot */}
            <div className="flex flex-col items-center pt-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: cfg.color }}>
                <Icon className="w-4 h-4" />
              </div>
              {i < logs.length - 1 && <div className="w-0.5 h-12 mt-2" style={{ backgroundColor: P.border }} />}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm capitalize" style={{ color: P.navy }}>
                    {log.action === 'status_change' ? 'Status Updated' : log.action === 'create' ? 'Claim Created' : log.action === 'approve' ? 'Approved' : log.action === 'reject' ? 'Rejected' : 'Updated'}
                  </div>
                  <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: P.text }}>
                    <User className="w-3 h-3" /> {log.user_name || 'System'} • {date}
                  </div>
                </div>
              </div>

              {/* Log details */}
              {log.details && (
                <p className="text-sm mt-2 p-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: P.text }}>
                  {log.details}
                </p>
              )}

              {/* Old -> New values for status changes */}
              {log.action === 'status_change' && (log.old_value || log.new_value) && (
                <div className="text-xs mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#F3F4F6', color: P.text }}>
                    {log.old_value || '—'}
                  </span>
                  <span style={{ color: P.teal }}>→</span>
                  <span className="px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#F0FAFB', color: cfg.color }}>
                    {log.new_value || '—'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}