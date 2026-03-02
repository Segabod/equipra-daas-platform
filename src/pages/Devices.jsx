import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Monitor, Search, Package, CheckCircle, AlertCircle, RefreshCw, XCircle, Shield, Cpu, Eye, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

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

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => base44.entities.Device.list('-created_date', 200).then(d => { setDevices(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const getDaysUntilRefresh = (date) => {
    if (!date) return 999;
    return Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const filtered = devices.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (d.model||'').toLowerCase().includes(q) || (d.asset_tag||'').toLowerCase().includes(q) ||
             (d.assigned_user||'').toLowerCase().includes(q) || (d.serial||'').toLowerCase().includes(q) ||
             (d.brand||'').toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async (form) => {
    setSaving(true);
    const data = {
      ...form,
      monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : undefined,
      condition_score: form.condition_score ? Number(form.condition_score) : undefined,
    };
    if (editDevice) {
      await base44.entities.Device.update(editDevice.id, data);
    } else {
      await base44.entities.Device.create(data);
    }
    await load();
    setSaving(false);
    setShowForm(false);
    setEditDevice(null);
    setSelectedDevice(null);
  };

  const handleDelete = async (device) => {
    await base44.entities.Device.delete(device.id);
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
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Lease & Coverage</h3>
                <div className="space-y-4 text-sm">
                  {selectedDevice.lease_start && <div><div className="text-xs mb-1" style={{ color: P.text }}>Lease Start</div><div className="font-medium" style={{ color: P.navy }}>{new Date(selectedDevice.lease_start).toLocaleDateString()}</div></div>}
                  {selectedDevice.lease_end && <div><div className="text-xs mb-1" style={{ color: P.text }}>Lease End</div><div className="font-medium" style={{ color: P.navy }}>{new Date(selectedDevice.lease_end).toLocaleDateString()}</div></div>}
                  {selectedDevice.refresh_date && <div><div className="text-xs mb-1" style={{ color: P.text }}>Refresh Due</div><div className="font-medium" style={{ color: days < 90 ? '#F59E0B' : P.navy }}>{new Date(selectedDevice.refresh_date).toLocaleDateString()} ({days} days)</div></div>}
                  {selectedDevice.warranty && <div><div className="text-xs mb-1" style={{ color: P.text }}>Warranty</div><div className="font-medium text-green-600 flex items-center"><Shield className="w-3.5 h-3.5 mr-1" />{selectedDevice.warranty}</div></div>}
                  {selectedDevice.insurance && <div><div className="text-xs mb-1" style={{ color: P.text }}>Insurance</div><div className="font-medium" style={{ color: P.navy }}>{selectedDevice.insurance}</div></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      {showForm && <DeviceForm device={editDevice} onSave={handleSave} onCancel={() => { setShowForm(false); setEditDevice(null); }} saving={saving} />}
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
            <p className="text-sm mt-0.5" style={{ color: P.text }}>{filtered.length} of {devices.length} devices</p>
          </div>
          <button onClick={() => { setEditDevice(null); setShowForm(true); }} className="px-4 py-2 rounded-lg font-semibold text-white text-sm flex items-center" style={{ backgroundColor: P.teal }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Device
          </button>
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
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: P.text }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by model, asset tag, user, brand..." className="w-full pl-10 pr-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border }} />
          </div>
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
                  {['Device', 'Brand / Serial', 'User / Dept', 'Location', 'Status', 'Refresh', 'Condition', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.in_stock;
                  const days = getDaysUntilRefresh(d.refresh_date);
                  const cond = d.condition_score || 0;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filtered.length-1 ? `1px solid ${P.border}` : 'none' }}>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium" style={{ color: P.navy }}>{d.brand || '—'}</div>
                        <div className="text-xs font-mono" style={{ color: P.text }}>{d.serial || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium" style={{ color: P.navy }}>{d.assigned_user || '—'}</div>
                        <div className="text-xs" style={{ color: P.text }}>{d.department || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{d.location || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center" style={{ backgroundColor: s.bg, color: s.color }}>
                          {React.createElement(s.icon, { className: 'w-3 h-3 mr-1' })}{s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {d.refresh_date ? (
                          <><div className="text-sm" style={{ color: P.navy }}>{new Date(d.refresh_date).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>
                          <div className="text-xs" style={{ color: days < 90 ? '#F59E0B' : P.text }}>{days} days</div></>
                        ) : <span className="text-xs" style={{ color: P.text }}>—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-14 h-1.5 rounded-full" style={{ backgroundColor: P.border }}>
                            <div className="h-full rounded-full" style={{ width: `${cond}%`, backgroundColor: cond>=90?'#10B981':cond>=70?'#F59E0B':'#DC2626' }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: P.navy }}>{cond}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedDevice(d)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: P.teal }}>
                            <Eye className="w-3.5 h-3.5 inline mr-1" />View
                          </button>
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