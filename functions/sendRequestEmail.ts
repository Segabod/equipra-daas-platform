import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Approver email mapping
const APPROVER_EMAILS = {
  'Amaka Okafor - CFO': 'amaka.okafor@equipraafrica.ng',
  'Bola Adebayo - Head of HR': 'bola.adebayo@equipraafrica.ng',
  'Chidi Nwosu - IT Manager': 'chidi.nwosu@equipraafrica.ng',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event, requestData } = await req.json();

    if (event === 'submitted') {
      // Notify the approver
      const approverEmail = APPROVER_EMAILS[requestData.approver];
      if (approverEmail) {
        await base44.integrations.Core.SendEmail({
          to: approverEmail,
          subject: `New Device Request Awaiting Your Approval — REQ-${requestData.id?.slice(-4)?.toUpperCase()}`,
          body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2E3440;">
  <div style="background-color: #0B1F3A; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">EquipraAfrica DaaS Platform</h1>
    <p style="color: #0FA3B1; margin: 4px 0 0; font-size: 14px;">New Request Pending Your Approval</p>
  </div>
  <div style="background-color: #F7F9FC; padding: 24px; border: 1px solid #E1E6EF;">
    <p>Hi ${requestData.approver?.split(' - ')[0]},</p>
    <p>A new device request has been submitted and requires your approval.</p>
    <div style="background: white; border: 1px solid #E1E6EF; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #6B7280;">Request ID</td><td style="font-weight: bold; color: #0B1F3A;">REQ-${requestData.id?.slice(-4)?.toUpperCase()}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Submitted By</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.created_by || user.email}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Request Type</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.request_type?.replace('_', ' ')}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Device Class</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.device_class}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Quantity</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.quantity}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Delivery Location</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.delivery_location}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Est. Monthly Cost</td><td style="font-weight: bold; color: #D4AF37;">₦${(requestData.estimated_monthly_cost || 0).toLocaleString()}</td></tr>
      </table>
    </div>
    <p style="font-size: 13px; color: #6B7280;">Please log in to the EquipraAfrica platform to review and approve or reject this request.</p>
  </div>
  <div style="background-color: #0B1F3A; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">© 2026 EquipraAfrica DaaS Platform</p>
  </div>
</div>`.trim(),
        });
      }

      // Also notify the requestor (confirmation)
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Your Device Request Has Been Submitted — REQ-${requestData.id?.slice(-4)?.toUpperCase()}`,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2E3440;">
  <div style="background-color: #0B1F3A; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">EquipraAfrica DaaS Platform</h1>
    <p style="color: #0FA3B1; margin: 4px 0 0; font-size: 14px;">Request Submitted Successfully</p>
  </div>
  <div style="background-color: #F7F9FC; padding: 24px; border: 1px solid #E1E6EF;">
    <p>Hi ${user.full_name || user.email},</p>
    <p>Your device request has been submitted and is now <strong>pending approval</strong> from ${requestData.approver}.</p>
    <div style="background: white; border: 1px solid #E1E6EF; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #6B7280;">Request ID</td><td style="font-weight: bold; color: #0B1F3A;">REQ-${requestData.id?.slice(-4)?.toUpperCase()}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Request Type</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.request_type?.replace('_', ' ')}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Device Class</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.device_class}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Quantity</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.quantity}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Approver</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.approver}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Est. Monthly Cost</td><td style="font-weight: bold; color: #D4AF37;">₦${(requestData.estimated_monthly_cost || 0).toLocaleString()}</td></tr>
      </table>
    </div>
    <p style="font-size: 13px; color: #6B7280;">You will receive another email once your request has been reviewed. You can also track the status in the platform under <em>Request History</em>.</p>
  </div>
  <div style="background-color: #0B1F3A; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">© 2026 EquipraAfrica DaaS Platform</p>
  </div>
</div>`.trim(),
      });
    }

    if (event === 'status_changed') {
      // Notify the requestor of the new status
      const isApproved = requestData.newStatus === 'approved';
      const isRejected = requestData.newStatus === 'rejected';
      const statusLabel = requestData.newStatus?.replace(/_/g, ' ');

      await base44.integrations.Core.SendEmail({
        to: requestData.requestorEmail,
        subject: `Your Device Request Has Been ${isApproved ? 'Approved ✅' : isRejected ? 'Rejected ❌' : `Updated: ${statusLabel}`} — REQ-${requestData.id?.slice(-4)?.toUpperCase()}`,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2E3440;">
  <div style="background-color: #0B1F3A; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">EquipraAfrica DaaS Platform</h1>
    <p style="color: #0FA3B1; margin: 4px 0 0; font-size: 14px;">Request Status Update</p>
  </div>
  <div style="background-color: #F7F9FC; padding: 24px; border: 1px solid #E1E6EF;">
    <p>Hi,</p>
    <p>Your device request <strong>REQ-${requestData.id?.slice(-4)?.toUpperCase()}</strong> has been <strong style="color: ${isApproved ? '#059669' : isRejected ? '#DC2626' : '#2563EB'};">${statusLabel}</strong>.</p>
    <div style="background: white; border-left: 4px solid ${isApproved ? '#059669' : isRejected ? '#DC2626' : '#2563EB'}; border-radius: 4px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 15px; font-weight: bold; color: ${isApproved ? '#059669' : isRejected ? '#DC2626' : '#2563EB'};">
        ${isApproved ? '✅ Request Approved' : isRejected ? '❌ Request Rejected' : `ℹ️ Status: ${statusLabel}`}
      </p>
      ${isRejected && requestData.rejectionReason ? `<p style="margin: 8px 0 0; font-size: 13px; color: #6B7280;">Reason: ${requestData.rejectionReason}</p>` : ''}
    </div>
    <div style="background: white; border: 1px solid #E1E6EF; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #6B7280;">Request ID</td><td style="font-weight: bold; color: #0B1F3A;">REQ-${requestData.id?.slice(-4)?.toUpperCase()}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Device Class</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.device_class}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Quantity</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.quantity}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B7280;">Reviewed By</td><td style="font-weight: bold; color: #0B1F3A;">${requestData.approver || '—'}</td></tr>
      </table>
    </div>
    <p style="font-size: 13px; color: #6B7280;">Log in to the EquipraAfrica platform to view full details under <em>Request History</em>.</p>
  </div>
  <div style="background-color: #0B1F3A; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">© 2026 EquipraAfrica DaaS Platform</p>
  </div>
</div>`.trim(),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendRequestEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});