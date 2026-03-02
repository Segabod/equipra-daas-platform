import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Monitor, Search, Package, CheckCircle, AlertCircle, RefreshCw, XCircle, Cpu, Eye, Plus, Pencil, Trash2, X, Save, UserPlus, UserMinus, CheckSquare, Square } from 'lucide-react';
import AssignDeviceModal from '../components/AssignDeviceModal';
import LifecyclePanel from '../components/LifecyclePanel';
import DeviceHistoryTab from '../components/DeviceHistoryTab';
import { logAudit } from '../components/audit';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const STATUS_CONFIG = {
  deployed:       { label: 'Deployed',      color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  in_stock:       { label: 'In Stock',       color: '#6B7280', bg: '#F3F4F6', icon: Package },
  in_repair:      { label: 'In Repair',      color: '#F59E0B', bg: '#FEF3C7', icon: AlertCircle },
  awaiting_swap:  { label: 'Awaiting Swap',  color: '#F59E0B', bg: '#FEF3C7', icon: RefreshCw },
  returned:       { label: 'Returned',       color: '#6B7280', bg: '#F3F4F6', icon: Package },
  retired:        { label: 'Retired',        color: '#DC2626', bg: '#FEE2E2', icon: XCircle },
  lost_stolen:    { label: 'Lost/Stolen',    color: '#DC2626', bg: '#FEE2E2', icon: AlertCircle },
};

const EMPTY_FORM = {
  asset_tag: '', model: '', serial: '', brand: '', processor: '', ram: '', storage: '',
  screen_size: '', os: '', status: 'in_stock', device_class: 'standard',
  assigned_user: '', assigned_email: '', department: '', location: '',
  lease_start: '', lease_end: '', refresh_date: '', monthly_rate: '', condition_score: '',
  warranty: '', insurance: '',
};

const BRANDS = ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Asus', 'Acer'];
const DEPARTMENTS = ['Information Technology', 'Finance', 'Human Resources', 'Sales & Marketing', 'Operations', 'Engineering'];
const LOCATIONS = ['Lagos HQ - Victoria Island', 'Abuja Office - Maitama', 'Port Harcourt Office', 'Ibadan Branch'];

function DeviceForm({ device, onSave, onCancel, saving }) {
  const [form, setForm] = useState(device ? { ...EMPTY_FORM, ...device } : { ...EMPTY_FORM });
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const fields1 = [
    { f: 'asset_tag', l: 'Asset Tag *', type: 'text' },
    { f: 'model', l: 'Model *', type: 'text' },
    { f: 'serial', l: 'Serial Number', type: 'text' },
    { f: 'brand', l: 'Brand', type: 'select', opts: BRANDS },
    { f: 'status', l: 'Status *', type: 'select', opts: Object.entries(STATUS_CONFIG).map(([v,c])=>({value:v,label:c.label})) },
    { f: 'device_class', l: 'Device Class', type: 'select', opts: [{value:'standard',label:'Standard'},{value:'developer',label:'Developer'},{value:'executive',label:'Executive'}] },
    { f: 'processor', l: 'Processor', type: 'text' },
    { f: 'ram', l: 'RAM', type: 'select', opts: ['8GB','16GB','32GB','64GB'] },
    { f: 'storage', l: 'Storage', type: 'select', opts: ['128GB SSD','256GB SSD','512GB SSD','1TB SSD'] },
    { f: 'screen_size', l: 'Screen Size', type: 'select', opts: ['13"','14"','15"','16"'] },
    { f: 'os', l: 'OS', type: 'select', opts: ['Windows 11 Pro','macOS','Ubuntu','Chrome OS'] },
    { f: 'assigned_user', l: 'Assigned User', type: 'text' },
    { f: 'assigned_email', l: 'User Email', type: 'text' },
    { f: 'department', l: 'Department', type: 'select', opts: DEPARTMENTS },
    { f: 'location', l: 'Location', type: 'select', opts: LOCATIONS },
    { f: 'monthly_rate', l: 'Monthly Rate (₦)', type: 'number' },
    { f: 'condition_score', l: 'Condition Score (0-100)', type: 'number' },
    { f: 'lease_start', l: 'Lease Start', type: 'date' },
    { f: 'lease_end', l: 'Lease End', type: 'date' },
    { f: 'refresh_date', l: 'Refresh Date', type: 'date' },
    { f: 'warranty', l: 'Warranty Info', type: 'text' },
    { f: 'insurance', l: 'Insurance Info', type: 'text' },
  ];

  const isValid = form.asset_tag && form.model && form.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
          <h2 className="text-xl font-bold" style={{ color: P.navy }}>{device ? 'Edit Device' : 'Add New Device'}</h2>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" style={{ color: P.text }} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {fields1.map(({ f, l, type, opts }) => (
            <div key={f}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: P.navy }}>{l}</label>
              {type === 'select' ? (
                <select value={form[f]} onChange={e => update(f, e.target.value)} className="w-full px-3 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
                  <option value="">— Select —</option>
                  {opts.map(o => typeof o === 'string'
                    ? <option key={o} value={o}>{o}</option>
                    : <option key={o.value} value={o.value}>{o.label}</option>
                  )}
                </select>
              ) : (
                <input type={type} value={form[f]} onChange={e => update(f, e.target.value)} className="w-full px-3 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }} />
              )}
            </div>
          ))}
        </div>
        <div className="p-6 flex justify-end gap-3" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg font-medium text-sm" style={{ color: P.navy }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={!isValid || saving} className="px-6 py-2.5 rounded-lg font-semibold text-white text-sm flex items-center disabled:opacity-50" style={{ backgroundColor: P.teal }}>
            <Save className="w-4 h-4 mr-1.5" />{saving ? 'Saving...' : 'Save Device'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk action modal
function BulkActionModal({ selected, devices, onClose, onDone }) {
  const [action, setAction] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [assignName, setAssignName] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignDept, setAssignDept] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedDevices = devices.filter(d => selected.has(d.id));
  const hasInStock = selectedDevices.some(d => d.status === 'in_stock');
  const hasDeployed = selectedDevices.some(d => d.status === 'deployed');

  const handleApply = async () => {
    setSaving(true);
    for (const device of selectedDevices) {
      if (action === 'status' && newStatus) {
        await base44.entities.Device.update(device.id, { status: newStatus });
        await logAudit({ action: 'status_change', entityType: 'Device', entityId: device.id, entityLabel: device.asset_tag, details: `Bulk status change`, oldValue: device.status, newValue: newStatus });
      } else if (action === 'location' && newLocation) {
        await base44.entities.Device.update(device.id, { location: newLocation });
        await logAudit({ action: 'update', entityType: 'Device', entityId: device.id, entityLabel: device.asset_tag, details: `Bulk location update`, oldValue: device.location, newValue: newLocation });
      } else if (action === 'assign' && assignName) {
        await base44.entities.Device.update(device.id, { status: 'deployed', assigned_user: assignName, assigned_email: assignEmail, department: assignDept || device.department });
        await logAudit({ action: 'assign', entityType: 'Device', entityId: device.id, entityLabel: device.asset_tag, details: `Bulk assigned to ${assignName}` });
      } else if (action === 'unassign') {
        await base44.entities.Device.update(device.id, { status: 'in_stock', assigned_user: '', assigned_email: '' });
        await logAudit({ action: 'unassign', entityType: 'Device', entityId: device.id, entityLabel: device.asset_tag, details: `Bulk unassigned from ${device.assigned_user}` });
      }
    }
    setSaving(false);
    onDone();
  };

  const isValid = action === 'unassign' || (action === 'status' && newStatus) || (action === 'location' && newLocation) || (action === 'assign' && assignName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
          <h2 className="text-lg font-bold" style={{ color: P.navy }}>Bulk Action — {selected.size} devices</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: P.text }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Select Action</label>
            <div className="space-y-2">
              {[
                hasInStock && { value: 'assign', label: '👤 Assign to User (In Stock → Deployed)' },
                hasDeployed && { value: 'unassign', label: '↩ Unassign (Deployed → In Stock)' },
                { value: 'status', label: '🔄 Change Status' },
                { value: 'location', label: '📍 Update Location' },
              ].filter(Boolean).map(opt => (
                <button key={opt.value} onClick={() => setAction(opt.value)} className="w-full p-3 rounded-xl border-2 text-left text-sm font-medium"
                  style={{ borderColor: action === opt.value ? P.teal : P.border, backgroundColor: action === opt.value ? '#F0FAFB' : 'white', color: P.navy }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {action === 'status' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }}>
                <option value="">Select status</option>
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          )}

          {action === 'location' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>New Location</label>
              <select value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }}>
                <option value="">Select location</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          {action === 'assign' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>User Name *</label>
                <input value={assignName} onChange={e => setAssignName(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Email</label>
                <input value={assignEmail} onChange={e => setAssignEmail(e.target.value)} placeholder="user@company.com" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Department</label>
                <select value={assignDept} onChange={e => setAssignDept(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }}>
                  <option value="">Keep existing</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {action === 'unassign' && (
            <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              This will unassign {selected.size} device(s) and set their status to In Stock.
            </div>
          )}
        </div>
        <div className="p-6 flex gap-3" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium border-2" style={{ borderColor: P.border, color: P.navy }}>Cancel</button>
          <button onClick={handleApply} disabled={!action || !isValid || saving} className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>
            {saving ? 'Applying...' : `Apply to ${selected.size} devices`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [showBulk, setShowBulk] = useState(false);

  const load = () => base44.entities.Device.list('-created_date', 200).then(d => { setDevices(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const getDaysUntilRefresh = (date) => {
    if (!date) return 999;
    return Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const allDepts = ['all', ...new Set(devices.map(d => d.department).filter(Boolean))];

  const filtered = devices.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (deptFilter !== 'all' && d.department !== deptFilter) return false;
    if (userFilter && !(d.assigned_user || '').toLowerCase().includes(userFilter.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      return (d.model||'').toLowerCase().includes(q) || (d.asset_tag||'').toLowerCase().includes(q) ||
             (d.assigned_user||'').toLowerCase().includes(q) || (d.serial||'').toLowerCase().includes(q) ||
             (d.brand||'').toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(d => d.id)));
  };

  const handleSave = async (form) => {
    setSaving(true);
    const data = {
      ...form,
      monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : undefined,
      condition_score: form.condition_score ? Number(form.condition_score) : undefined,
    };
    if (editDevice) {
      await base44.entities.Device.update(editDevice.id, data);
      await logAudit({ action: 'update', entityType: 'Device', entityId: editDevice.id, entityLabel: editDevice.asset_tag, details: `Device updated` });
    } else {
      const created = await base44.entities.Device.create(data);
      await logAudit({ action: 'create', entityType: 'Device', entityLabel: data.asset_tag, details: `New device added: ${data.model}` });
    }
    await load();
    setSaving(false);
    setShowForm(false);
    setEditDevice(null);
    setSelectedDevice(null);
  };

  const handleDelete = async (device) => {
    await base44.entities.Device.delete(device.id);
    await logAudit({ action: 'delete', entityType: 'Device', entityId: device.id, entityLabel: device.asset_tag, details: `Device deleted: ${device.model}` });
    await load();
    setDeleteConfirm(null);
    setSelectedDevice(null);
  };

  if (selectedDevice) {
    const s = STATUS_CONFIG[selectedDevice.status] || STATUS_CONFIG.in_stock;
    const days = getDaysUntilRefresh(selectedDevice.refresh_date);
    return (
      <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
        {showForm && <DeviceForm device={selectedDevice} onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#EF4444' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: P.navy }}>Delete Device?</h3>
              <p className="text-sm mb-6" style={{ color: P.text }}>This will permanently delete <strong>{deleteConfirm.model}</strong> ({deleteConfirm.asset_tag}). This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg font-medium border-2" style={{ borderColor: P.border, color: P.navy }}>Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-lg font-semibold text-white" style={{ backgroundColor: '#EF4444' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSelectedDevice(null)} className="text-sm font-medium" style={{ color: P.teal }}>← Back to Inventory</button>
              <div className="w-px h-6" style={{ backgroundColor: P.border }} />
              <div>
                <h1 className="text-xl font-bold" style={{ color: P.navy }}>{selectedDevice.model}</h1>
                <p className="text-sm" style={{ color: P.text }}>{selectedDevice.asset_tag}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditDevice(selectedDevice); setShowForm(true); }} className="px-4 py-2 rounded-lg font-medium text-sm flex items-center border-2" style={{ borderColor: P.border, color: P.navy }}>
                <Pencil className="w-4 h-4 mr-1.5" />Edit
              </button>
              <button onClick={() => setDeleteConfirm(selectedDevice)} className="px-4 py-2 rounded-lg font-medium text-sm flex items-center text-white" style={{ backgroundColor: '#EF4444' }}>
                <Trash2 className="w-4 h-4 mr-1.5" />Delete
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{ color: P.navy }}>Device Overview</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold flex items-center" style={{ backgroundColor: s.bg, color: s.color }}>
                    {React.createElement(s.icon, { className: 'w-4 h-4 mr-1.5' })}{s.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {[['Asset Tag', selectedDevice.asset_tag], ['Serial Number', selectedDevice.serial], ['Brand', selectedDevice.brand], ['Monthly Rate', selectedDevice.monthly_rate ? `₦${(selectedDevice.monthly_rate||0).toLocaleString()}/mo` : '—'], ['Assigned User', selectedDevice.assigned_user||'—'], ['Department', selectedDevice.department||'—'], ['Location', selectedDevice.location||'—'], ['Condition', selectedDevice.condition_score ? `${selectedDevice.condition_score}%` : '—']].map(([label, val]) => (
                    <div key={label}><div className="text-xs font-medium mb-1" style={{ color: P.text }}>{label}</div><div className="font-semibold text-sm" style={{ color: P.navy }}>{val||'—'}</div></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[['Processor', selectedDevice.processor], ['RAM', selectedDevice.ram], ['Storage', selectedDevice.storage], ['Screen', selectedDevice.screen_size], ['OS', selectedDevice.os]].map(([l,v]) => v ? (
                    <div key={l} className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: P.bg }}>
                      <Cpu className="w-4 h-4" style={{ color: P.teal }} />
                      <div><div className="text-xs" style={{ color: P.text }}>{l}</div><div className="text-sm font-medium" style={{ color: P.navy }}>{v}</div></div>
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <LifecyclePanel device={selectedDevice} onRefresh={async () => {
                const updated = await base44.entities.Device.list('-created_date', 200);
                setDevices(updated);
                const refreshed = updated.find(d => d.id === selectedDevice.id);
                if (refreshed) setSelectedDevice(refreshed);
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      {showForm && <DeviceForm device={editDevice} onSave={handleSave} onCancel={() => { setShowForm(false); setEditDevice(null); }} saving={saving} />}
      {assignModal && <AssignDeviceModal device={assignModal.device} mode={assignModal.mode} onClose={() => setAssignModal(null)} onDone={async () => { setAssignModal(null); await load(); }} />}
      {showBulk && <BulkActionModal selected={selected} devices={devices} onClose={() => setShowBulk(false)} onDone={async () => { setShowBulk(false); setSelected(new Set()); await load(); }} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#EF4444' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: P.navy }}>Delete Device?</h3>
            <p className="text-sm mb-6" style={{ color: P.text }}>This will permanently delete <strong>{deleteConfirm.model}</strong>. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg font-medium border-2" style={{ borderColor: P.border, color: P.navy }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-lg font-semibold text-white" style={{ backgroundColor: '#EF4444' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Device Inventory</h1>
            <p className="text-sm mt-0.5" style={{ color: P.text }}>{filtered.length} of {devices.length} devices{selected.size > 0 && ` · ${selected.size} selected`}</p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button onClick={() => setShowBulk(true)} className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center border-2" style={{ borderColor: P.teal, color: P.teal }}>
                Bulk Action ({selected.size})
              </button>
            )}
            <button onClick={() => { setEditDevice(null); setShowForm(true); }} className="px-4 py-2 rounded-lg font-semibold text-white text-sm flex items-center" style={{ backgroundColor: P.teal }}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Device
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[{ label: 'Deployed', value: devices.filter(d=>d.status==='deployed').length, color: '#10B981' }, { label: 'In Stock', value: devices.filter(d=>d.status==='in_stock').length, color: '#6B7280' }, { label: 'In Repair', value: devices.filter(d=>d.status==='in_repair').length, color: '#F59E0B' }, { label: 'Due Refresh', value: devices.filter(d=>getDaysUntilRefresh(d.refresh_date)<90).length, color: P.gold }].map((s,i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm" style={{ color: P.text }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: P.text }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search model, asset tag, serial, brand..." className="w-full pl-10 pr-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border }} />
          </div>
          <input value={userFilter} onChange={e=>setUserFilter(e.target.value)} placeholder="Filter by user..." className="px-4 py-2 border-2 rounded-lg text-sm min-w-36" style={{ borderColor: P.border, color: P.navy }} />
          <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} className="px-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
            <option value="all">All Departments</option>
            {allDepts.filter(d=>d!=='all').map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center" style={{ color: P.text }}>Loading inventory...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Monitor className="w-12 h-12 mx-auto mb-4" style={{ color: P.border }} />
              <p className="font-medium" style={{ color: P.navy }}>No devices found</p>
              <button onClick={() => setShowForm(true)} className="text-sm mt-2 font-medium" style={{ color: P.teal }}>Add your first device →</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll}>
                      {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4" style={{ color: P.teal }} /> : <Square className="w-4 h-4" style={{ color: P.text }} />}
                    </button>
                  </th>
                  {['Device', 'Brand / Serial', 'User / Dept', 'Location', 'Status', 'Refresh', 'Condition', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.in_stock;
                  const days = getDaysUntilRefresh(d.refresh_date);
                  const cond = d.condition_score || 0;
                  const isSelected = selected.has(d.id);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filtered.length-1 ? `1px solid ${P.border}` : 'none', backgroundColor: isSelected ? '#F0FAFB' : undefined }}>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelect(d.id)}>
                          {isSelected ? <CheckSquare className="w-4 h-4" style={{ color: P.teal }} /> : <Square className="w-4 h-4" style={{ color: P.text }} />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.bg }}>
                            <Monitor className="w-4 h-4" style={{ color: P.teal }} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm" style={{ color: P.navy }}>{d.model}</div>
                            <div className="text-xs font-mono" style={{ color: P.text }}>{d.asset_tag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium" style={{ color: P.navy }}>{d.brand || '—'}</div>
                        <div className="text-xs font-mono" style={{ color: P.text }}>{d.serial || '—'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium" style={{ color: P.navy }}>{d.assigned_user || '—'}</div>
                        <div className="text-xs" style={{ color: P.text }}>{d.department || '—'}</div>
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: P.navy }}>{d.location || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center" style={{ backgroundColor: s.bg, color: s.color }}>
                          {React.createElement(s.icon, { className: 'w-3 h-3 mr-1' })}{s.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {d.refresh_date ? (
                          <><div className="text-sm" style={{ color: P.navy }}>{new Date(d.refresh_date).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>
                          <div className="text-xs" style={{ color: days < 90 ? '#F59E0B' : P.text }}>{days} days</div></>
                        ) : <span className="text-xs" style={{ color: P.text }}>—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-14 h-1.5 rounded-full" style={{ backgroundColor: P.border }}>
                            <div className="h-full rounded-full" style={{ width: `${cond}%`, backgroundColor: cond>=90?'#10B981':cond>=70?'#F59E0B':'#DC2626' }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: P.navy }}>{cond}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedDevice(d)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: P.teal }}>
                            <Eye className="w-3.5 h-3.5 inline mr-1" />View
                          </button>
                          {d.status === 'in_stock' && (
                            <button onClick={() => setAssignModal({ device: d, mode: 'assign' })} className="p-1.5 rounded-lg border-2 hover:bg-green-50" style={{ borderColor: '#BBF7D0' }} title="Assign">
                              <UserPlus className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                            </button>
                          )}
                          {d.status === 'deployed' && (
                            <button onClick={() => setAssignModal({ device: d, mode: 'unassign' })} className="p-1.5 rounded-lg border-2 hover:bg-orange-50" style={{ borderColor: '#FED7AA' }} title="Unassign">
                              <UserMinus className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                            </button>
                          )}
                          <button onClick={() => { setEditDevice(d); setShowForm(true); }} className="p-1.5 rounded-lg border-2 hover:bg-gray-50" style={{ borderColor: P.border }}>
                            <Pencil className="w-3.5 h-3.5" style={{ color: P.navy }} />
                          </button>
                          <button onClick={() => setDeleteConfirm(d)} className="p-1.5 rounded-lg border-2 hover:bg-red-50" style={{ borderColor: '#FECACA' }}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
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