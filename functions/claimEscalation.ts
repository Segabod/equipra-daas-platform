import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const REVIEW_THRESHOLD_DAYS = 3;
const VALUE_THRESHOLD = 750000; // ₦750,000

function isBusinessDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

function businessDaysDifference(startDate, endDate) {
  let count = 0;
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all claims
    const allClaims = await base44.asServiceRole.entities.InsuranceClaim.list('-created_date', 500);
    const now = new Date();
    const results = { escalatedOldReviews: [], escalatedHighValue: [] };

    // ── Check 1: Claims in "under_review" for >3 business days ──
    const oldReviewClaims = allClaims.filter(c => {
      if (c.status !== 'under_review' || !c.created_date) return false;
      const createdDate = new Date(c.created_date);
      const daysDiff = businessDaysDifference(createdDate, now);
      return daysDiff > REVIEW_THRESHOLD_DAYS;
    });

    for (const claim of oldReviewClaims) {
      // Update claim to mark as escalated
      await base44.asServiceRole.entities.InsuranceClaim.update(claim.id, {
        notes: (claim.notes || '') + `\n[AUTO-ESCALATED ${new Date().toISOString().split('T')[0]}] Claim has been in review for >3 business days.`,
      });

      // Notify admins and managers
      const allUsers = await base44.asServiceRole.entities.User.list();
      const stakeholders = allUsers.filter(u => ['admin', 'it_admin', 'manager'].includes(u.role));
      for (const stakeholder of stakeholders) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: stakeholder.email,
          title: `⏰ Claim ${claim.claim_number} — Escalation Needed`,
          message: `Claim for ${claim.device_model} (${claim.device_asset_tag}) assigned to ${claim.assigned_user} has been under review for >3 business days. Please review and take action.`,
          type: 'request_status_change',
          link_page: 'InsuranceClaims',
          read: false,
        });
      }
      results.escalatedOldReviews.push(claim.claim_number);
    }

    // ── Check 2: High-value claims (≥₦750,000) not yet routed to manager approval ──
    const highValueClaims = allClaims.filter(c => {
      const isHighValue = c.estimated_value && Number(c.estimated_value) >= VALUE_THRESHOLD;
      const notRouted = c.status !== 'pending_manager_approval' && !c.requires_manager_approval;
      return isHighValue && notRouted;
    });

    for (const claim of highValueClaims) {
      // Update claim to require manager approval
      await base44.asServiceRole.entities.InsuranceClaim.update(claim.id, {
        requires_manager_approval: true,
        status: 'pending_manager_approval',
        notes: (claim.notes || '') + `\n[AUTO-ROUTED ${new Date().toISOString().split('T')[0]}] High-value claim (₦${Number(claim.estimated_value).toLocaleString()}) automatically routed for manager approval.`,
      });

      // Notify admins and managers with email
      const allUsers = await base44.asServiceRole.entities.User.list();
      const stakeholders = allUsers.filter(u => ['admin', 'it_admin', 'manager'].includes(u.role));
      for (const stakeholder of stakeholders) {
        // In-app notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: stakeholder.email,
          title: `💰 Claim ${claim.claim_number} — Manager Approval Required`,
          message: `High-value claim for ${claim.device_model} (${claim.device_asset_tag}) assigned to ${claim.assigned_user}. Estimated value: ₦${Number(claim.estimated_value).toLocaleString()}. Awaiting your approval.`,
          type: 'request_status_change',
          link_page: 'InsuranceClaims',
          read: false,
        });

        // Email notification
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: stakeholder.email,
          subject: `[EquipraAfrica] High-Value Claim ${claim.claim_number} — Manager Approval Required`,
          body: `
Dear ${stakeholder.full_name || 'Manager'},

A high-value insurance claim requires your immediate attention and approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claim Number:      ${claim.claim_number}
Device:            ${claim.device_model} (${claim.device_asset_tag})
Claimant:          ${claim.assigned_user}
Department:        ${claim.department}
Estimated Value:   ₦${Number(claim.estimated_value).toLocaleString()}
Incident Type:     ${claim.incident_type}
Incident Date:     ${claim.incident_date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Description:
${claim.incident_description}

This claim has been automatically routed to you because the estimated value exceeds the approval threshold of ₦750,000.

Please review the claim details and either approve or reject it in the claims management system.

Best regards,
EquipraAfrica Claims System
          `.trim(),
          from_name: 'EquipraAfrica Claims',
        });
      }
      results.escalatedHighValue.push(claim.claim_number);
    }

    console.log('Claim escalation completed:', results);
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('claimEscalation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});