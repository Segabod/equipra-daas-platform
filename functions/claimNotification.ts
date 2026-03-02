import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STATUS_LABELS = {
  draft:                    'Draft',
  submitted:                'Submitted',
  under_review:             'Under Review',
  pending_manager_approval: 'Pending Manager Approval',
  approved:                 'Approved',
  rejected:                 'Rejected',
  paid:                     'Paid',
  withdrawn:                'Withdrawn',
};

const STATUS_MESSAGES = {
  submitted:                'Your claim has been successfully submitted and is awaiting review by our team.',
  under_review:             'Your claim is currently being reviewed by our insurance team. We will update you shortly.',
  pending_manager_approval: 'Your claim requires manager approval due to the high estimated value. A manager has been notified.',
  approved:                 'Great news! Your insurance claim has been approved. Our team will be in touch regarding next steps.',
  rejected:                 'Unfortunately, your insurance claim has been rejected. Please see the rejection reason for details.',
  paid:                     'Your insurance claim has been processed and payment has been issued.',
  withdrawn:                'Your insurance claim has been marked as withdrawn.',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { claimId, newStatus, claimNumber, deviceModel, deviceAssetTag, assignedUser, assignedEmail, rejectionReason } = await req.json();

    if (!claimId || !newStatus || !claimNumber) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const statusMessage = STATUS_MESSAGES[newStatus] || `Your claim status has been updated to ${statusLabel}.`;
    const results = { inApp: false, email: false };

    // ── IN-APP NOTIFICATION to claimant ──
    const claimantEmail = assignedEmail || assignedUser; // use email if available, else username
    if (claimantEmail && claimantEmail.includes('@')) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: claimantEmail,
        title: `Claim ${claimNumber} — ${statusLabel}`,
        message: `${statusMessage}${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
        type: 'request_status_change',
        link_page: 'InsuranceClaims',
        read: false,
      });
      results.inApp = true;
    }

    // ── IN-APP NOTIFICATION to internal IT/admin stakeholders ──
    // Notify admins and it_admins about the status change
    const stakeholderStatuses = ['submitted', 'under_review', 'pending_manager_approval', 'approved', 'rejected', 'paid'];
    if (stakeholderStatuses.includes(newStatus)) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const stakeholders = allUsers.filter(u =>
        ['admin', 'it_admin', 'manager'].includes(u.role) &&
        u.email !== claimantEmail
      );
      for (const stakeholder of stakeholders) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: stakeholder.email,
          title: `Claim ${claimNumber} → ${statusLabel}`,
          message: `${deviceModel} (${deviceAssetTag}) — ${assignedUser || 'Unknown user'}. ${newStatus === 'rejected' && rejectionReason ? `Reason: ${rejectionReason}` : statusMessage}`,
          type: 'request_status_change',
          link_page: 'InsuranceClaims',
          read: false,
        });
      }
      results.stakeholdersNotified = stakeholders.length;
    }

    // ── EMAIL to claimant ──
    if (claimantEmail && claimantEmail.includes('@')) {
      const emailBody = `
Dear ${assignedUser || 'Claimant'},

We are writing to inform you that the status of your insurance claim has been updated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claim Number:   ${claimNumber}
Device:         ${deviceModel} (${deviceAssetTag})
New Status:     ${statusLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${statusMessage}
${rejectionReason ? `\nRejection Reason:\n${rejectionReason}\n` : ''}
If you have any questions or need further assistance, please contact the IT team or respond to this email.

Best regards,
EquipraAfrica Insurance Team
claims@equipraafrica.ng
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: claimantEmail,
        subject: `[EquipraAfrica] Claim ${claimNumber} — Status: ${statusLabel}`,
        body: emailBody,
        from_name: 'EquipraAfrica Insurance',
      });
      results.email = true;
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('claimNotification error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});