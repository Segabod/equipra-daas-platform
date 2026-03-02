import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { monthlyAmount, currency = 'NGN', description } = body;

    if (!monthlyAmount || monthlyAmount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create or get customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
        },
      });
      customerId = customer.id;
    }

    // Create price for subscription
    const product = await stripe.products.create({
      name: description || 'Monthly Device Service Subscription',
      type: 'service',
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(monthlyAmount * 100),
      currency: currency.toLowerCase(),
      recurring: {
        interval: 'month',
      },
    });

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/Billing?subscription_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/Billing`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
      },
    });

    return Response.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      priceId: price.id,
    });
  } catch (error) {
    console.error('Stripe subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});