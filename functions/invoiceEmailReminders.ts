import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to access invoices
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ status: 'pending' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let remindersSent = 0;

    for (const invoice of invoices) {
      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

      // 3 days BEFORE due date reminder
      if (diffDays === 3 && !invoice.reminder_sent_before) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: invoice.customer_email || 'billing@equipraafrica.ng',
          subject: `⏰ Reminder: Invoice ${invoice.invoice_id} due in 3 days`,
          body: `
Dear ${invoice.customer_name || 'Valued Customer'},

This is a friendly reminder that invoice <strong>${invoice.invoice_id}</strong> for <strong>₦${Number(invoice.amount).toLocaleString()}</strong> is due on <strong>${new Date(invoice.due_date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.

Please ensure payment is made before the due date to avoid any service disruptions.

To view and pay your invoice, please log in to your EquipraAfrica portal.

Thank you for your business.

Best regards,
EquipraAfrica Billing Team
billing@equipraafrica.ng
          `.trim(),
        });

        await base44.asServiceRole.entities.Invoice.update(invoice.id, { reminder_sent_before: true });
        remindersSent++;
        console.log(`Pre-due reminder sent for invoice ${invoice.invoice_id}`);
      }

      // 2 days AFTER due date (overdue) reminder
      if (diffDays === -2 && !invoice.reminder_sent_after) {
        // Mark as overdue
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          status: 'overdue',
          reminder_sent_after: true,
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: invoice.customer_email || 'billing@equipraafrica.ng',
          subject: `🚨 Overdue: Invoice ${invoice.invoice_id} payment required`,
          body: `
Dear ${invoice.customer_name || 'Valued Customer'},

Your invoice <strong>${invoice.invoice_id}</strong> for <strong>₦${Number(invoice.amount).toLocaleString()}</strong> was due on <strong>${new Date(invoice.due_date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> and is now <strong>2 days overdue</strong>.

Please make payment immediately to avoid service interruption.

If you have already made payment, please disregard this notice and contact us with your payment reference.

Best regards,
EquipraAfrica Billing Team
billing@equipraafrica.ng
          `.trim(),
        });

        remindersSent++;
        console.log(`Overdue reminder sent for invoice ${invoice.invoice_id}`);
      }
    }

    return Response.json({ success: true, remindersSent, invoicesChecked: invoices.length });
  } catch (error) {
    console.error('Invoice reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});