import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Check, ChevronRight, ChevronLeft, Plus, Minus, CheckCircle, X } from 'lucide-react';
import PaymentCheckout from '../components/PaymentCheckout';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const REQUEST_TYPES = [
  { value: 'new_hire', label: 'New Hire', desc: 'Onboarding new employees' },
  { value: 'expansion', label: 'Dept. Expansion', desc: 'Scale up team capacity' },
  { value: 'replacement', label: 'Replacement', desc: 'Replace faulty device' },
  { value: 'upgrade', label: 'Upgrade', desc: 'Upgrade existing device' },
  { value: 'loaner', label: 'Loaner', desc: 'Short-term temporary device' },
];

const DEVICE_CLASSES = [
  { value: 'standard', label: 'Standard Workforce', desc: 'General office work, email, browsing', spec: 'i5, 8GB RAM, 256GB SSD', price: '₦85,000/mo' },
  { value: 'developer', label: 'Developer / Power User', desc: 'Development, design, resource-intensive tasks', spec: 'i7, 16GB RAM, 512GB SSD', price: '₦145,000/mo' },
  { value: 'executive', label: 'Executive', desc: 'Premium devices for leadership & client-facing roles', spec: 'MacBook Pro or premium Windows', price: '₦185,000/mo' },
];

const SERVICE_BUNDLES = [
  { value: 'standard', label: 'Standard SLA', desc: '48-hour swap', features: ['Business hours support', '48hr response', 'Standard shipping', 'Email support'], price: 'Included' },
  { value: 'premium', label: 'Premium SLA', desc: '24-hour swap', features: ['24/7 support', '24hr response', 'Express shipping', 'Phone & email support'], price: '+₦8,000/device/mo' },
  { value: 'executive', label: 'Executive SLA', desc: 'Next business day + priority', features: ['Dedicated agent', 'Next day swap', 'White glove service', 'Priority queue'], price: '+₦15,000/device/mo' },
];

const LOCATIONS = ['Lagos HQ - Victoria Island', 'Abuja Office - Maitama', 'Port Harcourt Office', 'Ibadan Branch'];
const DEPARTMENTS = ['Information Technology', 'Finance', 'Human Resources', 'Sales & Marketing', 'Operations'];
const APPROVERS = ['Amaka Okafor - CFO', 'Bola Adebayo - Head of HR', 'Chidi Nwosu - IT Manager'];
const DEVICE_TYPES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop PC' },
  { value: 'aio', label: 'All-in-One' },
  { value: 'monitor', label: 'Screen Monitor' },
];

// Device specs by class
const DEVICE_SPECS_BY_CLASS = {
  standard: {
    laptopModels: ['Dell Latitude 5540', 'HP EliteBook 840 G10', 'Lenovo ThinkPad E14', 'Lenovo IdeaPad Slim 5', 'Microsoft Surface Laptop 6'],
    desktopModels: ['Dell OptiPlex 7010', 'HP ProDesk 400 G9', 'Lenovo ThinkCentre M70t'],
    aioModels: ['Dell OptiPlex All-in-One 7410', 'HP EliteOne 840 G9 AiO', 'Lenovo ThinkCentre M90a'],
    monitorModels: ['Dell P2423D 24" QHD', 'HP E24 G5 24" FHD', 'Samsung 27" FHD Curved'],
    brands: ['Dell', 'HP', 'Lenovo', 'Microsoft'],
    processors: ['Intel Core i5 (12th Gen)', 'Intel Core i5 (13th Gen)'],
    rams: ['8GB'],
    storages: ['256GB SSD'],
    screens: ['13"', '14"', '15"', '24"'],
    os: ['Windows 11 Home', 'Windows 11 Pro'],
  },
  developer: {
    laptopModels: ['Dell Latitude 7440', 'Dell XPS 13', 'HP EliteBook 860 G10', 'Lenovo ThinkPad T14', 'Lenovo ThinkPad X1 Carbon', 'Microsoft Surface Laptop 6'],
    desktopModels: ['Dell OptiPlex 7000 SFF', 'Dell Precision Tower 3660', 'HP EliteDesk 800 G9', 'HP Z2 Tower G9', 'Lenovo ThinkCentre M90t', 'Lenovo ThinkStation P360'],
    aioModels: ['HP EliteOne 840 G9 AiO', 'Lenovo ThinkCentre M90a'],
    monitorModels: ['Dell P2423D 24" QHD', 'Dell U2722D 27" 4K', 'HP Z27u G3 27" 4K', 'LG UltraFine 27" 4K', 'Samsung 27" FHD Curved'],
    brands: ['Dell', 'HP', 'Lenovo', 'Microsoft', 'Asus'],
    processors: ['Intel Core i7 (12th Gen)', 'Intel Core i7 (13th Gen)', 'AMD Ryzen 5 7600', 'AMD Ryzen 7 7800X'],
    rams: ['16GB', '32GB'],
    storages: ['512GB SSD', '1TB SSD'],
    screens: ['13"', '14"', '15"', '16"', '24"', '27"'],
    os: ['Windows 11 Pro', 'Windows 11 Home', 'Ubuntu 22.04 LTS', 'Chrome OS'],
  },
  executive: {
    laptopModels: ['Dell XPS 15', 'Dell Precision 5570', 'HP ZBook Firefly 14', 'Lenovo ThinkPad X1 Carbon', 'Apple MacBook Air 13" M3', 'Apple MacBook Air 15" M3', 'Apple MacBook Pro 14" M3', 'Apple MacBook Pro 16" M3', 'Asus ExpertBook B9', 'Asus ProArt Studiobook'],
    desktopModels: ['Dell Precision Tower 3660', 'HP Z2 Tower G9', 'Lenovo ThinkStation P360', 'Apple Mac mini M4', 'Apple Mac Pro M2'],
    aioModels: ['Apple iMac 24" M4', 'Asus Vivo AiO V241'],
    monitorModels: ['Dell U2722D 27" 4K', 'Dell U3223QE 32" 4K', 'HP Z27u G3 27" 4K', 'LG UltraFine 27" 4K', 'LG UltraWide 34" WQHD', 'Samsung 32" 4K Smart Monitor', 'ViewSonic VP2756-4K 27"'],
    brands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Asus', 'LG', 'Samsung', 'ViewSonic'],
    processors: ['Intel Core i7 (13th Gen)', 'Intel Core i9 (13th Gen)', 'AMD Ryzen 7 7800X', 'Apple M3', 'Apple M3 Pro', 'Apple M3 Max', 'Apple M4'],
    rams: ['32GB', '64GB'],
    storages: ['1TB SSD', '2TB SSD'],
    screens: ['14"', '15"', '16"', '24"', '27"', '32"', '34"'],
    os: ['Windows 11 Pro', 'macOS', 'Ubuntu 22.04 LTS'],
  },
};

// Paid accessories with pricing
const PAID_ACCESSORIES = [
  { name: 'External Monitor (24" FHD)', price: 75000 },
  { name: 'External Monitor (27" 4K)', price: 120000 },
  { name: 'USB-C Docking Station', price: 55000 },
  { name: 'Thunderbolt 4 Hub', price: 45000 },
  { name: 'Wireless Keyboard & Mouse', price: 25000 },
  { name: 'Ergonomic Wireless Mouse', price: 15000 },
  { name: 'Laptop Bag / Backpack', price: 12000 },
  { name: 'Executive Laptop Sleeve', price: 8000 },
  { name: 'HD Webcam (1080p)', price: 35000 },
  { name: 'Noise-Cancelling Headset', price: 65000 },
  { name: 'USB-C Adapter (Multi-port)', price: 18000 },
  { name: 'External SSD (1TB)', price: 70000 },
];
const FREE_ACCESSORIES = ['Power Adapter', 'Device Warranty Card'];
const ACCESSORIES = [...PAID_ACCESSORIES.map(a => a.name), ...FREE_ACCESSORIES];

const STEPS = ['Request Info', 'Device Class', 'Specifications', 'Service Bundle', 'Review'];

const CLASS_PRICES = { standard: 85000, developer: 145000, executive: 185000 };
const BUNDLE_PRICES = { standard: 0, premium: 8000, executive: 15000 };

// Depreciation schedule: year 1 is 100%, year 2 is 80%, year 3+ is 60%
const DEPRECIATION_BY_YEAR = {
  1: 1.0,    // Year 1: 100% of price
  2: 0.8,    // Year 2: 80% of price
  3: 0.6,    // Year 3+: 60% of price
};

function getDepreciationMultiplier(yearNumber) {
  if (yearNumber <= 0) return DEPRECIATION_BY_YEAR[1];
  if (yearNumber >= 3) return DEPRECIATION_BY_YEAR[3];
  return DEPRECIATION_BY_YEAR[yearNumber];
}

function calcTotal(form, yearNumber = 1) {
  const classPrice = CLASS_PRICES[form.deviceClass] || 0;
  const bundlePrice = BUNDLE_PRICES[form.serviceBundle] || 0;
  const depreciationMultiplier = getDepreciationMultiplier(yearNumber);
  const depreciatedClassPrice = Math.round(classPrice * depreciationMultiplier);
  
  const accessoryPrice = form.accessories.reduce((sum, name) => {
    const found = PAID_ACCESSORIES.find(a => a.name === name);
    return sum + (found ? found.price : 0);
  }, 0);
  
  const perDevice = depreciatedClassPrice + bundlePrice + accessoryPrice;
  const subtotal = perDevice * (form.quantity || 1);
  const vat = subtotal * 0.075;
  return { classPrice: depreciatedClassPrice, bundlePrice, accessoryPrice, perDevice, subtotal, vat, total: subtotal + vat, depreciationMultiplier, originalPrice: CLASS_PRICES[form.deviceClass] };
}

function CostSummary({ form, yearNumber = 1 }) {
  const { classPrice, bundlePrice, accessoryPrice, perDevice, subtotal, vat, total, depreciationMultiplier, originalPrice } = calcTotal(form, yearNumber);
  if (!form.deviceClass) return null;
  const selectedAccessories = PAID_ACCESSORIES.filter(a => form.accessories.includes(a.name));
  
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#0B1F3A', color: 'white' }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold" style={{ color: '#0FA3B1' }}>💰 Cost Preview</h4>
        {yearNumber > 1 && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#10B981' }}>Year {yearNumber} ({Math.round(depreciationMultiplier * 100)}%)</span>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Device ({DEVICE_CLASSES.find(d=>d.value===form.deviceClass)?.label})</span>
          <div className="flex items-center gap-2">
            {yearNumber > 1 && <span style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>₦{originalPrice?.toLocaleString()}</span>}
            <span>₦{classPrice.toLocaleString()}/mo</span>
          </div>
        </div>
        {bundlePrice > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>SLA Bundle</span>
            <span>+₦{bundlePrice.toLocaleString()}/mo</span>
          </div>
        )}
        {selectedAccessories.map(a => (
          <div key={a.name} className="flex justify-between text-xs">
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{a.name}</span>
            <span style={{ color: '#D4AF37' }}>+₦{a.price.toLocaleString()}/mo</span>
          </div>
        ))}
        <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Per Device/mo</span>
          <span className="font-semibold" style={{ color: '#0FA3B1' }}>₦{perDevice.toLocaleString()}</span>
        </div>
        {form.quantity > 1 && (
          <div className="flex justify-between text-xs">
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>× {form.quantity} devices</span>
            <span>₦{subtotal.toLocaleString()}/mo</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>VAT (7.5%)</span>
          <span>₦{vat.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
        </div>
        <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <span className="font-bold">Total/mo</span>
          <span className="text-lg font-black" style={{ color: '#D4AF37' }}>₦{total.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
        </div>
      </div>
    </div>
  );
}

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [form, setForm] = useState({
    requestType: '', quantity: 1, deliveryLocation: '', requiredDate: '', costCenter: '', approver: '',
    deviceClass: '', brand: '', processor: '', ram: '', storage: '', screenSize: '', os: '',
    accessories: [], serviceBundle: 'standard', notes: '',
  });

  useEffect(() => {
    base44.entities.DeviceRequest.list('-created_date', 50).then(r => { setRequests(r); setLoading(false); });
  }, []);

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const toggleAccessory = (a) => {
    setForm(f => ({ ...f, accessories: f.accessories.includes(a) ? f.accessories.filter(x=>x!==a) : [...f.accessories, a] }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const user = await base44.auth.me().catch(() => null);
    const { total } = calcTotal(form);
    const newRequest = await base44.entities.DeviceRequest.create({
      request_type: form.requestType,
      quantity: form.quantity,
      delivery_location: form.deliveryLocation,
      required_date: form.requiredDate,
      cost_center: form.costCenter,
      approver: form.approver,
      device_class: form.deviceClass,
      brand: form.brand,
      processor: form.processor,
      ram: form.ram,
      storage: form.storage,
      screen_size: form.screenSize,
      os: form.os,
      accessories: form.accessories,
      service_bundle: form.serviceBundle,
      notes: form.notes,
      status: 'pending_approval',
      estimated_monthly_cost: Math.round(total),
    });
    await base44.entities.Notification.create({
      user_email: user?.email || 'admin',
      title: 'Device Request Submitted',
      message: `Your request for ${form.quantity}× ${form.deviceClass} device(s) has been submitted and is pending approval from ${form.approver}.`,
      type: 'request_submitted',
      link_page: 'RequestHistory',
    });
    // Send email notifications (fire and forget)
    base44.functions.invoke('sendRequestEmail', {
      event: 'submitted',
      requestData: { ...newRequest, created_by: user?.email },
    }).catch(() => {});

    const updated = await base44.entities.DeviceRequest.list('-created_date', 50);
    setRequests(updated);
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => { setView('list'); setStep(1); setForm({ requestType:'', quantity:1, deliveryLocation:'', requiredDate:'', costCenter:'', approver:'', deviceClass:'', brand:'', processor:'', ram:'', storage:'', screenSize:'', os:'', accessories:[], serviceBundle:'standard', notes:'' }); setSuccess(false); }, 2000);
  };

  const step1Valid = form.requestType && form.deliveryLocation && form.costCenter && form.approver;
  const step2Valid = form.deviceClass;
  const step3Valid = true;
  const step4Valid = form.serviceBundle;

  if (view === 'new') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
        <div className="bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.navy }}>
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: P.navy }}>New Device Request</h1>
                <p className="text-xs" style={{ color: P.text }}>Configure and submit your order</p>
              </div>
            </div>
            <button onClick={() => { setView('list'); setStep(1); }} className="text-sm font-medium" style={{ color: P.text }}>Cancel</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((label, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: step > i+1 ? '#10B981' : step === i+1 ? P.teal : P.border, color: step >= i+1 ? 'white' : P.text }}>
                      {step > i+1 ? <Check className="w-5 h-5" /> : i+1}
                    </div>
                    <div className="text-xs mt-2 font-medium text-center hidden sm:block" style={{ color: step >= i+1 ? P.navy : P.text }}>{label}</div>
                  </div>
                  {i < STEPS.length-1 && <div className="flex-1 h-0.5 mx-3 mb-5" style={{ backgroundColor: step > i+1 ? '#10B981' : P.border }} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
          <div className="flex-1 bg-white rounded-xl shadow-sm p-8">
            {success && (
              <div className="text-center py-10">
                <CheckCircle className="w-14 h-14 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Request Submitted!</h2>
                <p style={{ color: P.text }}>Your device request is pending approval. Returning to list...</p>
              </div>
            )}

            {!success && step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: P.navy }}>Request Information</h2>
                  <p style={{ color: P.text }}>Tell us about your device needs</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: P.navy }}>Request Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {REQUEST_TYPES.map(rt => (
                      <button key={rt.value} onClick={() => update('requestType', rt.value)} className="p-4 rounded-xl border-2 text-left transition-all" style={{ borderColor: form.requestType===rt.value ? P.teal : P.border, backgroundColor: form.requestType===rt.value ? '#F0FAFB' : 'white' }}>
                        <div className="font-semibold text-sm" style={{ color: P.navy }}>{rt.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: P.text }}>{rt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Quantity <span className="text-red-500">*</span></label>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => update('quantity', Math.max(1, form.quantity-1))} className="w-10 h-10 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: P.border }}>
                        <Minus className="w-4 h-4" style={{ color: P.navy }} />
                      </button>
                      <input type="number" value={form.quantity} onChange={e=>update('quantity', parseInt(e.target.value)||1)} className="flex-1 text-center px-4 py-2 border-2 rounded-lg font-semibold" style={{ borderColor: P.border, color: P.navy }} />
                      <button onClick={() => update('quantity', form.quantity+1)} className="w-10 h-10 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: P.border }}>
                        <Plus className="w-4 h-4" style={{ color: P.navy }} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Required Date</label>
                    <input type="date" value={form.requiredDate} onChange={e=>update('requiredDate',e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Delivery Location <span className="text-red-500">*</span></label>
                    <select value={form.deliveryLocation} onChange={e=>update('deliveryLocation',e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
                      <option value="">Select location</option>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Department / Cost Center <span className="text-red-500">*</span></label>
                    <select value={form.costCenter} onChange={e=>update('costCenter',e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Approver <span className="text-red-500">*</span></label>
                  <select value={form.approver} onChange={e=>update('approver',e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
                    <option value="">Select approver</option>
                    {APPROVERS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            )}

            {!success && step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: P.navy }}>Select Device Class</h2>
                  <p style={{ color: P.text }}>Choose the appropriate tier for your users</p>
                </div>
                <div className="space-y-4">
                  {DEVICE_CLASSES.map(dc => (
                    <button key={dc.value} onClick={() => update('deviceClass', dc.value)} className="w-full p-6 rounded-xl border-2 text-left transition-all" style={{ borderColor: form.deviceClass===dc.value ? P.teal : P.border, backgroundColor: form.deviceClass===dc.value ? '#F0FAFB' : 'white' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold mb-1" style={{ color: P.navy }}>{dc.label}</h3>
                          <p className="text-sm mb-2" style={{ color: P.text }}>{dc.desc}</p>
                          <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: P.bg, color: P.text }}>Recommended: {dc.spec}</span>
                        </div>
                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold" style={{ color: P.gold }}>{dc.price}</div>
                          <div className="text-xs" style={{ color: P.text }}>per device</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!success && step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: P.navy }}>Configure Specifications</h2>
                  <p style={{ color: P.text }}>Customize your device requirements (all optional)</p>
                </div>
                <div>
                   <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Device Type</label>
                   <div className="grid grid-cols-4 gap-2 mb-4">
                     {DEVICE_TYPES.map(t => (
                       <button key={t.value} onClick={() => update('deviceType', t.value)} className="p-3 rounded-xl border-2 text-center text-sm" style={{ borderColor: form.deviceType === t.value ? P.teal : P.border, backgroundColor: form.deviceType === t.value ? '#F0FAFB' : 'white', color: P.navy }}>
                         {t.label}
                       </button>
                     ))}
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Device Model</label>
                   {form.deviceClass && (() => {
                     const classSpecs = DEVICE_SPECS_BY_CLASS[form.deviceClass];
                     const models = form.deviceType === 'desktop' ? classSpecs.desktopModels : form.deviceType === 'aio' ? classSpecs.aioModels : form.deviceType === 'monitor' ? classSpecs.monitorModels : classSpecs.laptopModels;
                     return (
                       <select value={form.model || ''} onChange={e => update('model', e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
                         <option value="">Any / No preference</option>
                         {models.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                     );
                   })()}
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   {(() => {
                     const classSpecs = form.deviceClass ? DEVICE_SPECS_BY_CLASS[form.deviceClass] : null;
                     return [
                       { field: 'brand', label: 'Brand', opts: classSpecs?.brands || [] },
                       { field: 'processor', label: 'Processor', opts: classSpecs?.processors || [] },
                       { field: 'ram', label: 'RAM', opts: classSpecs?.rams || [] },
                       { field: 'storage', label: 'Storage', opts: classSpecs?.storages || [] },
                       { field: 'screenSize', label: 'Screen Size', opts: classSpecs?.screens || [] },
                       { field: 'os', label: 'Operating System', opts: classSpecs?.os || [] },
                     ].map(({ field, label, opts }) => (
                       <div key={field}>
                         <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>{label}</label>
                         <select value={form[field]} onChange={e=>update(field,e.target.value)} className="w-full px-4 py-2.5 border-2 rounded-lg text-sm" style={{ borderColor: P.border, color: P.navy }}>
                           <option value="">Any / No preference</option>
                           {opts.map(o => <option key={o} value={o}>{o}</option>)}
                         </select>
                       </div>
                     ));
                   })()}
                 </div>
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: P.navy }}>Accessories</label>
                  <p className="text-xs mb-3" style={{ color: P.text }}>Paid accessories are charged at an additional monthly rate. Free accessories are included.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PAID_ACCESSORIES.map(a => (
                      <label key={a.name} className="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer" style={{ borderColor: form.accessories.includes(a.name) ? P.teal : P.border, backgroundColor: form.accessories.includes(a.name) ? '#F0FAFB' : 'white' }}>
                        <div className="flex items-center">
                          <input type="checkbox" checked={form.accessories.includes(a.name)} onChange={() => toggleAccessory(a.name)} className="mr-2.5" style={{ accentColor: P.teal }} />
                          <span className="text-sm" style={{ color: P.navy }}>{a.name}</span>
                        </div>
                        <span className="text-xs font-semibold ml-2 whitespace-nowrap" style={{ color: P.gold }}>+₦{a.price.toLocaleString()}/mo</span>
                      </label>
                    ))}
                    {FREE_ACCESSORIES.map(a => (
                      <label key={a} className="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer" style={{ borderColor: P.border, backgroundColor: 'white' }}>
                        <div className="flex items-center">
                          <input type="checkbox" checked={form.accessories.includes(a)} onChange={() => toggleAccessory(a)} className="mr-2.5" style={{ accentColor: P.teal }} />
                          <span className="text-sm" style={{ color: P.navy }}>{a}</span>
                        </div>
                        <span className="text-xs font-semibold ml-2" style={{ color: '#10B981' }}>Free</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!success && step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: P.navy }}>Select Service Bundle</h2>
                  <p style={{ color: P.text }}>Choose your SLA and support level</p>
                </div>
                <div className="space-y-4">
                  {SERVICE_BUNDLES.map(b => (
                    <button key={b.value} onClick={() => update('serviceBundle', b.value)} className="w-full p-6 rounded-xl border-2 text-left transition-all" style={{ borderColor: form.serviceBundle===b.value ? P.teal : P.border, backgroundColor: form.serviceBundle===b.value ? '#F0FAFB' : 'white' }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold mb-0.5" style={{ color: P.navy }}>{b.label}</h3>
                          <p className="text-sm" style={{ color: P.text }}>{b.desc}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold" style={{ color: b.value==='standard' ? P.teal : P.gold }}>{b.price}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {b.features.map((f,i) => (
                          <div key={i} className="flex items-center text-sm" style={{ color: P.text }}>
                            <Check className="w-4 h-4 mr-2" style={{ color: P.teal }} />
                            {f}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!success && step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: P.navy }}>Review & Submit</h2>
                  <p style={{ color: P.text }}>Confirm your request details before sending for approval</p>
                </div>
                {[
                  { title: 'Request Info', items: [['Type', REQUEST_TYPES.find(r=>r.value===form.requestType)?.label], ['Quantity', form.quantity], ['Location', form.deliveryLocation], ['Department', form.costCenter], ['Approver', form.approver], ['Required Date', form.requiredDate || '—']] },
                  { title: 'Device', items: [['Class', DEVICE_CLASSES.find(d=>d.value===form.deviceClass)?.label], ['Brand', form.brand||'Any'], ['Processor', form.processor||'Any'], ['RAM', form.ram||'Any'], ['Storage', form.storage||'Any'], ['OS', form.os||'Any']] },
                  { title: 'Service', items: [['Bundle', SERVICE_BUNDLES.find(b=>b.value===form.serviceBundle)?.label], ['Accessories', form.accessories.filter(a=>PAID_ACCESSORIES.find(p=>p.name===a)).join(', ') || 'None']] },
                ].map(section => (
                  <div key={section.title} className="p-5 rounded-xl" style={{ backgroundColor: P.bg }}>
                    <h3 className="font-bold mb-3" style={{ color: P.navy }}>{section.title}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {section.items.map(([l,v]) => (
                        <div key={l}>
                          <div className="text-xs" style={{ color: P.text }}>{l}</div>
                          <div className="text-sm font-semibold mt-0.5" style={{ color: P.navy }}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Cost Breakdown - Year 1 & Year 2 */}
                {(() => {
                  const year1 = calcTotal(form, 1);
                  const year2 = calcTotal(form, 2);
                  const selectedAcc = PAID_ACCESSORIES.filter(a => form.accessories.includes(a.name));
                  return (
                    <div className="space-y-4">
                      {/* Year 1 */}
                      <div className="rounded-xl p-5" style={{ backgroundColor: '#0B1F3A' }}>
                        <h3 className="font-bold mb-4 text-white">Year 1 Cost Estimate</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-white/70">
                            <span>Device ({DEVICE_CLASSES.find(d=>d.value===form.deviceClass)?.label})</span>
                            <span className="text-white">₦{year1.classPrice.toLocaleString()}/mo</span>
                          </div>
                          {year1.bundlePrice > 0 && (
                            <div className="flex justify-between text-white/70">
                              <span>SLA Bundle ({SERVICE_BUNDLES.find(b=>b.value===form.serviceBundle)?.label})</span>
                              <span className="text-white">+₦{year1.bundlePrice.toLocaleString()}/mo</span>
                            </div>
                          )}
                          {selectedAcc.map(a => (
                            <div key={a.name} className="flex justify-between text-white/60 text-xs">
                              <span>{a.name}</span>
                              <span style={{ color: '#D4AF37' }}>+₦{a.price.toLocaleString()}/mo</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-white/70 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                            <span>Per device/mo</span>
                            <span className="text-white font-semibold">₦{year1.perDevice.toLocaleString()}</span>
                          </div>
                          {form.quantity > 1 && (
                            <div className="flex justify-between text-white/70">
                              <span>× {form.quantity} devices</span>
                              <span className="text-white">₦{year1.subtotal.toLocaleString()}/mo</span>
                            </div>
                          )}
                          <div className="flex justify-between text-white/60 text-xs">
                            <span>VAT (7.5%)</span>
                            <span>₦{year1.vat.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                          </div>
                          <div className="flex justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
                            <span className="font-bold text-white text-base">Monthly Total</span>
                            <span className="text-2xl font-black" style={{ color: '#D4AF37' }}>₦{year1.total.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                          </div>
                        </div>
                      </div>

                      {/* Year 2 */}
                      <div className="rounded-xl p-5" style={{ backgroundColor: '#1a3a3a' }}>
                        <h3 className="font-bold mb-4 text-white">Year 2 Cost Estimate <span style={{ color: '#10B981', fontSize: '0.875rem' }}>(20% depreciation)</span></h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-white/70">
                            <span>Device ({DEVICE_CLASSES.find(d=>d.value===form.deviceClass)?.label})</span>
                            <span className="text-white">₦{year2.classPrice.toLocaleString()}/mo</span>
                          </div>
                          {year2.bundlePrice > 0 && (
                            <div className="flex justify-between text-white/70">
                              <span>SLA Bundle ({SERVICE_BUNDLES.find(b=>b.value===form.serviceBundle)?.label})</span>
                              <span className="text-white">+₦{year2.bundlePrice.toLocaleString()}/mo</span>
                            </div>
                          )}
                          {selectedAcc.map(a => (
                            <div key={a.name} className="flex justify-between text-white/60 text-xs">
                              <span>{a.name}</span>
                              <span style={{ color: '#D4AF37' }}>+₦{a.price.toLocaleString()}/mo</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-white/70 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                            <span>Per device/mo</span>
                            <span className="text-white font-semibold">₦{year2.perDevice.toLocaleString()}</span>
                          </div>
                          {form.quantity > 1 && (
                            <div className="flex justify-between text-white/70">
                              <span>× {form.quantity} devices</span>
                              <span className="text-white">₦{year2.subtotal.toLocaleString()}/mo</span>
                            </div>
                          )}
                          <div className="flex justify-between text-white/60 text-xs">
                            <span>VAT (7.5%)</span>
                            <span>₦{year2.vat.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                          </div>
                          <div className="flex justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
                            <span className="font-bold text-white text-base">Monthly Total</span>
                            <span className="text-2xl font-black" style={{ color: '#D4AF37' }}>₦{year2.total.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {!success && (
              <div className="flex items-center justify-between pt-8 mt-8" style={{ borderTop: `1px solid ${P.border}` }}>
                <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step===1} className="px-6 py-3 rounded-xl font-medium flex items-center disabled:opacity-40" style={{ color: P.navy }}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </button>
                {step < 5 ? (
                  <button onClick={() => setStep(s => s+1)} disabled={step===1 && !step1Valid || step===2 && !step2Valid} className="px-8 py-3 rounded-xl font-semibold text-white flex items-center disabled:opacity-40" style={{ backgroundColor: P.teal }}>
                    Next Step <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P.teal }}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Cost Summary Sidebar */}
          {!success && step >= 2 && (
            <div className="w-72 flex-shrink-0 space-y-4">
              <div className="space-y-2">
                <CostSummary form={form} yearNumber={1} />
                <div className="text-center">
                  <div className="text-xs mt-2" style={{ color: P.text }}>Year 2 pricing preview</div>
                  <CostSummary form={form} yearNumber={2} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-xs" style={{ color: P.text }}>
                <p className="font-semibold mb-1" style={{ color: P.navy }}>Depreciation Schedule</p>
                <div className="space-y-1 text-xs mt-2">
                  <div className="flex justify-between"><span>Year 1:</span><span className="font-semibold">100%</span></div>
                  <div className="flex justify-between"><span>Year 2:</span><span className="font-semibold">80%</span></div>
                  <div className="flex justify-between"><span>Year 3+:</span><span className="font-semibold">60%</span></div>
                </div>
                <p className="mt-2" style={{ color: '#6B7280' }}>Device costs reduce each year. SLA & accessories are not depreciated.</p>
              </div>
            </div>
          )}
          </div>
          </div>

          {/* Request Details Modal */}
          {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
           <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
             <h2 className="text-lg font-bold" style={{ color: P.navy }}>Request Details</h2>
             <button onClick={() => { setSelectedRequest(null); setShowPayment(false); }} className="p-1 hover:bg-gray-100 rounded-lg">
               <X className="w-5 h-5" style={{ color: '#6B7280' }} />
             </button>
           </div>

           <div className="p-6 space-y-6">
             {!showPayment && (
               <>
                 <div>
                   <h3 className="font-semibold mb-3" style={{ color: P.navy }}>Request Information</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Request ID</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>REQ-{selectedRequest.id?.slice(-4)?.toUpperCase()}</p>
                     </div>
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Type</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>{REQUEST_TYPES.find(t=>t.value===selectedRequest.request_type)?.label}</p>
                     </div>
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Quantity</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>{selectedRequest.quantity}</p>
                     </div>
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Status</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>{(selectedRequest.status||'draft').replace('_', ' ')}</p>
                     </div>
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Location</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>{selectedRequest.delivery_location}</p>
                     </div>
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Department</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>{selectedRequest.cost_center}</p>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="font-semibold mb-3" style={{ color: P.navy }}>Device Details</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Class</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>{DEVICE_CLASSES.find(d=>d.value===selectedRequest.device_class)?.label}</p>
                     </div>
                     <div>
                       <p className="text-xs" style={{ color: P.text }}>Service Bundle</p>
                       <p className="font-semibold mt-1" style={{ color: P.navy }}>{SERVICE_BUNDLES.find(b=>b.value===selectedRequest.service_bundle)?.label}</p>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="font-semibold mb-3" style={{ color: P.navy }}>Pricing</h3>
                   <div className="p-4 rounded-lg" style={{ backgroundColor: P.bg }}>
                     <p className="text-sm" style={{ color: P.text }}>Estimated Monthly Cost</p>
                     <p className="text-3xl font-bold mt-2" style={{ color: P.teal }}>₦{selectedRequest.estimated_monthly_cost?.toLocaleString()}</p>
                   </div>
                 </div>

                 {selectedRequest.status === 'approved' && (
                   <div>
                     <button 
                       onClick={() => setShowPayment(true)}
                       className="w-full px-4 py-3 rounded-lg font-semibold text-white"
                       style={{ backgroundColor: P.teal }}
                     >
                       Proceed to Payment
                     </button>
                   </div>
                 )}
               </>
             )}

             {showPayment && (
               <div className="space-y-4">
                 <button
                   onClick={() => setShowPayment(false)}
                   className="text-sm font-medium"
                   style={{ color: P.teal }}
                 >
                   ← Back to Details
                 </button>
                 <PaymentCheckout
                   amount={selectedRequest.estimated_monthly_cost}
                   description={`Device Request - ${DEVICE_CLASSES.find(d=>d.value===selectedRequest.device_class)?.label}`}
                   requestId={selectedRequest.id}
                   type="subscription"
                   onSuccess={() => {
                     setSelectedRequest(null);
                     setShowPayment(false);
                   }}
                 />
               </div>
             )}
           </div>
          </div>
          </div>
          )}
          </div>
          );
          }

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Device Requests</h1>
            <p className="text-sm mt-0.5" style={{ color: P.text }}>{requests.length} total requests</p>
          </div>
          <button onClick={() => setView('new')} className="px-4 py-2 rounded-lg font-semibold text-white text-sm flex items-center" style={{ backgroundColor: P.teal }}>
            <Plus className="w-4 h-4 mr-1.5" /> New Request
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center" style={{ color: P.text }}>Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="w-12 h-12 mx-auto mb-4" style={{ color: P.border }} />
              <p className="font-medium" style={{ color: P.navy }}>No requests yet</p>
              <button onClick={() => setView('new')} className="text-sm mt-2 font-medium" style={{ color: P.teal }}>Create your first request →</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                  {['Request', 'Type', 'Qty', 'Device Class', 'Location', 'Approver', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderBottom: i < requests.length-1 ? `1px solid ${P.border}` : 'none' }} onClick={() => setSelectedRequest(r)}>
                    <td className="px-6 py-4 font-mono font-bold text-xs" style={{ color: P.teal }}>REQ-{r.id?.slice(-4)?.toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{REQUEST_TYPES.find(t=>t.value===r.request_type)?.label || r.request_type}</td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: P.navy }}>{r.quantity}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{DEVICE_CLASSES.find(d=>d.value===r.device_class)?.label || r.device_class}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{r.delivery_location}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: P.text }}>{r.approver}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.status==='approved'||r.status==='delivered' ? 'bg-green-100 text-green-700' :
                        r.status==='pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                        r.status==='rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {(r.status||'draft').replace('_',' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}