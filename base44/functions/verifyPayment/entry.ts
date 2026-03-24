import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.12.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-15.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, subscriptionId } = await req.json();

    if (!sessionId && !subscriptionId) {
      return Response.json({ error: 'Missing sessionId or subscriptionId' }, { status: 400 });
    }

    let session = null;
    let subscription = null;
    let amount = 0;

    // Verify session or subscription with Stripe
    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return Response.json({ error: 'Payment not completed' }, { status: 400 });
      }
      amount = session.amount_total / 100; // Convert from cents
    } else if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        return Response.json({ error: 'Subscription not active' }, { status: 400 });
      }
      // Get the amount from the subscription's price
      if (subscription.items.data.length > 0) {
        amount = subscription.items.data[0].price.unit_amount / 100;
      }
    }

    // Find or create invoice
    const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({
      stripe_session_id: sessionId,
      stripe_subscription_id: subscriptionId,
    }, '-created_date', 1);

    let invoiceId = null;
    if (existingInvoices.length > 0) {
      invoiceId = existingInvoices[0].id;
      // Update existing invoice
      await base44.asServiceRole.entities.Invoice.update(invoiceId, {
        status: 'paid',
        paid_amount: amount,
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'stripe',
      });
    } else {
      // Create new invoice
      const invoiceData = {
        invoice_id: `INV-${Date.now()}`,
        month: new Date().toISOString().slice(0, 7),
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount,
        status: 'paid',
        paid_amount: amount,
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'stripe',
        customer_email: user.email,
        customer_name: user.full_name || user.email,
      };

      if (sessionId) invoiceData.stripe_session_id = sessionId;
      if (subscriptionId) invoiceData.stripe_subscription_id = subscriptionId;

      const invoice = await base44.asServiceRole.entities.Invoice.create(invoiceData);
      invoiceId = invoice.id;
    }

    return Response.json({
      success: true,
      invoiceId,
      amount,
      status: 'paid',
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});