Deno.serve(async (req) => {
  try {
    const { invoiceId, amount, email, description } = await req.json();

    if (!invoiceId || !amount) {
      return Response.json({ error: 'invoiceId and amount are required' }, { status: 400 });
    }

    // Paystack expects amount in kobo (1 NGN = 100 kobo)
    const amountInKobo = Math.round(amount * 100);
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || 'billing@equipraafrica.ng',
        amount: amountInKobo,
        currency: 'NGN',
        reference: `${invoiceId}-${Date.now()}`,
        callback_url: `${origin}/Billing?payment=success&invoice=${invoiceId}`,
        metadata: {
          invoice_id: invoiceId,
          description: description || invoiceId,
          cancel_action: `${origin}/Billing`,
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack error:', data.message);
      return Response.json({ error: data.message }, { status: 400 });
    }

    return Response.json({ url: data.data.authorization_url, reference: data.data.reference });
  } catch (error) {
    console.error('Paystack checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});