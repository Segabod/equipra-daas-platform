import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wrench, Search, Clock, Check, ChevronRight, Plus, AlertCircle, CheckCircle, X, User } from 'lucide-react';
import { logAudit } from '../components/audit';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const ISSUE_TYPES = [
  { value: 'hardware_fault', label: 'Hardware Fault', emoji: '⚠️' },
  { value: 'screen_damage', label: 'Screen Damage', emoji: '💔' },
  { value: 'battery_issue', label: 'Battery Issue', emoji: '🔋' },
  { value: 'keyboard_issue', label: 'Keyboard Issue', emoji: '⌨️' },
  { value: 'liquid_spill', label: 'Liquid Spill', emoji: '💧' },
  { value: 'os_software', label: 'OS/Software', emoji: '💻' },
  { value: 'performance', label: 'Performance', emoji: '🐌' },
  { value: 'accessories', label: 'Accessories', emoji: '🖱️' },
  { value: 'lost_stolen', label: 'Lost/Stolen', emoji: '🚨' },
  { value: 'preventive', label: 'Preventive', emoji: '🔧' },
];

const SEVERITY = [
  { value: 'low', label: 'Low', color: '#10B981', sla: '72hrs', desc: 'Minor issue' },
  { value: 'medium', label: 'Medium', color: '#F59E0B', sla: '48hrs', desc: 'Productivity affected' },
  { value: 'high', label: 'High', color: '#EF4444', sla: '24hrs', desc: 'Significant impact' },
  { value: 'critical', label: 'Critical', color: '#DC2626', sla: '4hrs', desc: 'Unable to work' },
];

const PICKUP_LOCATIONS = ['Lagos HQ - Victoria Island', 'Abuja Office - Maitama', 'Port Harcourt Office', 'Ibadan Branch'];

export default function Tickets() {
  const [view, setView] = useState('list'); // 'list' | 'new'
  const [step, setStep] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [form, setForm] = useState({ issueType: '', severity: '', description: '', pickupLocation: '', pickupTime: '', needSwap: false });
  const [success, setSuccess] = useState(false);

  const IT_ADMINS = ['Chidi Nwosu - IT Manager', 'Adaeze Obi - IT Support', 'Emeka Eze - Systems Admin'];

  useEffect(() => {
    Promise.all([
      base44.entities.Ticket.list('-created_date', 50),
      base44.entities.Device.list('-created_date', 100),
    ]).then(([t, d]) => { setTickets(t); setDevices(d); setLoading(false); });
  }, []);

  const filteredDevices = devices.filter(d => {
    if (!deviceSearch) return true;
    const q = deviceSearch.toLowerCase();
    return (d.model||'').toLowerCase().includes(q) || (d.asset_tag||'').toLowerCase().includes(q) || (d.assigned_user||'').toLowerCase().includes(q);
  });

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.device_model||'').toLowerCase().includes(q) || (t.issue_type||'').toLowerCase().includes(q) || (t.device_asset_tag||'').toLowerCase().includes(q) || (t.assigned_user||'').toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    const severity = SEVERITY.find(s => s.value === form.severity);
    const ticket = await base44.entities.Ticket.create({
      device_asset_tag: selectedDevice.asset_tag,
      device_model: selectedDevice.model,
      assigned_user: selectedDevice.assigned_user,
      department: selectedDevice.department,
      issue_type: form.issueType,
      severity: form.severity,
      description: form.description,
      status: 'open',
      pickup_location: form.pickupLocation,
      pickup_time: form.pickupTime,
      need_swap: form.needSwap,
      sla_target: severity?.sla,
    });
    await logAudit({ action: 'create', entityType: 'Ticket', entityId: ticket?.id, entityLabel: selectedDevice.asset_tag, details: `Ticket created: ${ISSUE_TYPES.find(i=>i.value===form.issueType)?.label} on ${selectedDevice.model}` });
    const updated = await base44.entities.Ticket.list('-created_date', 50);
    setTickets(updated);
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => { setView('list'); setStep(1); setForm({ issueType:'', severity:'', description:'', pickupLocation:'', pickupTime:'', needSwap: false }); setSelectedDevice(null); setDeviceSearch(''); setSuccess(false); }, 2000);
  };

  const handleStatusChange = async (ticket, newStatus) => {
    await base44.entities.Ticket.update(ticket.id, { status: newStatus });
    await logAudit({ action: 'status_change', entityType: 'Ticket', entityId: ticket.id, entityLabel: ticket.device_asset_tag, details: `Ticket status changed`, oldValue: ticket.status, newValue: newStatus });
    const updated = await base44.entities.Ticket.list('-created_date', 50);
    setTickets(updated);
    if (detailTicket?.id === ticket.id) setDetailTicket({ ...detailTicket, status: newStatus });
  };

  const handleAssignTech = async (ticket, tech) => {
    await base44.entities.Ticket.update(ticket.id, { technician: tech, status: ticket.status === 'open' ? 'in_progress' : ticket.status });
    await logAudit({ action: 'update', entityType: 'Ticket', entityId: ticket.id, entityLabel: ticket.device_asset_tag, details: `Assigned to ${tech}` });
    const updated = await base44.entities.Ticket.list('-created_date', 50);
    setTickets(updated);
    if (detailTicket?.id === ticket.id) setDetailTicket({ ...detailTicket, technician: tech });
  };

  if (view === 'new') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.navy }}>
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: P.navy }}>Log Service Ticket</h1>
                <p className="text-xs" style={{ color: P.text }}>Fast track your repair request</p>
              </div>
            </div>
            <button onClick={() => { setView('list'); setStep(1); setSelectedDevice(null); }} className="text-sm font-medium" style={{ color: P.text }}>Cancel</button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Steps */}
          <div className="flex items-center justify-center mb-8">
            {['Select Device', 'Describe Issue', 'Pickup Details', 'Review'].map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: step > i+1 ? '#10B981' : step === i+1 ? P.teal : P.border, color: step >= i+1 ? 'white' : P.text }}>
                    {step > i+1 ? <Check className="w-4 h-4" /> : i+1}
                  </div>
                  <span className="text-xs mt-1.5 font-medium hidden sm:block" style={{ color: step >= i+1 ? P.navy : P.text }}>{label}</span>
                </div>
                {i < 3 && <div className="w-12 sm:w-20 h-0.5 mx-1 mb-5" style={{ backgroundColor: step > i+1 ? '#10B981' : P.border }} />}
              </React.Fragment>
            ))}
          </div>

          {success && (
            <div className="bg-white rounded-xl p-10 shadow-sm text-center mb-6">
              <CheckCircle className="w-14 h-14 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Ticket Submitted!</h2>
              <p style={{ color: P.text }}>You'll receive updates via email. Returning to ticket list...</p>
            </div>
          )}

          {!success && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* Step 1 */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Select Device</h2>
                  <p className="mb-6" style={{ color: P.text }}>Search by asset tag, model, or user name</p>
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: P.text }} />
                    <input value={deviceSearch} onChange={e=>setDeviceSearch(e.target.value)} placeholder="Search devices..." className="w-full pl-12 pr-4 py-4 border-2 rounded-xl text-base" style={{ borderColor: P.border }} autoFocus />
                  </div>
                  <div className="space-y-3">
                    {filteredDevices.length === 0 ? (
                      <div className="text-center py-12" style={{ color: P.text }}>No devices found. Try a different search.</div>
                    ) : filteredDevices.slice(0,8).map(d => (
                      <button key={d.id} onClick={() => { setSelectedDevice(d); setStep(2); }} className="w-full p-4 rounded-xl border-2 text-left hover:shadow-md transition-all" style={{ borderColor: P.border }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-mono font-bold" style={{ color: P.teal }}>{d.asset_tag}</div>
                            <div className="font-bold mt-0.5" style={{ color: P.navy }}>{d.model}</div>
                            <div className="text-sm mt-0.5" style={{ color: P.text }}>{d.assigned_user} · {d.department} · {d.location}</div>
                          </div>
                          <ChevronRight className="w-5 h-5" style={{ color: P.teal }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-6 p-4 rounded-xl" style={{ backgroundColor: P.bg }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: P.text }}>Selected Device</div>
                      <div className="font-bold" style={{ color: P.navy }}>{selectedDevice?.model}</div>
                      <div className="text-sm" style={{ color: P.text }}>{selectedDevice?.asset_tag} · {selectedDevice?.assigned_user}</div>
                    </div>
                    <button onClick={() => setStep(1)} className="text-sm font-medium" style={{ color: P.teal }}>Change</button>
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>What's the Issue?</h2>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-3" style={{ color: P.navy }}>Issue Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {ISSUE_TYPES.map(it => (
                        <button key={it.value} onClick={() => setForm({...form, issueType: it.value})} className="p-3 rounded-xl border-2 text-left transition-all" style={{ borderColor: form.issueType === it.value ? P.teal : P.border, backgroundColor: form.issueType === it.value ? '#F0FAFB' : 'white' }}>
                          <span className="text-xl mr-2">{it.emoji}</span>
                          <span className="font-medium text-sm" style={{ color: P.navy }}>{it.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-3" style={{ color: P.navy }}>Severity <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {SEVERITY.map(s => (
                        <button key={s.value} onClick={() => setForm({...form, severity: s.value})} className="p-4 rounded-xl border-2 text-left transition-all" style={{ borderColor: form.severity === s.value ? s.color : P.border, backgroundColor: form.severity === s.value ? `${s.color}10` : 'white' }}>
                          <div className="font-bold mb-0.5" style={{ color: s.color }}>{s.label}</div>
                          <div className="text-xs" style={{ color: P.text }}>{s.desc}</div>
                          <div className="text-xs font-medium mt-1" style={{ color: P.text }}>SLA: {s.sla}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Description <span className="text-red-500">*</span></label>
                    <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={4} placeholder="Describe the issue in detail..." className="w-full px-4 py-3 border-2 rounded-xl resize-none text-sm" style={{ borderColor: P.border }} />
                  </div>
                  <div className="flex justify-between pt-6" style={{ borderTop: `1px solid ${P.border}` }}>
                    <button onClick={()=>setStep(1)} className="px-6 py-3 rounded-xl font-medium" style={{ color: P.navy }}>Back</button>
                    <button onClick={()=>setStep(3)} disabled={!form.issueType||!form.severity||!form.description} className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>Continue</button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: P.navy }}>Pickup Details</h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Pickup Location <span className="text-red-500">*</span></label>
                      <select value={form.pickupLocation} onChange={e=>setForm({...form, pickupLocation:e.target.value})} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }}>
                        <option value="">Select location</option>
                        {PICKUP_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Preferred Pickup Time <span className="text-red-500">*</span></label>
                      <select value={form.pickupTime} onChange={e=>setForm({...form, pickupTime:e.target.value})} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }}>
                        <option value="">Select time window</option>
                        <option value="morning">Morning (9:00 AM – 12:00 PM)</option>
                        <option value="afternoon">Afternoon (12:00 PM – 3:00 PM)</option>
                        <option value="evening">Evening (3:00 PM – 6:00 PM)</option>
                        <option value="flexible">Flexible (Anytime)</option>
                      </select>
                    </div>
                    <label className="flex items-start p-4 rounded-xl cursor-pointer" style={{ backgroundColor: '#FFF4E6', border: '1px solid #F59E0B30' }}>
                      <input type="checkbox" checked={form.needSwap} onChange={e=>setForm({...form, needSwap:e.target.checked})} className="mt-0.5 mr-3" style={{ accentColor: P.teal }} />
                      <div>
                        <div className="font-semibold text-sm" style={{ color: P.navy }}>I need a swap device while mine is repaired</div>
                        <div className="text-xs mt-0.5" style={{ color: P.text }}>Available for Premium & Executive SLA tiers only.</div>
                      </div>
                    </label>
                  </div>
                  <div className="flex justify-between pt-6 mt-6" style={{ borderTop: `1px solid ${P.border}` }}>
                    <button onClick={()=>setStep(2)} className="px-6 py-3 rounded-xl font-medium" style={{ color: P.navy }}>Back</button>
                    <button onClick={()=>setStep(4)} disabled={!form.pickupLocation||!form.pickupTime} className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>Review</button>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: P.navy }}>Review & Submit</h2>
                  {[
                    { title: 'Device', items: [['Model', selectedDevice?.model], ['Asset Tag', selectedDevice?.asset_tag], ['User', selectedDevice?.assigned_user]] },
                    { title: 'Issue', items: [['Type', ISSUE_TYPES.find(i=>i.value===form.issueType)?.label], ['Severity', form.severity], ['Description', form.description]] },
                    { title: 'Pickup', items: [['Location', form.pickupLocation], ['Time', form.pickupTime], ['Swap Needed', form.needSwap ? 'Yes' : 'No']] },
                  ].map(section => (
                    <div key={section.title} className="mb-4 p-5 rounded-xl" style={{ backgroundColor: P.bg }}>
                      <h3 className="font-bold mb-3" style={{ color: P.navy }}>{section.title}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {section.items.map(([l, v]) => (
                          <div key={l}>
                            <div className="text-xs" style={{ color: P.text }}>{l}</div>
                            <div className="text-sm font-medium mt-0.5" style={{ color: P.navy }}>{v || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-6" style={{ borderTop: `1px solid ${P.border}` }}>
                    <button onClick={()=>setStep(3)} className="px-6 py-3 rounded-xl font-medium" style={{ color: P.navy }}>Back</button>
                    <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>
                      {submitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Service Tickets</h1>
            <p className="text-sm mt-0.5" style={{ color: P.text }}>{tickets.length} total tickets</p>
          </div>
          <button onClick={() => { setView('new'); setStep(1); }} className="px-4 py-2 rounded-lg font-semibold text-white text-sm flex items-center" style={{ backgroundColor: P.teal }}>
            <Plus className="w-4 h-4 mr-1.5" /> Log Ticket
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Detail Modal */}
        {detailTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: P.navy }}>TK-{detailTicket.id?.slice(-4)?.toUpperCase()}</h2>
                  <p className="text-sm" style={{ color: P.text }}>{detailTicket.device_model} · {detailTicket.device_asset_tag}</p>
                </div>
                <button onClick={() => setDetailTicket(null)}><X className="w-5 h-5" style={{ color: P.text }} /></button>
              </div>
              <div className="p-5 space-y-4">
                {[['Issue Type', ISSUE_TYPES.find(i=>i.value===detailTicket.issue_type)?.label], ['Severity', detailTicket.severity], ['Status', (detailTicket.status||'open').replace('_',' ')], ['Assigned User', detailTicket.assigned_user||'—'], ['Department', detailTicket.department||'—'], ['SLA Target', detailTicket.sla_target||'—'], ['Pickup Location', detailTicket.pickup_location||'—'], ['Technician', detailTicket.technician||'Unassigned']].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-sm"><span style={{ color: P.text }}>{l}</span><span className="font-semibold" style={{ color: P.navy }}>{v}</span></div>
                ))}
                <div>
                  <div className="text-sm mb-1" style={{ color: P.text }}>Description</div>
                  <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: P.bg, color: P.navy }}>{detailTicket.description}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: P.navy }}>Assign to IT Admin</div>
                  <div className="flex flex-wrap gap-2">
                    {IT_ADMINS.map(tech => (
                      <button key={tech} onClick={() => handleAssignTech(detailTicket, tech)} className="px-3 py-1.5 rounded-lg text-xs font-medium border-2" style={{ borderColor: detailTicket.technician === tech ? P.teal : P.border, backgroundColor: detailTicket.technician === tech ? '#F0FAFB' : 'white', color: P.navy }}>
                        <User className="w-3 h-3 inline mr-1" />{tech.split(' - ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: P.navy }}>Update Status</div>
                  <div className="flex flex-wrap gap-2">
                    {['open', 'in_progress', 'in_repair', 'resolved', 'closed'].map(st => (
                      <button key={st} onClick={() => handleStatusChange(detailTicket, st)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${detailTicket.status===st?'text-white':''}`} style={{ backgroundColor: detailTicket.status===st ? P.teal : P.bg, color: detailTicket.status===st ? 'white' : P.text }}>
                        {st.replace('_',' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: P.text }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets..." className="w-full pl-10 pr-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border }} />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
            <option value="all">All Status</option>
            {['open','in_progress','pickup_scheduled','in_repair','swap_delivered','resolved','closed'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center" style={{ color: P.text }}>Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-16 text-center">
              <Wrench className="w-12 h-12 mx-auto mb-4" style={{ color: P.border }} />
              <p className="font-medium" style={{ color: P.navy }}>No tickets yet</p>
              <button onClick={() => setView('new')} className="text-sm mt-2 font-medium" style={{ color: P.teal }}>Log your first ticket →</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                  {['Ticket', 'Device', 'Issue', 'Severity', 'Technician', 'Status', 'SLA', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t, i) => {
                  const sev = SEVERITY.find(s=>s.value===t.severity);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filteredTickets.length-1 ? `1px solid ${P.border}` : 'none' }}>
                      <td className="px-6 py-4 font-mono font-bold text-sm" style={{ color: P.teal }}>TK-{t.id?.slice(-4)?.toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm" style={{ color: P.navy }}>{t.device_model}</div>
                        <div className="text-xs" style={{ color: P.text }}>{t.device_asset_tag}</div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{ISSUE_TYPES.find(i=>i.value===t.issue_type)?.label || t.issue_type}</td>
                      <td className="px-6 py-4">
                        {sev && <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${sev.color}15`, color: sev.color }}>{sev.label}</span>}
                      </td>
                      <td className="px-6 py-4 text-xs" style={{ color: P.text }}>{t.technician ? t.technician.split(' - ')[0] : <span style={{ color: '#9CA3AF' }}>Unassigned</span>}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.status==='resolved'||t.status==='closed' ? 'bg-green-100 text-green-700' : t.status==='in_progress'||t.status==='in_repair' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {(t.status||'open').replace('_',' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.text }}>
                        <div className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{t.sla_target || sev?.sla || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setDetailTicket(t)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: P.teal }}>Manage</button>
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