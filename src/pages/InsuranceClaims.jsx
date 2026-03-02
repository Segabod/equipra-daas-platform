import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Plus, Search, FileText, X, Check, CheckCircle, AlertCircle, Clock, Eye, ChevronRight, Upload, Paperclip, Trash2, Loader2 } from 'lucide-react';
import { logAudit } from '../components/audit';
import ClaimHistoryTimeline from '../components/ClaimHistoryTimeline';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const INCIDENT_TYPES = [
  { value: 'accidental_damage', label: 'Accidental Damage', emoji: '💥' },
  { value: 'liquid_damage', label: 'Liquid Damage', emoji: '💧' },
  { value: 'theft', label: 'Theft', emoji: '🚨' },
  { value: 'loss', label: 'Loss', emoji: '❓' },
  { value: 'fire', label: 'Fire Damage', emoji: '🔥' },
  { value: 'power_surge', label: 'Power Surge', emoji: '⚡' },
  { value: 'screen_crack', label: 'Screen Crack', emoji: '📱' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

const STATUS_CONFIG = {
  draft:                    { label: 'Draft',                   color: '#6B7280', bg: '#F3F4F6' },
  submitted:                { label: 'Submitted',               color: '#2563EB', bg: '#DBEAFE' },
  under_review:             { label: 'Under Review',            color: '#D97706', bg: '#FEF3C7' },
  pending_manager_approval: { label: 'Pending Mgr Approval',   color: '#7C3AED', bg: '#EDE9FE' },
  approved:                 { label: 'Approved',                color: '#059669', bg: '#D1FAE5' },
  rejected:                 { label: 'Rejected',                color: '#DC2626', bg: '#FEE2E2' },
  paid:                     { label: 'Paid',                    color: '#059669', bg: '#D1FAE5' },
  withdrawn:                { label: 'Withdrawn',               color: '#6B7280', bg: '#F3F4F6' },
};

const MANAGER_THRESHOLD = 500000; // ₦500,000

// Required documents per incident type
const REQUIRED_DOCS = {
  theft:            ['Police Report (signed & stamped)', 'Proof of Ownership / Purchase Receipt'],
  loss:             ['Police Report (signed & stamped)', 'Proof of Ownership / Purchase Receipt'],
  accidental_damage:['Photos of Damage (min. 2 images)', 'Proof of Ownership / Purchase Receipt'],
  liquid_damage:    ['Photos of Damage (min. 2 images)', 'Proof of Ownership / Purchase Receipt'],
  screen_crack:     ['Photos of Damage (min. 2 images)'],
  fire:             ['Fire / Incident Report', 'Photos of Damage'],
  power_surge:      ['Photos of Damage', 'Technician Assessment Report'],
  other:            ['Supporting Evidence / Documentation'],
};

const ALL_ALWAYS = ['Device Assignment Confirmation']; // always required

export default function InsuranceClaims() {
  const [view, setView] = useState('list'); // 'list' | 'new'
  const [step, setStep] = useState(1);
  const [claims, setClaims] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detailClaim, setDetailClaim] = useState(null);
  const [success, setSuccess] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]); // [{label, file, url, uploading}]
  const fileInputRef = useRef(null);
  const [activeUploadLabel, setActiveUploadLabel] = useState(null);
  const [detailTab, setDetailTab] = useState('details'); // 'details' | 'history'

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  const [form, setForm] = useState({
    incidentType: '', incidentDate: '', incidentLocation: '', incidentDescription: '',
    policeReport: '', estimatedValue: '', needsPoliceReport: false,
  });

  const requiredDocLabels = form.incidentType
    ? [...ALL_ALWAYS, ...(REQUIRED_DOCS[form.incidentType] || [])]
    : [...ALL_ALWAYS];

  const uploadedLabels = uploadedDocs.map(d => d.label);
  const allDocsUploaded = requiredDocLabels.every(l => uploadedLabels.includes(l));

  const handleFileUpload = async (label, file) => {
    setUploadedDocs(prev => [...prev.filter(d => d.label !== label), { label, file: file.name, url: null, uploading: true }]);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedDocs(prev => prev.map(d => d.label === label ? { ...d, url: file_url, uploading: false } : d));
  };

  const handleRemoveDoc = (label) => {
    setUploadedDocs(prev => prev.filter(d => d.label !== label));
  };

  useEffect(() => {
    Promise.all([
      base44.entities.InsuranceClaim.list('-created_date', 100),
      base44.entities.Device.list('-created_date', 200),
    ]).then(([c, d]) => { setClaims(c); setDevices(d); setLoading(false); });
  }, []);

  const filteredDevices = devices.filter(d => {
    if (!deviceSearch) return true;
    const q = deviceSearch.toLowerCase();
    return (d.model || '').toLowerCase().includes(q) || (d.asset_tag || '').toLowerCase().includes(q) || (d.assigned_user || '').toLowerCase().includes(q);
  });

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.device_model || '').toLowerCase().includes(q) || (c.device_asset_tag || '').toLowerCase().includes(q) || (c.claim_number || '').toLowerCase().includes(q) || (c.assigned_user || '').toLowerCase().includes(q);
  });

  const handleSubmitClaim = async () => {
    setSubmitting(true);
    const claimNum = `CLM-${Date.now().toString().slice(-6)}`;
    const claim = await base44.entities.InsuranceClaim.create({
      claim_number: claimNum,
      device_asset_tag: selectedDevice.asset_tag,
      device_model: selectedDevice.model,
      assigned_user: selectedDevice.assigned_user,
      department: selectedDevice.department,
      incident_type: form.incidentType,
      incident_date: form.incidentDate,
      incident_location: form.incidentLocation,
      incident_description: form.incidentDescription,
      police_report_number: form.policeReport || undefined,
      estimated_value: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      status: 'submitted',
      requires_manager_approval: form.estimatedValue ? Number(form.estimatedValue) >= MANAGER_THRESHOLD : false,
      supporting_docs: uploadedDocs.filter(d => d.url).map(d => `${d.label}: ${d.url}`).join('\n'),
    });
    await logAudit({ action: 'create', entityType: 'InsuranceClaim', entityId: claim?.id, entityLabel: claimNum, details: `Insurance claim submitted for ${selectedDevice.model} (${selectedDevice.asset_tag})` });
    sendClaimNotification({ ...claim, claim_number: claimNum, device_model: selectedDevice.model, device_asset_tag: selectedDevice.asset_tag, assigned_user: selectedDevice.assigned_user, assigned_email: selectedDevice.assigned_email }, 'submitted');
    const updated = await base44.entities.InsuranceClaim.list('-created_date', 100);
    setClaims(updated);
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => {
      setView('list'); setStep(1); setSelectedDevice(null); setDeviceSearch('');
      setForm({ incidentType: '', incidentDate: '', incidentLocation: '', incidentDescription: '', policeReport: '', estimatedValue: '', needsPoliceReport: false });
      setUploadedDocs([]);
      setSuccess(false);
    }, 2500);
  };

  const sendClaimNotification = (claim, newStatus, extra = {}) => {
    base44.functions.invoke('claimNotification', {
      claimId: claim.id,
      claimNumber: claim.claim_number,
      newStatus,
      deviceModel: claim.device_model,
      deviceAssetTag: claim.device_asset_tag,
      assignedUser: claim.assigned_user,
      assignedEmail: claim.assigned_email || claim.assigned_user,
      rejectionReason: extra.rejection_reason || claim.rejection_reason || '',
    }).catch(() => {});
  };

  const handleStatusUpdate = async (claim, newStatus, extra = {}) => {
    // If trying to approve a high-value claim without manager approval, route to manager approval instead
    if (newStatus === 'approved' && claim.requires_manager_approval && !claim.manager_approved) {
      newStatus = 'pending_manager_approval';
    }
    await base44.entities.InsuranceClaim.update(claim.id, { status: newStatus, ...extra });
    await logAudit({ action: 'status_change', entityType: 'InsuranceClaim', entityId: claim.id, entityLabel: claim.claim_number, details: `Claim status updated to ${newStatus}`, oldValue: claim.status, newValue: newStatus });
    sendClaimNotification(claim, newStatus, extra);
    const updated = await base44.entities.InsuranceClaim.list('-created_date', 100);
    setClaims(updated);
    const freshClaim = updated.find(c => c.id === claim.id) || { ...detailClaim, status: newStatus, ...extra };
    setDetailClaim(freshClaim);
  };

  const handleManagerApproval = async (claim, approved) => {
    const newStatus = approved ? 'approved' : 'rejected';
    const updates = {
      manager_approved: approved,
      manager_approved_by: user?.full_name || user?.email || 'Manager',
      manager_approval_notes: managerNotes,
      manager_approval_date: new Date().toISOString().split('T')[0],
      status: newStatus,
      ...((!approved && rejectionReason) ? { rejection_reason: rejectionReason } : {}),
    };
    await base44.entities.InsuranceClaim.update(claim.id, updates);
    await logAudit({ action: approved ? 'approve' : 'reject', entityType: 'InsuranceClaim', entityId: claim.id, entityLabel: claim.claim_number, details: `Manager ${approved ? 'approved' : 'rejected'} high-value claim${managerNotes ? `: ${managerNotes}` : ''}` });
    sendClaimNotification(claim, newStatus, { rejection_reason: rejectionReason });
    const updated = await base44.entities.InsuranceClaim.list('-created_date', 100);
    setClaims(updated);
    const freshClaim = updated.find(c => c.id === claim.id);
    setDetailClaim(freshClaim);
    setManagerNotes('');
    setRejectionReason('');
    setShowRejectInput(false);
  };

  const requiresPoliceReport = ['theft', 'loss'].includes(form.incidentType);

  // ── NEW CLAIM FLOW ──
  if (view === 'new') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.navy }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: P.navy }}>File Insurance Claim</h1>
                <p className="text-xs" style={{ color: P.text }}>Submit a device insurance claim</p>
              </div>
            </div>
            <button onClick={() => { setView('list'); setStep(1); setSelectedDevice(null); }} className="text-sm font-medium" style={{ color: P.text }}>Cancel</button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Steps */}
          <div className="flex items-center justify-center mb-8">
            {['Select Device', 'Incident Details', 'Supporting Info', 'Review'].map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: step > i + 1 ? '#10B981' : step === i + 1 ? P.teal : P.border, color: step >= i + 1 ? 'white' : P.text }}>
                    {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs mt-1.5 font-medium hidden sm:block" style={{ color: step >= i + 1 ? P.navy : P.text }}>{label}</span>
                </div>
                {i < 3 && <div className="w-12 sm:w-20 h-0.5 mx-1 mb-5" style={{ backgroundColor: step > i + 1 ? '#10B981' : P.border }} />}
              </React.Fragment>
            ))}
          </div>

          {success && (
            <div className="bg-white rounded-xl p-10 shadow-sm text-center">
              <CheckCircle className="w-14 h-14 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Claim Submitted!</h2>
              <p style={{ color: P.text }}>Your insurance claim has been filed. Our team will review it shortly.</p>
            </div>
          )}

          {!success && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* Step 1: Select Device */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Select Device</h2>
                  <p className="mb-6" style={{ color: P.text }}>Which device is this claim for?</p>
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: P.text }} />
                    <input value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} placeholder="Search by asset tag, model, or user..." className="w-full pl-12 pr-4 py-4 border-2 rounded-xl text-base" style={{ borderColor: P.border }} autoFocus />
                  </div>
                  <div className="space-y-3">
                    {filteredDevices.length === 0 ? (
                      <div className="text-center py-12" style={{ color: P.text }}>No devices found.</div>
                    ) : filteredDevices.slice(0, 8).map(d => (
                      <button key={d.id} onClick={() => { setSelectedDevice(d); setStep(2); }} className="w-full p-4 rounded-xl border-2 text-left hover:shadow-md transition-all" style={{ borderColor: P.border }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-mono font-bold" style={{ color: P.teal }}>{d.asset_tag}</div>
                            <div className="font-bold mt-0.5" style={{ color: P.navy }}>{d.model}</div>
                            <div className="text-sm mt-0.5" style={{ color: P.text }}>{d.assigned_user || 'Unassigned'} · {d.department || '—'} · {d.location || '—'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            {d.insurance && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Insured</span>}
                            <ChevronRight className="w-5 h-5" style={{ color: P.teal }} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Incident Details */}
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
                  <h2 className="text-2xl font-bold mb-6" style={{ color: P.navy }}>Incident Details</h2>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-3" style={{ color: P.navy }}>Incident Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {INCIDENT_TYPES.map(it => (
                        <button key={it.value} onClick={() => setForm({ ...form, incidentType: it.value })} className="p-3 rounded-xl border-2 text-left transition-all"
                          style={{ borderColor: form.incidentType === it.value ? P.teal : P.border, backgroundColor: form.incidentType === it.value ? '#F0FAFB' : 'white' }}>
                          <span className="text-xl mr-2">{it.emoji}</span>
                          <span className="font-medium text-sm" style={{ color: P.navy }}>{it.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Date of Incident <span className="text-red-500">*</span></label>
                      <input type="date" value={form.incidentDate} onChange={e => setForm({ ...form, incidentDate: e.target.value })} className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} max={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Location of Incident</label>
                      <input type="text" value={form.incidentLocation} onChange={e => setForm({ ...form, incidentLocation: e.target.value })} placeholder="e.g. Office, home, transit..." className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Description of Incident <span className="text-red-500">*</span></label>
                    <textarea value={form.incidentDescription} onChange={e => setForm({ ...form, incidentDescription: e.target.value })} rows={4} placeholder="Describe what happened in detail..." className="w-full px-4 py-3 border-2 rounded-xl resize-none text-sm" style={{ borderColor: P.border }} />
                  </div>
                  <div className="flex justify-between pt-6" style={{ borderTop: `1px solid ${P.border}` }}>
                    <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-medium" style={{ color: P.navy }}>Back</button>
                    <button onClick={() => setStep(3)} disabled={!form.incidentType || !form.incidentDate || !form.incidentDescription}
                      className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>Continue</button>
                  </div>
                </div>
              )}

              {/* Step 3: Supporting Info */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: P.navy }}>Supporting Documents</h2>
                  <p className="mb-6 text-sm" style={{ color: P.text }}>Upload all required documents to proceed. These are mandatory for claim processing.</p>

                  {/* Estimated Value */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Estimated Device Value (₦)</label>
                    <input type="number" value={form.estimatedValue} onChange={e => setForm({ ...form, estimatedValue: e.target.value })} placeholder="e.g. 850000" className="w-full px-4 py-3 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
                    <p className="text-xs mt-1" style={{ color: P.text }}>Approximate current replacement value of the device</p>
                  </div>

                  {/* Police Report field for theft/loss */}
                  {requiresPoliceReport && (
                    <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B40' }}>
                      <div className="flex items-start gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} />
                        <div>
                          <div className="font-semibold text-sm" style={{ color: P.navy }}>Police Report Reference Required</div>
                          <p className="text-xs mt-0.5" style={{ color: P.text }}>Theft and loss claims require a police report number.</p>
                        </div>
                      </div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Police Report Number <span className="text-red-500">*</span></label>
                      <input type="text" value={form.policeReport} onChange={e => setForm({ ...form, policeReport: e.target.value })} placeholder="e.g. LPS/2026/001234" className="w-full px-4 py-3 border-2 rounded-xl text-sm bg-white" style={{ borderColor: P.border }} />
                    </div>
                  )}

                  {/* Required Documents Upload */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold" style={{ color: P.navy }}>Required Documents</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: allDocsUploaded ? '#D1FAE5' : '#FEE2E2', color: allDocsUploaded ? '#059669' : '#DC2626' }}>
                        {uploadedDocs.filter(d => d.url && requiredDocLabels.includes(d.label)).length} / {requiredDocLabels.length} uploaded
                      </span>
                    </div>

                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={e => { if (e.target.files[0] && activeUploadLabel) { handleFileUpload(activeUploadLabel, e.target.files[0]); e.target.value = ''; } }} />

                    {requiredDocLabels.map(label => {
                      const doc = uploadedDocs.find(d => d.label === label);
                      const uploaded = doc?.url;
                      const uploading = doc?.uploading;
                      return (
                        <div key={label} className="flex items-center gap-3 p-3 rounded-xl border-2" style={{ borderColor: uploaded ? '#10B981' : '#E5E7EB', backgroundColor: uploaded ? '#F0FDF4' : 'white' }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {uploaded ? <Check className="w-4 h-4 flex-shrink-0 text-green-500" /> : <Paperclip className="w-4 h-4 flex-shrink-0" style={{ color: P.text }} />}
                              <span className="text-sm font-medium truncate" style={{ color: uploaded ? '#065F46' : P.navy }}>{label}</span>
                              <span className="text-xs text-red-500 flex-shrink-0">*</span>
                            </div>
                            {doc && !uploading && <p className="text-xs mt-0.5 ml-6 truncate" style={{ color: '#6B7280' }}>{doc.file}</p>}
                          </div>
                          {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: P.teal }} />
                          ) : uploaded ? (
                            <button onClick={() => handleRemoveDoc(label)} className="p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0">
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          ) : (
                            <button onClick={() => { setActiveUploadLabel(label); fileInputRef.current?.click(); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                              style={{ backgroundColor: P.teal }}>
                              <Upload className="w-3.5 h-3.5" /> Upload
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!allDocsUploaded && (
                    <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ backgroundColor: '#FEF3C7' }}>
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} />
                      <p className="text-xs" style={{ color: '#92400E' }}>All documents marked with * are mandatory. Please upload them before proceeding.</p>
                    </div>
                  )}

                  <div className="flex justify-between pt-4" style={{ borderTop: `1px solid ${P.border}` }}>
                    <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl font-medium" style={{ color: P.navy }}>Back</button>
                    <button onClick={() => setStep(4)} disabled={(requiresPoliceReport && !form.policeReport) || !allDocsUploaded}
                      className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>Review Claim</button>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: P.navy }}>Review & Submit</h2>
                  {[
                    {
                      title: 'Device', items: [
                        ['Model', selectedDevice?.model],
                        ['Asset Tag', selectedDevice?.asset_tag],
                        ['Assigned User', selectedDevice?.assigned_user || '—'],
                        ['Insurance', selectedDevice?.insurance || 'See device record'],
                      ]
                    },
                    {
                      title: 'Incident', items: [
                        ['Type', INCIDENT_TYPES.find(i => i.value === form.incidentType)?.label],
                        ['Date', form.incidentDate ? new Date(form.incidentDate).toLocaleDateString() : '—'],
                        ['Location', form.incidentLocation || '—'],
                      ]
                    },
                    {
                      title: 'Additional', items: [
                        ['Est. Device Value', form.estimatedValue ? `₦${Number(form.estimatedValue).toLocaleString()}` : '—'],
                        ['Police Report', form.policeReport || '—'],
                      ]
                    },
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
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: P.bg }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: P.text }}>Incident Description</div>
                    <p className="text-sm" style={{ color: P.navy }}>{form.incidentDescription}</p>
                  </div>
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#065F46' }}>
                      <Check className="w-3.5 h-3.5" /> Attached Documents ({uploadedDocs.filter(d => d.url).length})
                    </div>
                    <div className="space-y-1.5">
                      {uploadedDocs.filter(d => d.url).map(d => (
                        <div key={d.label} className="flex items-center gap-2 text-xs" style={{ color: '#047857' }}>
                          <Paperclip className="w-3 h-3" />
                          <span className="font-medium">{d.label}</span>
                          <span className="text-green-400">— {d.file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between pt-4" style={{ borderTop: `1px solid ${P.border}` }}>
                    <button onClick={() => setStep(3)} className="px-6 py-3 rounded-xl font-medium" style={{ color: P.navy }}>Back</button>
                    <button onClick={handleSubmitClaim} disabled={submitting} className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>
                      {submitting ? 'Submitting...' : 'Submit Claim'}
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

  // ── CLAIMS LIST ──
  const counts = Object.fromEntries(Object.keys(STATUS_CONFIG).map(s => [s, claims.filter(c => c.status === s).length]));

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      {/* Detail Modal */}
      {detailClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: P.navy }}>{detailClaim.claim_number}</h2>
                <p className="text-sm" style={{ color: P.text }}>{detailClaim.device_model} · {detailClaim.device_asset_tag}</p>
              </div>
              <button onClick={() => { setDetailClaim(null); setDetailTab('details'); }}><X className="w-5 h-5" style={{ color: P.text }} /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-5 pt-4 border-b" style={{ borderColor: P.border }}>
              <button
                onClick={() => setDetailTab('details')}
                className="px-4 py-2 text-sm font-semibold border-b-2 transition-colors"
                style={{
                  borderColor: detailTab === 'details' ? P.teal : 'transparent',
                  color: detailTab === 'details' ? P.teal : P.text
                }}
              >
                Details
              </button>
              <button
                onClick={() => setDetailTab('history')}
                className="px-4 py-2 text-sm font-semibold border-b-2 transition-colors"
                style={{
                  borderColor: detailTab === 'history' ? P.teal : 'transparent',
                  color: detailTab === 'history' ? P.teal : P.text
                }}
              >
                History
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {detailTab === 'details' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: P.text }}>Status</span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: STATUS_CONFIG[detailClaim.status]?.bg, color: STATUS_CONFIG[detailClaim.status]?.color }}>
                      {STATUS_CONFIG[detailClaim.status]?.label}
                    </span>
                  </div>
              {[
                ['Incident Type', INCIDENT_TYPES.find(i => i.value === detailClaim.incident_type)?.label],
                ['Incident Date', detailClaim.incident_date ? new Date(detailClaim.incident_date).toLocaleDateString() : '—'],
                ['Location', detailClaim.incident_location || '—'],
                ['Assigned User', detailClaim.assigned_user || '—'],
                ['Department', detailClaim.department || '—'],
                ['Est. Value', detailClaim.estimated_value ? `₦${Number(detailClaim.estimated_value).toLocaleString()}` : '—'],
                ['Claim Amount', detailClaim.claim_amount ? `₦${Number(detailClaim.claim_amount).toLocaleString()}` : '—'],
                ['Approved Amount', detailClaim.approved_amount ? `₦${Number(detailClaim.approved_amount).toLocaleString()}` : '—'],
                ['Insurer Reference', detailClaim.insurer_reference || '—'],
                ['Police Report', detailClaim.police_report_number || '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span style={{ color: P.text }}>{l}</span>
                  <span className="font-semibold text-right ml-4" style={{ color: P.navy }}>{v}</span>
                </div>
              ))}
              <div>
                <div className="text-sm mb-1" style={{ color: P.text }}>Incident Description</div>
                <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: P.bg, color: P.navy }}>{detailClaim.incident_description}</p>
              </div>
              {/* Attached Documents */}
              {detailClaim.supporting_docs && (
                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: P.navy }}>Attached Documents</div>
                  <div className="space-y-2">
                    {detailClaim.supporting_docs.split('\n').filter(Boolean).map((line, i) => {
                      const [label, url] = line.split(': ');
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ borderColor: P.border }}>
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 flex-shrink-0" style={{ color: P.teal }} />
                            <span className="text-sm" style={{ color: P.navy }}>{label}</span>
                          </div>
                          {url && url.startsWith('http') && (
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                              style={{ backgroundColor: P.bg, color: P.teal }}>
                              View ↗
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {detailClaim.requires_manager_approval && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#EDE9FE', border: '1px solid #C4B5FD' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    <span className="text-xs font-semibold" style={{ color: '#7C3AED' }}>High-Value Claim — Manager Approval Required (≥ ₦500,000)</span>
                  </div>
                  {detailClaim.manager_approved !== undefined && detailClaim.manager_approval_date && (
                    <p className="text-xs mt-1" style={{ color: '#5B21B6' }}>
                      {detailClaim.manager_approved ? '✅ Approved' : '❌ Rejected'} by {detailClaim.manager_approved_by} on {new Date(detailClaim.manager_approval_date).toLocaleDateString()}
                    </p>
                  )}
                  {detailClaim.manager_approval_notes && (
                    <p className="text-xs mt-1 italic" style={{ color: '#6D28D9' }}>"{detailClaim.manager_approval_notes}"</p>
                  )}
                </div>
              )}
              {detailClaim.rejection_reason && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: '#DC2626' }}>Rejection Reason</div>
                  <p className="text-sm" style={{ color: '#7F1D1D' }}>{detailClaim.rejection_reason}</p>
                </div>
              )}

              {/* Manager Approval Panel — shown when pending manager approval and user is manager/admin/claims_manager */}
              {detailClaim.status === 'pending_manager_approval' && ['manager', 'admin', 'claims_manager'].includes(user?.role) && (
                <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: '#F5F3FF', border: '2px solid #7C3AED' }}>
                  <div className="font-semibold text-sm" style={{ color: '#7C3AED' }}>Manager Approval Required</div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: P.navy }}>Approval Notes</label>
                    <textarea value={managerNotes} onChange={e => setManagerNotes(e.target.value)} rows={2} placeholder="Add notes (optional)..." className="w-full px-3 py-2 border-2 rounded-lg text-sm resize-none" style={{ borderColor: '#C4B5FD' }} />
                  </div>
                  {showRejectInput && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#DC2626' }}>Rejection Reason *</label>
                      <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={2} placeholder="Required for rejection..." className="w-full px-3 py-2 border-2 rounded-lg text-sm resize-none" style={{ borderColor: '#FECACA' }} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleManagerApproval(detailClaim, true)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#10B981' }}>
                      ✅ Approve
                    </button>
                    {!showRejectInput ? (
                      <button onClick={() => setShowRejectInput(true)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#EF4444' }}>
                        ❌ Reject
                      </button>
                    ) : (
                      <button onClick={() => handleManagerApproval(detailClaim, false)} disabled={!rejectionReason.trim()} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#EF4444' }}>
                        Confirm Reject
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div>
                <div className="text-sm font-semibold mb-2" style={{ color: P.navy }}>Update Status</div>
                {['claims_adjuster'].includes(user?.role) ? (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                    ℹ️ As a Claims Adjuster, you can only update to 'Under Review' or 'Submitted' statuses. Approvals require a Claims Manager.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {['submitted', 'under_review', 'approved', 'rejected', 'paid', 'withdrawn'].map(st => {
                      const isAdjuster = user?.role === 'claims_adjuster';
                      const isRestrictedStatus = ['approved', 'rejected'].includes(st);
                      const blockedApprove = st === 'approved' && detailClaim.requires_manager_approval && !detailClaim.manager_approved;
                      const isDisabled = (isAdjuster && isRestrictedStatus) || blockedApprove;

                      return (
                        <button key={st} onClick={() => handleStatusUpdate(detailClaim, st)}
                          disabled={isDisabled}
                          title={isAdjuster && isRestrictedStatus ? 'Only Claims Managers can approve/reject' : blockedApprove ? 'Requires manager approval first' : ''}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: detailClaim.status === st ? P.teal : P.bg, color: detailClaim.status === st ? 'white' : isDisabled ? '#9CA3AF' : P.text }}>
                          {STATUS_CONFIG[st]?.label}{blockedApprove ? ' 🔒' : ''}{isAdjuster && isRestrictedStatus ? ' 🔒' : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
                {detailClaim.requires_manager_approval && !detailClaim.manager_approved && detailClaim.status !== 'pending_manager_approval' && !['claims_adjuster'].includes(user?.role) && (
                  <p className="text-xs mt-2" style={{ color: '#7C3AED' }}>
                    💡 To approve this claim, set status to "Pending Mgr Approval" — a manager will then review it.
                  </p>
                )}
              </div>
                ) : (
                <ClaimHistoryTimeline claimId={detailClaim.id} />
                )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Insurance Claims</h1>
            <p className="text-sm mt-0.5" style={{ color: P.text }}>{claims.length} total claims</p>
          </div>
          <button onClick={() => { setView('new'); setStep(1); }} className="px-4 py-2 rounded-lg font-semibold text-white text-sm flex items-center" style={{ backgroundColor: P.teal }}>
            <Plus className="w-4 h-4 mr-1.5" /> File Claim
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status summary */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className="bg-white rounded-xl p-3 shadow-sm text-center transition-all"
              style={{ borderWidth: 2, borderColor: statusFilter === key ? cfg.color : 'transparent' }}>
              <div className="text-xl font-bold" style={{ color: cfg.color }}>{counts[key] || 0}</div>
              <div className="text-xs mt-0.5" style={{ color: P.text }}>{cfg.label}</div>
            </button>
          ))}
        </div>

        {/* Search/filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: P.text }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claims..." className="w-full pl-10 pr-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center" style={{ color: P.text }}>Loading claims...</div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-16 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: P.border }} />
              <p className="font-medium" style={{ color: P.navy }}>No claims found</p>
              <button onClick={() => setView('new')} className="text-sm mt-2 font-medium" style={{ color: P.teal }}>File your first claim →</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                  {['Claim #', 'Device', 'Incident Type', 'Date', 'User / Dept', 'Est. Value', 'Status', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((c, i) => {
                  const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.submitted;
                  const it = INCIDENT_TYPES.find(t => t.value === c.incident_type);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filteredClaims.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                      <td className="px-6 py-4 font-mono font-bold text-sm" style={{ color: P.teal }}>{c.claim_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm" style={{ color: P.navy }}>{c.device_model}</div>
                        <div className="text-xs" style={{ color: P.text }}>{c.device_asset_tag}</div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{it?.emoji} {it?.label || c.incident_type}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{c.incident_date ? new Date(c.incident_date).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: P.navy }}>{c.assigned_user || '—'}</div>
                        <div className="text-xs" style={{ color: P.text }}>{c.department || '—'}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-sm" style={{ color: P.gold }}>
                        {c.estimated_value ? `₦${Number(c.estimated_value).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                          {c.supporting_docs && <Paperclip className="w-3.5 h-3.5" style={{ color: P.teal }} title="Has attachments" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setDetailClaim(c)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: P.teal }}>
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