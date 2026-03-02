import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, UserPlus, UserMinus, CheckCircle } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const DEPARTMENTS = ['Information Technology', 'Finance', 'Human Resources', 'Sales & Marketing', 'Operations', 'Engineering'];

export default function AssignDeviceModal({ device, mode, onClose, onDone }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: device?.department || '', location: device?.location || '' });

  const handleAssign = async () => {
    if (!form.name) return;
    setSaving(true);
    await base44.entities.Device.update(device.id, {
      status: 'deployed',
      assigned_user: form.name,
      assigned_email: form.email,
      department: form.department,
      location: form.location,
    });
    // Create notification
    await base44.entities.Notification.create({
      user_email: form.email || 'admin',
      title: 'Device Assigned',
      message: `${device.model} (${device.asset_tag}) has been assigned to ${form.name}.`,
      type: 'request_status_change',
    });
    setSaving(false);
    onDone();
  };

  const handleUnassign = async () => {
    setSaving(true);
    await base44.entities.Device.update(device.id, {
      status: 'in_stock',
      assigned_user: '',
      assigned_email: '',
    });
    setSaving(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
          <div className="flex items-center gap-3">
            {mode === 'assign' ? <UserPlus className="w-5 h-5" style={{ color: P.teal }} /> : <UserMinus className="w-5 h-5" style={{ color: '#EF4444' }} />}
            <h2 className="text-lg font-bold" style={{ color: P.navy }}>{mode === 'assign' ? 'Assign Device' : 'Unassign Device'}</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: P.text }} /></button>
        </div>

        <div className="p-6">
          <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: P.bg }}>
            <div className="font-semibold" style={{ color: P.navy }}>{device.model}</div>
            <div className="text-sm font-mono" style={{ color: P.teal }}>{device.asset_tag}</div>
          </div>

          {mode === 'assign' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>User Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="Full name" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Email</label>
                <input value={form.email} onChange={e => setForm(f=>({...f, email: e.target.value}))} placeholder="user@company.com" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Department</label>
                <select value={form.department} onChange={e => setForm(f=>({...f, department: e.target.value}))} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: P.navy }}>Location</label>
                <input value={form.location} onChange={e => setForm(f=>({...f, location: e.target.value}))} placeholder="Office location" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
              </div>
              <button onClick={handleAssign} disabled={!form.name || saving} className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center disabled:opacity-50" style={{ backgroundColor: P.teal }}>
                <CheckCircle className="w-4 h-4 mr-2" />{saving ? 'Assigning...' : 'Assign Device'}
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-6" style={{ color: P.text }}>
                This will unassign <strong>{device.assigned_user}</strong> from this device and return it to <strong>In Stock</strong> status.
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium border-2" style={{ borderColor: P.border, color: P.navy }}>Cancel</button>
                <button onClick={handleUnassign} disabled={saving} className="flex-1 py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: '#EF4444' }}>
                  {saving ? 'Unassigning...' : 'Unassign Device'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}