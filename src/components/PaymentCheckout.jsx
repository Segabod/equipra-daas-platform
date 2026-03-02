import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function PaymentCheckout({ amount, description, requestId, type = 'one-time', onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const functionName = type === 'subscription' ? 'stripeSubscription' : 'stripeCheckout';
      const payload = type === 'subscription' 
        ? { monthlyAmount: amount, description }
        : { amount, description, requestId };

      const response = await base44.functions.invoke(functionName, payload);

      if (response.data.success && response.data.url) {
        // Check if running in iframe
        if (window.self !== window.top) {
          alert('⚠️ Checkout works best when the app is published. Please use the published version to complete payments.');
          setLoading(false);
          return;
        }
        
        window.location.href = response.data.url;
        if (onSuccess) onSuccess();
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F7F9FC', border: '1px solid #E1E6EF' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: '#2E3440' }}>
            {type === 'subscription' ? 'Monthly Subscription' : 'One-time Payment'}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#0B1F3A' }}>
            ₦{amount.toLocaleString('en-NG')}
            {type === 'subscription' && <span className="text-sm font-normal">/mo</span>}
          </p>
          {description && (
            <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{description}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full text-white font-medium py-2"
        style={{ backgroundColor: '#0FA3B1' }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Payment
          </>
        )}
      </Button>

      <p className="text-xs text-center" style={{ color: '#6B7280' }}>
        You'll be redirected to Stripe to complete your payment securely.
      </p>
    </div>
  );
}