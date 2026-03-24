import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { invoiceId, amount, description, currency } = await req.json();

    if (!invoiceId || !amount) {
      return Response.json({ error: 'invoiceId and amount are required' }, { status: 400 });
    }

    // Stripe amounts are in smallest currency unit (kobo for NGN, cents for USD)
    // Since Stripe doesn't support NGN, we'll use USD with a converted amount
    // We convert ₦ amount to USD equivalent for demo (1 USD = 1500 NGN approx)
    const amountInCents = Math.round((amount / 1500) * 100);

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'usd',
            product_data: {
              name: `EquipraAfrica Invoice`,
              description: description || invoiceId,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/billing?payment=success&invoice=${invoiceId}`,
      cancel_url: `${origin}/billing?payment=cancelled&invoice=${invoiceId}`,
      metadata: {
        invoice_id: invoiceId,
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});