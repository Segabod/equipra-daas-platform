import React, { useState, useEffect } from 'react';
import { DollarSign, Download, CheckCircle, Clock, AlertCircle, TrendingUp, Eye, FileText, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const INVOICES = [
  {
    id: 'INV-2026-02-001', month: 'February 2026', issueDate: '2026-02-01', dueDate: '2026-02-15',
    amount: 28450000, status: 'pending',
    devices: [
      { assetTag: 'CHH-LT-001', model: 'Dell Latitude 5420', user: 'Adebayo K.', rate: 85000, days: 28 },
      { assetTag: 'CHH-LT-002', model: 'MacBook Pro 14"', user: 'Chika O.', rate: 185000, days: 28 },
      { assetTag: 'CHH-LT-003', model: 'HP EliteBook 840', user: 'Segun A.', rate: 145000, days: 28 },
    ],
    credits: [],
  },
  {
    id: 'INV-2026-01-001', month: 'January 2026', issueDate: '2026-01-01', dueDate: '2026-01-15',
    amount: 27890000, paid: 27890000, paidDate: '2026-01-12', status: 'paid',
    devices: [
      { assetTag: 'CHH-LT-001', model: 'Dell Latitude 5420', user: 'Adebayo K.', rate: 85000, days: 31 },
      { assetTag: 'CHH-LT-002', model: 'MacBook Pro 14"', user: 'Chika O.', rate: 185000, days: 31 },
    ],
    credits: [],
  },
  {
    id: 'INV-2025-12-001', month: 'December 2025', issueDate: '2025-12-01', dueDate: '2025-12-15',
    amount: 29120000, paid: 29120000, paidDate: '2025-12-10', status: 'paid',
    devices: [
      { assetTag: 'CHH-LT-001', model: 'Dell Latitude 5420', user: 'Adebayo K.', rate: 85000, days: 31 },
      { assetTag: 'CHH-LT-002', model: 'MacBook Pro 14"', user: 'Chika O.', rate: 185000, days: 31 },
      { assetTag: 'CHH-LT-003', model: 'HP EliteBook 840', user: 'Segun A.', rate: 145000, days: 31 },
    ],
    credits: [{ reason: 'SLA Breach Credit', amount: -120000, ticketId: 'TK-2301' }],
  },
];

export default function Billing() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  if (selectedInvoice) {
    const inv = selectedInvoice;
    const subtotal = inv.devices.reduce((sum, d) => sum + (d.rate * d.days / 30), 0);
    const creditsTotal = inv.credits.reduce((sum, c) => sum + c.amount, 0);
    const vat = (subtotal + creditsTotal) * 0.075;
    const total = subtotal + creditsTotal + vat;

    return (
      <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
        <div className="bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSelectedInvoice(null)} className="text-sm font-medium" style={{ color: P.teal }}>← Back</button>
              <div className="w-px h-6" style={{ backgroundColor: P.border }} />
              <div>
                <h1 className="text-lg font-bold" style={{ color: P.navy }}>{inv.id}</h1>
                <p className="text-sm" style={{ color: P.text }}>{inv.month}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 rounded-lg border-2 text-sm font-medium" style={{ borderColor: P.border, color: P.navy }}>
                <Download className="w-4 h-4 inline mr-1.5" />Download PDF
              </button>
              {inv.status === 'pending' && (
                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: P.teal }}>
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm">
            {/* Invoice Header */}
            <div className="p-8" style={{ borderBottom: `1px solid ${P.border}` }}>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.navy }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold" style={{ color: P.navy }}>EquipraAfrica</span>
                  </div>
                  <div className="text-sm" style={{ color: P.text }}>
                    <p>Victoria Island, Lagos</p>
                    <p>billing@equipraafrica.ng</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black mb-1" style={{ color: P.navy }}>INVOICE</h2>
                  <p className="font-mono text-sm" style={{ color: P.text }}>{inv.id}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: P.text }}>Bill To:</p>
                  <p className="font-bold" style={{ color: P.navy }}>Consolidated Hallmark Group</p>
                  <p className="text-sm" style={{ color: P.text }}>Victoria Island, Lagos</p>
                </div>
                <div className="space-y-2 text-sm">
                  {[['Invoice Date', new Date(inv.issueDate).toLocaleDateString()], ['Due Date', new Date(inv.dueDate).toLocaleDateString()], ...(inv.paidDate ? [['Paid On', new Date(inv.paidDate).toLocaleDateString()]] : [])].map(([l,v]) => (
                    <div key={l} className="flex justify-between">
                      <span style={{ color: P.text }}>{l}:</span>
                      <span className="font-semibold" style={{ color: l === 'Paid On' ? '#10B981' : P.navy }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="p-8">
              <h3 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Subscription Details</h3>
              <table className="w-full mb-6">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${P.border}` }}>
                    {['Device', 'User', 'Rate/Day', 'Days', 'Amount'].map((h, i) => (
                      <th key={h} className={`py-3 text-sm font-semibold ${i > 1 ? 'text-right' : 'text-left'}`} style={{ color: P.text }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inv.devices.map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${P.border}` }}>
                      <td className="py-3">
                        <div className="font-semibold text-sm" style={{ color: P.navy }}>{d.model}</div>
                        <div className="text-xs font-mono" style={{ color: P.text }}>{d.assetTag}</div>
                      </td>
                      <td className="py-3 text-sm" style={{ color: P.navy }}>{d.user}</td>
                      <td className="py-3 text-right text-sm" style={{ color: P.navy }}>₦{(d.rate / 30).toFixed(0)}</td>
                      <td className="py-3 text-right text-sm" style={{ color: P.navy }}>{d.days}</td>
                      <td className="py-3 text-right font-semibold" style={{ color: P.navy }}>₦{((d.rate * d.days) / 30).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {inv.credits.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-2" style={{ color: P.text }}>Credits & Adjustments</h4>
                  {inv.credits.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm py-2">
                      <span style={{ color: P.text }}>{c.reason} ({c.ticketId})</span>
                      <span className="font-semibold text-green-600">-₦{Math.abs(c.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="max-w-xs ml-auto space-y-2 pt-4" style={{ borderTop: `2px solid ${P.border}` }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: P.text }}>Subtotal:</span>
                  <span className="font-semibold" style={{ color: P.navy }}>₦{subtotal.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                </div>
                {creditsTotal < 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: P.text }}>Credits:</span>
                    <span className="font-semibold text-green-600">-₦{Math.abs(creditsTotal).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span style={{ color: P.text }}>VAT (7.5%):</span>
                  <span className="font-semibold" style={{ color: P.navy }}>₦{vat.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                </div>
                <div className="flex justify-between pt-3" style={{ borderTop: `1px solid ${P.border}` }}>
                  <span className="text-lg font-bold" style={{ color: P.navy }}>Total:</span>
                  <span className="text-2xl font-black" style={{ color: P.gold }}>₦{total.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                </div>
              </div>
            </div>

            {/* Payment instructions */}
            <div className="p-8" style={{ backgroundColor: P.bg, borderTop: `1px solid ${P.border}`, borderRadius: '0 0 12px 12px' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: P.navy }}>Payment Instructions</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold mb-1" style={{ color: P.text }}>Bank Transfer:</p>
                  <p style={{ color: P.navy }}>Account: 1234567890</p>
                  <p style={{ color: P.navy }}>Bank: Access Bank</p>
                  <p style={{ color: P.navy }}>Account Name: EquipraAfrica Ltd</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: P.text }}>Reference:</p>
                  <p className="font-mono font-bold" style={{ color: P.navy }}>{inv.id}</p>
                  <p className="text-xs mt-2" style={{ color: P.text }}>Include invoice number in transfer description.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'Current Month', value: '₦28.45M', icon: DollarSign, color: P.teal, sub: 'February 2026' },
    { title: 'Outstanding', value: '₦28.45M', icon: Clock, color: '#F59E0B', sub: 'Pending payment' },
    { title: 'Paid (YTD)', value: '₦57.01M', icon: CheckCircle, color: '#10B981', sub: '2026 total' },
    { title: 'SLA Credits', value: '₦120K', icon: TrendingUp, color: P.gold, sub: 'Available' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Billing & Invoices</h1>
            <p className="text-sm mt-0.5" style={{ color: P.text }}>Manage subscriptions and payments</p>
          </div>
          <button className="px-4 py-2 rounded-lg border-2 text-sm font-medium flex items-center" style={{ borderColor: P.border, color: P.navy }}>
            <Download className="w-4 h-4 mr-1.5" />Export Statement
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: P.navy }}>{s.value}</div>
              <div className="text-sm font-medium" style={{ color: P.navy }}>{s.title}</div>
              <div className="text-xs mt-0.5" style={{ color: P.text }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6" style={{ borderBottom: `1px solid ${P.border}` }}>
            <h2 className="text-lg font-bold" style={{ color: P.navy }}>Invoice History</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
                {['Invoice', 'Period', 'Issue Date', 'Due Date', 'Amount', 'Status', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv, i) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < INVOICES.length-1 ? `1px solid ${P.border}` : 'none' }}>
                  <td className="px-6 py-4 font-mono font-bold text-sm" style={{ color: P.teal }}>{inv.id}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{inv.month}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: P.navy }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold" style={{ color: P.gold }}>₦{(inv.amount/1000000).toFixed(2)}M</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center ${inv.status==='paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status==='paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedInvoice(inv)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: P.teal }}>
                      <Eye className="w-3.5 h-3.5 inline mr-1" />View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}