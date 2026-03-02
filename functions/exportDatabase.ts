import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Generate SQL INSERT statements
    const sqlStatements = [];

    // Users
    if (users.length > 0) {
      users.forEach(u => {
        const sql = `INSERT INTO users (id, email, full_name, role, department, created_date, updated_date) VALUES ('${u.id}', '${u.email.replace(/'/g, "''")}', '${(u.full_name || '').replace(/'/g, "''")}', '${u.role || 'user'}', '${(u.department || '').replace(/'/g, "''")}', '${u.created_date}', '${u.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Devices
    if (devices.length > 0) {
      devices.forEach(d => {
        const sql = `INSERT INTO devices (id, asset_tag, model, serial, brand, processor, ram, storage, screen_size, os, status, device_class, assigned_user, assigned_email, department, location, purchase_date, lease_start, lease_end, warranty_expiry, end_of_life_date, refresh_date, monthly_rate, condition_score, warranty, insurance, disposition_status, disposition_date, disposition_notes, warranty_alert_sent, eol_alert_sent, created_by, created_date, updated_date) VALUES ('${d.id}', '${d.asset_tag}', '${d.model.replace(/'/g, "''")}', '${(d.serial || '').replace(/'/g, "''")}', '${(d.brand || '').replace(/'/g, "''")}', '${(d.processor || '').replace(/'/g, "''")}', '${d.ram || ''}', '${d.storage || ''}', '${(d.screen_size || '').replace(/'/g, "''")}', '${(d.os || '').replace(/'/g, "''")}', '${d.status}', '${d.device_class || ''}', '${(d.assigned_user || '').replace(/'/g, "''")}', '${(d.assigned_email || '').replace(/'/g, "''")}', '${(d.department || '').replace(/'/g, "''")}', '${(d.location || '').replace(/'/g, "''")}', '${d.purchase_date || 'NULL'}', '${d.lease_start || 'NULL'}', '${d.lease_end || 'NULL'}', '${d.warranty_expiry || 'NULL'}', '${d.end_of_life_date || 'NULL'}', '${d.refresh_date || 'NULL'}', ${d.monthly_rate || 'NULL'}, ${d.condition_score || 'NULL'}, '${(d.warranty || '').replace(/'/g, "''")}', '${(d.insurance || '').replace(/'/g, "''")}', '${d.disposition_status}', '${d.disposition_date || 'NULL'}', '${(d.disposition_notes || '').replace(/'/g, "''")}', ${d.warranty_alert_sent}, ${d.eol_alert_sent}, '${(d.created_by || '').replace(/'/g, "''")}', '${d.created_date}', '${d.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Device Requests
    if (deviceRequests.length > 0) {
      deviceRequests.forEach(dr => {
        const accessoriesStr = dr.accessories ? `'${dr.accessories.map(a => a.replace(/'/g, "''")).join(',')}'` : 'NULL';
        const sql = `INSERT INTO device_requests (id, request_type, quantity, delivery_location, required_date, cost_center, approver, device_class, brand, processor, ram, storage, screen_size, os, accessories, service_bundle, status, notes, rejection_reason, estimated_monthly_cost, created_by, created_date, updated_date) VALUES ('${dr.id}', '${dr.request_type}', ${dr.quantity}, '${(dr.delivery_location || '').replace(/'/g, "''")}', '${dr.required_date || 'NULL'}', '${(dr.cost_center || '').replace(/'/g, "''")}', '${(dr.approver || '').replace(/'/g, "''")}', '${dr.device_class}', '${(dr.brand || '').replace(/'/g, "''")}', '${(dr.processor || '').replace(/'/g, "''")}', '${(dr.ram || '').replace(/'/g, "''")}', '${(dr.storage || '').replace(/'/g, "''")}', '${(dr.screen_size || '').replace(/'/g, "''")}', '${(dr.os || '').replace(/'/g, "''")}', ${accessoriesStr}, '${dr.service_bundle}', '${dr.status}', '${(dr.notes || '').replace(/'/g, "''")}', '${(dr.rejection_reason || '').replace(/'/g, "''")}', ${dr.estimated_monthly_cost || 'NULL'}, '${(dr.created_by || '').replace(/'/g, "''")}', '${dr.created_date}', '${dr.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Tickets
    if (tickets.length > 0) {
      tickets.forEach(t => {
        const sql = `INSERT INTO tickets (id, ticket_id, device_asset_tag, device_model, assigned_user, department, issue_type, severity, description, status, pickup_location, pickup_time, need_swap, resolution, technician, cost, covered, sla_target, resolved_date, created_by, created_date, updated_date) VALUES ('${t.id}', '${(t.ticket_id || '').replace(/'/g, "''")}', '${(t.device_asset_tag || '').replace(/'/g, "''")}', '${(t.device_model || '').replace(/'/g, "''")}', '${(t.assigned_user || '').replace(/'/g, "''")}', '${(t.department || '').replace(/'/g, "''")}', '${t.issue_type}', '${t.severity}', '${(t.description || '').replace(/'/g, "''")}', '${t.status}', '${(t.pickup_location || '').replace(/'/g, "''")}', '${(t.pickup_time || '').replace(/'/g, "''")}', ${t.need_swap}, '${(t.resolution || '').replace(/'/g, "''")}', '${(t.technician || '').replace(/'/g, "''")}', ${t.cost || 0}, ${t.covered}, '${(t.sla_target || '').replace(/'/g, "''")}', '${t.resolved_date || 'NULL'}', '${(t.created_by || '').replace(/'/g, "''")}', '${t.created_date}', '${t.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Insurance Claims
    if (claims.length > 0) {
      claims.forEach(c => {
        const sql = `INSERT INTO insurance_claims (id, claim_number, device_asset_tag, device_model, assigned_user, department, incident_type, incident_date, incident_location, incident_description, police_report_number, estimated_value, claim_amount, approved_amount, status, insurer_reference, rejection_reason, supporting_docs, notes, reviewed_by, resolved_date, requires_manager_approval, manager_approved, manager_approved_by, manager_approval_notes, manager_approval_date, created_by, created_date, updated_date) VALUES ('${c.id}', '${(c.claim_number || '').replace(/'/g, "''")}', '${c.device_asset_tag}', '${(c.device_model || '').replace(/'/g, "''")}', '${(c.assigned_user || '').replace(/'/g, "''")}', '${(c.department || '').replace(/'/g, "''")}', '${c.incident_type}', '${c.incident_date}', '${(c.incident_location || '').replace(/'/g, "''")}', '${(c.incident_description || '').replace(/'/g, "''")}', '${(c.police_report_number || '').replace(/'/g, "''")}', ${c.estimated_value || 'NULL'}, ${c.claim_amount || 'NULL'}, ${c.approved_amount || 'NULL'}, '${c.status}', '${(c.insurer_reference || '').replace(/'/g, "''")}', '${(c.rejection_reason || '').replace(/'/g, "''")}', '${(c.supporting_docs || '').replace(/'/g, "''")}', '${(c.notes || '').replace(/'/g, "''")}', '${(c.reviewed_by || '').replace(/'/g, "''")}', '${c.resolved_date || 'NULL'}', ${c.requires_manager_approval}, ${c.manager_approved}, '${(c.manager_approved_by || '').replace(/'/g, "''")}', '${(c.manager_approval_notes || '').replace(/'/g, "''")}', '${c.manager_approval_date || 'NULL'}', '${(c.created_by || '').replace(/'/g, "''")}', '${c.created_date}', '${c.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Notifications
    if (notifications.length > 0) {
      notifications.forEach(n => {
        const sql = `INSERT INTO notifications (id, user_email, title, message, type, read, link_page, created_by, created_date, updated_date) VALUES ('${n.id}', '${n.user_email}', '${(n.title || '').replace(/'/g, "''")}', '${(n.message || '').replace(/'/g, "''")}', '${n.type}', ${n.read}, '${(n.link_page || '').replace(/'/g, "''")}', '${(n.created_by || '').replace(/'/g, "''")}', '${n.created_date}', '${n.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Companies
    if (companies.length > 0) {
      companies.forEach(co => {
        const sql = `INSERT INTO companies (id, name, industry, size, country, city, phone, address, plan, onboarded, created_by, created_date, updated_date) VALUES ('${co.id}', '${co.name.replace(/'/g, "''")}', '${(co.industry || '').replace(/'/g, "''")}', '${(co.size || '').replace(/'/g, "''")}', '${(co.country || '').replace(/'/g, "''")}', '${(co.city || '').replace(/'/g, "''")}', '${(co.phone || '').replace(/'/g, "''")}', '${(co.address || '').replace(/'/g, "''")}', '${co.plan}', ${co.onboarded}, '${(co.created_by || '').replace(/'/g, "''")}', '${co.created_date}', '${co.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Audit Logs
    if (auditLogs.length > 0) {
      auditLogs.forEach(al => {
        const sql = `INSERT INTO audit_logs (id, action, entity_type, entity_id, entity_label, user_email, user_name, details, old_value, new_value, created_by, created_date, updated_date) VALUES ('${al.id}', '${al.action}', '${al.entity_type}', '${(al.entity_id || '').replace(/'/g, "''")}', '${(al.entity_label || '').replace(/'/g, "''")}', '${al.user_email}', '${(al.user_name || '').replace(/'/g, "''")}', '${(al.details || '').replace(/'/g, "''")}', '${(al.old_value || '').replace(/'/g, "''")}', '${(al.new_value || '').replace(/'/g, "''")}', '${(al.created_by || '').replace(/'/g, "''")}', '${al.created_date}', '${al.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Invoices
    if (invoices.length > 0) {
      invoices.forEach(inv => {
        const sql = `INSERT INTO invoices (id, invoice_id, month, issue_date, due_date, amount, status, paid_amount, paid_date, payment_method, stripe_session_id, stripe_subscription_id, customer_email, customer_name, reminder_sent_before, reminder_sent_after, created_by, created_date, updated_date) VALUES ('${inv.id}', '${(inv.invoice_id || '').replace(/'/g, "''")}', '${(inv.month || '').replace(/'/g, "''")}', '${inv.issue_date}', '${inv.due_date}', ${inv.amount}, '${inv.status}', ${inv.paid_amount || 'NULL'}, '${inv.paid_date || 'NULL'}', '${(inv.payment_method || '').replace(/'/g, "''")}', '${(inv.stripe_session_id || '').replace(/'/g, "''")}', '${(inv.stripe_subscription_id || '').replace(/'/g, "''")}', '${(inv.customer_email || '').replace(/'/g, "''")}', '${(inv.customer_name || '').replace(/'/g, "''")}', ${inv.reminder_sent_before}, ${inv.reminder_sent_after}, '${(inv.created_by || '').replace(/'/g, "''")}', '${inv.created_date}', '${inv.updated_date}');`;
        sqlStatements.push(sql);
      });
    }

    // Create export file content
    const sqlContent = sqlStatements.join('\n');
    const csvExport = {
      devices: devices.length,
      deviceRequests: deviceRequests.length,
      tickets: tickets.length,
      insuranceClaims: claims.length,
      notifications: notifications.length,
      companies: companies.length,
      auditLogs: auditLogs.length,
      invoices: invoices.length,
      users: users.length,
      totalRecords: devices.length + deviceRequests.length + tickets.length + claims.length + notifications.length + companies.length + auditLogs.length + invoices.length + users.length,
      exportDate: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      summary: csvExport,
      sqlStatements: sqlStatements.length,
      message: 'Database export generated. Copy the SQL statements to Supabase SQL Editor.',
      sqlFile: sqlContent,
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});