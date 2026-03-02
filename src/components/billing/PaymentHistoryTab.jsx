import React from 'react';
import { CheckCircle, Clock, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const STATUS_CONFIG = {
  paid:      { label: 'Paid',     color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  pending:   { label: 'Pending',  color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  overdue:   { label: 'Overdue',  color: '#EF4444', bg: '#FEE2E2', icon: AlertCircle },
  cancelled: { label: 'Cancelled',color: '#6B7280', bg: '#F3F4F6', icon: AlertCircle },
};

const METHOD_ICON = {
  card: <CreditCard className="w-3.5 h-3.5 inline mr-1" />,
  subscription: <RefreshCw className="w-3.5 h-3.5 inline mr-1" />,
};

export default function PaymentHistoryTab({ invoices }) {
  const sorted = [...invoices].sort((a, b) => new Date(b.issue_date || b.issueDate) - new Date(a.issue_date || a.issueDate));

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6" style={{ borderBottom: `1px solid ${P.border}` }}>
        <h2 className="text-lg font-bold" style={{ color: P.navy }}>Payment History</h2>
        <p className="text-sm mt-0.5" style={{ color: P.text }}>Full transaction history with payment details</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: P.bg, borderBottom: `1px solid ${P.border}` }}>
              {['Invoice ID', 'Period', 'Issue Date', 'Due Date', 'Amount', 'Paid Date', 'Payment Method', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: P.text }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv, i) => {
              const s = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
              const Icon = s.icon;
              return (
                <tr key={inv.id || inv.invoice_id || i} className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                  <td className="px-5 py-4 font-mono font-bold text-sm" style={{ color: P.teal }}>
                    {inv.invoice_id || inv.id}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: P.navy }}>{inv.month}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: P.navy }}>
                    {inv.issue_date || inv.issueDate ? new Date(inv.issue_date || inv.issueDate).toLocaleDateString('en-NG') : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: P.navy }}>
                    {new Date(inv.due_date || inv.dueDate).toLocaleDateString('en-NG')}
                  </td>
                  <td className="px-5 py-4 font-bold" style={{ color: P.gold }}>
                    ₦{Number(inv.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#10B981' }}>
                    {(inv.paid_date || inv.paidDate) ? new Date(inv.paid_date || inv.paidDate).toLocaleDateString('en-NG') : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: P.navy }}>
                    {inv.payment_method ? (
                      <span className="flex items-center gap-1">
                        {METHOD_ICON[inv.payment_method] || <CreditCard className="w-3.5 h-3.5 inline mr-1" />}
                        <span className="capitalize">{inv.payment_method}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                      style={{ backgroundColor: s.bg, color: s.color }}>
                      <Icon className="w-3 h-3" />
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: P.text }}>No payment history available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}