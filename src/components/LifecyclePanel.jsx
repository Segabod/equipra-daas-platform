import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Calendar, AlertTriangle, CheckCircle, RefreshCw, FileText, Bell, ArrowRight, Clock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr) - new Date()) / 864e5);
}

function DateStatusBadge({ days, label }) {
  if (days === null) return <span className="text-xs" style={{ color: P.text }}>Not set</span>;
  if (days < 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Expired {Math.abs(days)}d ago</span>;
  if (days <= 30) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Expires in {days}d</span>;
  if (days <= 90) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Expires in {days}d</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Active · {days}d left</span>;
}

export default function LifecyclePanel({ device, onRefresh }) {
  const [loading, setLoading] = useState('');
  const navigate = useNavigate();

  const leaseDays = daysUntil(device.lease_end);
  const warrantyDays = daysUntil(device.warranty_expiry);
  const refreshDays = daysUntil(device.refresh_date);
  const eolDays = daysUntil(device.end_of_life_date);

  const lifecycleItems = [
    {
      label: 'Lease End',
      value: device.lease_end ? new Date(device.lease_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      days: leaseDays,
      icon: FileText,
      action: 'renew_lease',
      actionLabel: 'Initiate Renewal',
    },
    {
      label: 'Warranty Expiry',
      value: device.warranty_expiry ? new Date(device.warranty_expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (device.warranty || null),
      days: warrantyDays,
      icon: Shield,
      action: 'warranty_renewal',
      actionLabel: 'Renew Warranty',
    },
    {
      label: 'Insurance',
      value: device.insurance || null,
      days: null,
      icon: Shield,
      action: null,
      actionLabel: null,
    },
    {
      label: 'Refresh Due',
      value: device.refresh_date ? new Date(device.refresh_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      days: refreshDays,
      icon: RefreshCw,
      action: 'replacement',
      actionLabel: 'Request Replacement',
    },
    {
      label: 'End-of-Life',
      value: device.end_of_life_date ? new Date(device.end_of_life_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      days: eolDays,
      icon: AlertTriangle,
      action: 'replacement',
      actionLabel: 'Plan Disposition',
    },
  ];

  const handleNotify = async (item) => {
    setLoading('notify_' + item.label);
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.Notification.create({
      user_email: user?.email || 'admin',
      title: `${item.label} Reminder — ${device.model}`,
      message: `${item.label} for ${device.model} (${device.asset_tag}) is ${item.days < 0 ? 'expired' : `expiring in ${item.days} days`}. Action required.`,
      type: 'refresh_warning',
      link_page: 'Devices',
    });
    setLoading('');
    alert('Reminder notification sent!');
  };

  const handleAction = async (item) => {
    setLoading('action_' + item.label);
    const user = await base44.auth.me().catch(() => null);
    if (item.action === 'replacement') {
      await base44.entities.DeviceRequest.create({
        request_type: 'replacement',
        quantity: 1,
        delivery_location: device.location || 'Lagos HQ - Victoria Island',
        device_class: device.device_class || 'standard',
        brand: device.brand,
        notes: `Replacement for ${device.model} (${device.asset_tag}) — refresh due: ${device.refresh_date}`,
        status: 'pending_approval',
        approver: 'Amaka Okafor - CFO',
      });
      await base44.entities.Notification.create({
        user_email: user?.email || 'admin',
        title: 'Replacement Request Created',
        message: `A replacement request for ${device.model} (${device.asset_tag}) has been submitted for approval.`,
        type: 'request_submitted',
        link_page: 'RequestHistory',
      });
      alert('Replacement request submitted for approval!');
    } else if (item.action === 'renew_lease' || item.action === 'warranty_renewal') {
      await base44.entities.Ticket.create({
        device_asset_tag: device.asset_tag,
        device_model: device.model,
        assigned_user: device.assigned_user,
        department: device.department,
        issue_type: 'preventive',
        severity: 'medium',
        description: `${item.label} renewal required for ${device.model} (${device.asset_tag}). ${item.label} ${item.days < 0 ? 'expired' : `expires in ${item.days} days`}.`,
        status: 'open',
      });
      await base44.entities.Notification.create({
        user_email: user?.email || 'admin',
        title: `${item.label} Renewal Ticket Created`,
        message: `A support ticket for ${item.label} renewal of ${device.model} has been created.`,
        type: 'device_repair',
        link_page: 'Tickets',
      });
      alert('Renewal ticket created and notification sent!');
    }
    setLoading('');
    if (onRefresh) onRefresh();
  };

  const urgentCount = lifecycleItems.filter(i => i.days !== null && i.days <= 30).length;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: P.teal }} />
          <h3 className="font-bold" style={{ color: P.navy }}>Lifecycle & Coverage</h3>
        </div>
        {urgentCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
            {urgentCount} urgent
          </span>
        )}
      </div>
      <div className="divide-y" style={{ borderColor: P.border }}>
        {lifecycleItems.map((item, i) => {
          const Icon = item.icon;
          const isUrgent = item.days !== null && item.days <= 30;
          return (
            <div key={i} className="p-4" style={{ backgroundColor: isUrgent ? '#FFF5F5' : 'white' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isUrgent ? '#FEE2E2' : P.bg }}>
                    <Icon className="w-4 h-4" style={{ color: isUrgent ? '#EF4444' : P.teal }} />
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-0.5" style={{ color: P.text }}>{item.label}</div>
                    <div className="text-sm font-semibold mb-1" style={{ color: P.navy }}>{item.value || '—'}</div>
                    <DateStatusBadge days={item.days} label={item.label} />
                  </div>
                </div>
                {item.days !== null && item.days <= 90 && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleNotify(item)} disabled={!!loading} className="p-1.5 rounded-lg border text-xs" style={{ borderColor: P.border }} title="Send reminder notification">
                      <Bell className="w-3.5 h-3.5" style={{ color: P.text }} />
                    </button>
                    {item.actionLabel && (
                      <button onClick={() => handleAction(item)} disabled={!!loading} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1 disabled:opacity-60" style={{ backgroundColor: P.teal }}>
                        {loading === 'action_' + item.label ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                        {item.actionLabel}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Lease start / purchased info */}
      {(device.lease_start) && (
        <div className="p-4 text-xs flex gap-6" style={{ backgroundColor: P.bg, borderTop: `1px solid ${P.border}` }}>
          {device.lease_start && <div><span style={{ color: P.text }}>Lease Start: </span><span className="font-semibold" style={{ color: P.navy }}>{new Date(device.lease_start).toLocaleDateString()}</span></div>}
        </div>
      )}
    </div>
  );
}