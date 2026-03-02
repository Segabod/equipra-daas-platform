import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper to convert array of objects to CSV
function toCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  // Escape CSV values
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const csv = [headers.join(',')];
  data.forEach(row => {
    csv.push(headers.map(h => escapeCSV(row[h])).join(','));
  });
  return csv.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch all data from each entity
    const [devices, deviceRequests, tickets, claims, notifications, companies, auditLogs, invoices, users] = await Promise.all([
      base44.entities.Device.list().catch(() => []),
      base44.entities.DeviceRequest.list().catch(() => []),
      base44.entities.Ticket.list().catch(() => []),
      base44.entities.InsuranceClaim.list().catch(() => []),
      base44.entities.Notification.list().catch(() => []),
      base44.entities.Company.list().catch(() => []),
      base44.entities.AuditLog.list().catch(() => []),
      base44.entities.Invoice.list().catch(() => []),
      base44.entities.User.list().catch(() => []),
    ]);

    // Generate CSV for each entity
    const csvFiles = {};

    if (users.length > 0) {
      const headers = ['id', 'email', 'full_name', 'role', 'department', 'created_date', 'updated_date'];
      csvFiles.users = toCSV(users, headers);
    }

    if (devices.length > 0) {
      const headers = ['id', 'asset_tag', 'model', 'serial', 'brand', 'processor', 'ram', 'storage', 'screen_size', 'os', 'status', 'device_class', 'assigned_user', 'assigned_email', 'department', 'location', 'purchase_date', 'lease_start', 'lease_end', 'warranty_expiry', 'end_of_life_date', 'refresh_date', 'monthly_rate', 'condition_score', 'warranty', 'insurance', 'disposition_status', 'disposition_date', 'disposition_notes', 'warranty_alert_sent', 'eol_alert_sent', 'created_by', 'created_date', 'updated_date'];
      csvFiles.devices = toCSV(devices, headers);
    }

    if (deviceRequests.length > 0) {
      const headers = ['id', 'request_type', 'quantity', 'delivery_location', 'required_date', 'cost_center', 'approver', 'device_class', 'brand', 'processor', 'ram', 'storage', 'screen_size', 'os', 'accessories', 'service_bundle', 'status', 'notes', 'rejection_reason', 'estimated_monthly_cost', 'created_by', 'created_date', 'updated_date'];
      csvFiles.device_requests = toCSV(deviceRequests, headers);
    }

    if (tickets.length > 0) {
      const headers = ['id', 'ticket_id', 'device_asset_tag', 'device_model', 'assigned_user', 'department', 'issue_type', 'severity', 'description', 'status', 'pickup_location', 'pickup_time', 'need_swap', 'resolution', 'technician', 'cost', 'covered', 'sla_target', 'resolved_date', 'created_by', 'created_date', 'updated_date'];
      csvFiles.tickets = toCSV(tickets, headers);
    }

    if (claims.length > 0) {
      const headers = ['id', 'claim_number', 'device_asset_tag', 'device_model', 'assigned_user', 'department', 'incident_type', 'incident_date', 'incident_location', 'incident_description', 'police_report_number', 'estimated_value', 'claim_amount', 'approved_amount', 'status', 'insurer_reference', 'rejection_reason', 'supporting_docs', 'notes', 'reviewed_by', 'resolved_date', 'requires_manager_approval', 'manager_approved', 'manager_approved_by', 'manager_approval_notes', 'manager_approval_date', 'created_by', 'created_date', 'updated_date'];
      csvFiles.insurance_claims = toCSV(claims, headers);
    }

    if (notifications.length > 0) {
      const headers = ['id', 'user_email', 'title', 'message', 'type', 'read', 'link_page', 'created_by', 'created_date', 'updated_date'];
      csvFiles.notifications = toCSV(notifications, headers);
    }

    if (companies.length > 0) {
      const headers = ['id', 'name', 'industry', 'size', 'country', 'city', 'phone', 'address', 'plan', 'onboarded', 'created_by', 'created_date', 'updated_date'];
      csvFiles.companies = toCSV(companies, headers);
    }

    if (auditLogs.length > 0) {
      const headers = ['id', 'action', 'entity_type', 'entity_id', 'entity_label', 'user_email', 'user_name', 'details', 'old_value', 'new_value', 'created_by', 'created_date', 'updated_date'];
      csvFiles.audit_logs = toCSV(auditLogs, headers);
    }

    if (invoices.length > 0) {
      const headers = ['id', 'invoice_id', 'month', 'issue_date', 'due_date', 'amount', 'status', 'paid_amount', 'paid_date', 'payment_method', 'stripe_session_id', 'stripe_subscription_id', 'customer_email', 'customer_name', 'reminder_sent_before', 'reminder_sent_after', 'created_by', 'created_date', 'updated_date'];
      csvFiles.invoices = toCSV(invoices, headers);
    }

    const summary = {
      users: users.length,
      devices: devices.length,
      deviceRequests: deviceRequests.length,
      tickets: tickets.length,
      insuranceClaims: claims.length,
      notifications: notifications.length,
      companies: companies.length,
      auditLogs: auditLogs.length,
      invoices: invoices.length,
      totalRecords: Object.values([users, devices, deviceRequests, tickets, claims, notifications, companies, auditLogs, invoices]).flat().length,
      exportDate: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      summary,
      csvFiles,
      message: 'Database export as CSV ready for download',
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});