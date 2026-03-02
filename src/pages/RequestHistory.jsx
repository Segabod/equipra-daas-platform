import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Filter, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Package, Eye, X } from 'lucide-react';
import { logAudit } from '../components/audit';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const REQUEST_TYPES = {
  new_hire: 'New Hire', expansion: 'Dept. Expansion', replacement: 'Replacement',
  upgrade: 'Upgrade', loaner: 'Loaner',
};
const DEVICE_CLASSES = { standard: 'Standard', developer: 'Developer', executive: 'Executive' };

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#6B7280', bg: '#F3F4F6' },
  pending_approval: { label: 'Pending Approval', color: '#D97706', bg: '#FEF3C7' },
  approved: { label: 'Approved', color: '#059669', bg: '#D1FAE5' },
  in_fulfillment: { label: 'In Fulfillment', color: '#2563EB', bg: '#DBEAFE' },
  delivered: { label: 'Delivered', color: '#059669', bg: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
};

export default function RequestHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_date');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const load = () => base44.entities.DeviceRequest.list('-created_date', 100).then(r => { setRequests(r); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleApprove = async (req, action) => {
    setApproving(req.id);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData = { status: newStatus };
    if (action === 'reject' && rejectReason.trim()) updateData.rejection_reason = rejectReason.trim();
    await base44.entities.DeviceRequest.update(req.id, updateData);
    await logAudit({ action: action === 'approve' ? 'approve' : 'reject', entityType: 'DeviceRequest', entityId: req.id, entityLabel: `REQ-${req.id?.slice(-4)?.toUpperCase()}`, details: `Request ${newStatus}${action === 'reject' && rejectReason ? `: ${rejectReason}` : ''}`, oldValue: req.status, newValue: newStatus });
    await base44.entities.Notification.create({
      user_email: req.created_by || 'admin',
      title: `Request ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: `Your device request (REQ-${req.id?.slice(-4)?.toUpperCase()}) has been ${newStatus} by ${req.approver || 'an approver'}.${action === 'reject' && rejectReason ? ` Reason: ${rejectReason}` : ''}`,
      type: 'request_status_change',
      link_page: 'RequestHistory',
    });
    await load();
    setSelected(null);
    setApproving(null);
    setRejectReason('');
    setShowRejectInput(false);
  };

  const filtered = requests
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .sort((a, b) => {
      let av = a[sortField] || '';
      let bv = b[sortField] || '';
      if (sortField === 'quantity') { av = Number(av); bv = Number(bv); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-1" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" style={{ color: P.teal }} /> : <ChevronDown className="w-3 h-3 inline ml-1" style={{ color: P.teal }} />;
  };

  const counts = Object.fromEntries(Object.keys(STATUS_CONFIG).map(s => [s, requests.filter(r=>r.status===s).length]));

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: P.navy }}>REQ-{selected.id?.slice(-4)?.toUpperCase()}</h2>
                <p className="text-sm" style={{ color: P.text }}>{new Date(selected.created_date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: P.text }} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ['Request Type', REQUEST_TYPES[selected.request_type] || selected.request_type],
                ['Device Class', DEVICE_CLASSES[selected.device_class] || selected.device_class],
                ['Quantity', selected.quantity],
                ['Delivery Location', selected.delivery_location],
                ['Department', selected.cost_center],
                ['Approver', selected.approver],
                ['Required Date', selected.required_date || '—'],
                ['Service Bundle', selected.service_bundle],
                ['Status', STATUS_CONFIG[selected.status]?.label || selected.status],
                ['Submitted By', selected.created_by || '—'],
                ['Notes', selected.notes || '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span style={{ color: P.text }}>{l}</span>
                  <span className="font-semibold text-right ml-4" style={{ color: P.navy }}>{v}</span>
                </div>
              ))}
              {selected.accessories?.length > 0 && (
                <div className="text-sm">
                  <span style={{ color: P.text }}>Accessories</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selected.accessories.map(a => <span key={a} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: P.bg, color: P.navy }}>{a}</span>)}
                  </div>
                </div>
              )}
            </div>
            {selected.status === 'pending_approval' && (
              <div className="p-6 flex gap-3" style={{ borderTop: `1px solid ${P.border}` }}>
                <button onClick={() => handleApprove(selected, 'approve')} disabled={approving === selected.id} className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#10B981' }}>
                  <CheckCircle className="w-4 h-4 inline mr-1.5" />Approve
                </button>
                <button onClick={() => handleApprove(selected, 'reject')} disabled={approving === selected.id} className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#EF4444' }}>
                  <XCircle className="w-4 h-4 inline mr-1.5" />Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Request History</h1>
          <p className="text-sm mt-0.5" style={{ color: P.text }}>{requests.length} total requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status summary */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className="bg-white rounded-xl p-3 shadow-sm text-center transition-all"
              style={{ borderWidth: 2, borderColor: statusFilter === key ? cfg.color : 'transparent' }}>
              <div className="text-xl font-bold" style={{ color: cfg.color }}>{counts[key] || 0}</div>
              <div className="text-xs mt-0.5" style={{ color: P.text }}>{cfg.label}</div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4" style={{ color: P.text }} />
          <span className="text-sm font-medium" style={{ color: P.navy }}>Filter by status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-sm" style={{ color: P.text }}>Showing {filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center" style={{ color: P.text }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="w-12 h-12 mx-auto mb-4" style={{ color: P.border }} />
              <p className="font-medium" style={{ color: P.navy }}>No requests found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                  {[
                    { label: 'Request', field: null },
                    { label: 'Date', field: 'created_date' },
                    { label: 'Type', field: 'request_type' },
                    { label: 'Qty', field: 'quantity' },
                    { label: 'Class', field: 'device_class' },
                    { label: 'Approver', field: 'approver' },
                    { label: 'Submitted By', field: 'created_by' },
                    { label: 'Status', field: 'status' },
                    { label: '', field: null },
                  ].map(({ label, field }) => (
                    <th key={label} onClick={() => field && handleSort(field)}
                      className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide ${field ? 'cursor-pointer hover:opacity-80' : ''}`}
                      style={{ color: P.text }}>
                      {label}{field && <SortIcon field={field} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.draft;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filtered.length-1 ? `1px solid ${P.border}` : 'none' }}>
                      <td className="px-6 py-4 font-mono font-bold text-xs" style={{ color: P.teal }}>REQ-{r.id?.slice(-4)?.toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{new Date(r.created_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{REQUEST_TYPES[r.request_type] || r.request_type}</td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: P.navy }}>{r.quantity}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{DEVICE_CLASSES[r.device_class] || r.device_class}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{r.approver || '—'}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{r.created_by || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelected(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: P.teal }}>
                          <Eye className="w-3.5 h-3.5 inline mr-1" />View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}