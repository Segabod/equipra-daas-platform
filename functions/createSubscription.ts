import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name, invoiceId, monthlyAmountNGN } = await req.json();

    if (!email || !monthlyAmountNGN) {
      return Response.json({ error: 'email and monthlyAmountNGN are required' }, { status: 400 });
    }

    // Convert NGN to USD (approx 1 USD = 1500 NGN) for Stripe
    const amountInCents = Math.round((monthlyAmountNGN / 1500) * 100);

    // Create or retrieve customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({ email, name });
    }

    // Create a recurring price
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: amountInCents,
      recurring: { interval: 'month' },
      product_data: { name: 'EquipraAfrica DaaS Monthly Subscription' },
    });

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/Billing?subscription=success&invoice=${invoiceId || ''}`,
      cancel_url: `${origin}/Billing?subscription=cancelled`,
      metadata: {
        invoice_id: invoiceId || '',
        customer_email: email,
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    console.log('Subscription session created:', session.id, 'for', email);
    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Create subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});