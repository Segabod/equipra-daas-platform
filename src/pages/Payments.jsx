import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, BarChart3, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PaymentCheckout from '../components/PaymentCheckout';
import { Button } from '@/components/ui/button';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

export default function Payments() {
  const [user, setUser] = useState(null);
  const [paymentMode, setPaymentMode] = useState('subscription'); // 'subscription' or 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Verify payment on success page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const subscriptionId = urlParams.get('subscription_id');

    if ((sessionId || subscriptionId) && !verifyingPayment) {
      setVerifyingPayment(true);
      base44.functions.invoke('verifyPayment', { sessionId, subscriptionId })
        .catch(err => console.error('Payment verification failed:', err));
    }
  }, [verifyingPayment]);

  const plans = [
    {
      id: 'standard',
      name: 'Standard Plan',
      amount: 500000,
      features: ['Standard SLA', '48-hour swap', 'Email support', 'Standard shipping'],
      popular: false,
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      amount: 750000,
      features: ['Premium SLA', '24-hour swap', 'Phone & email support', 'Express shipping', 'Priority queue'],
      popular: true,
    },
    {
      id: 'executive',
      name: 'Executive Plan',
      amount: 1200000,
      features: ['Executive SLA', 'Next day swap', 'Dedicated agent', 'White glove service', 'Priority queue'],
      popular: false,
    },
  ];

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const subscriptionId = urlParams.get('subscription_id');

  if (sessionId || subscriptionId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: P.bg }}>
        <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md text-center">
          {verifyingPayment ? (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: P.teal }} />
              <h1 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Processing Payment</h1>
              <p style={{ color: P.text }}>Verifying your payment and updating invoice...</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
              <h1 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Payment Successful!</h1>
              <p style={{ color: P.text }}>Your payment has been processed successfully. Invoice has been marked as paid.</p>
              <Button 
                className="mt-6 w-full text-white"
                style={{ backgroundColor: P.teal }}
                onClick={() => window.location.href = '/Dashboard'}
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: P.navy }}>
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: P.navy }}>Payments & Billing</h1>
          </div>
          <p style={{ color: P.text }}>Manage your subscriptions and make one-time payments</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Mode Selector */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setPaymentMode('subscription')}
            className={`flex-1 p-6 rounded-xl border-2 text-left transition-all ${
              paymentMode === 'subscription'
                ? 'border-teal-500 bg-blue-50'
                : `border-gray-300 bg-white hover:border-gray-400`
            }`}
            style={paymentMode === 'subscription' ? { borderColor: P.teal, backgroundColor: '#F0FAFB' } : {}}
          >
            <Clock className="w-6 h-6 mb-2" style={{ color: P.teal }} />
            <h3 className="font-bold" style={{ color: P.navy }}>Monthly Subscription</h3>
            <p className="text-sm mt-1" style={{ color: P.text }}>Recurring monthly billing with service bundle</p>
          </button>

          <button
            onClick={() => setPaymentMode('custom')}
            className={`flex-1 p-6 rounded-xl border-2 text-left transition-all ${
              paymentMode === 'custom'
                ? 'border-teal-500 bg-blue-50'
                : `border-gray-300 bg-white hover:border-gray-400`
            }`}
            style={paymentMode === 'custom' ? { borderColor: P.teal, backgroundColor: '#F0FAFB' } : {}}
          >
            <CreditCard className="w-6 h-6 mb-2" style={{ color: P.teal }} />
            <h3 className="font-bold" style={{ color: P.navy }}>One-Time Payment</h3>
            <p className="text-sm mt-1" style={{ color: P.text }}>Custom amount for device purchases or services</p>
          </button>
        </div>

        {/* Subscription Plans */}
        {paymentMode === 'subscription' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: P.navy }}>Choose Your Service Plan</h2>
              <p style={{ color: P.text }}>Select a plan that matches your needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`rounded-xl p-6 border-2 transition-all cursor-pointer ${
                    selectedPlan === plan.id
                      ? 'border-teal-500'
                      : 'border-gray-300'
                  }`}
                  style={selectedPlan === plan.id ? { borderColor: P.teal, backgroundColor: '#F0FAFB' } : { backgroundColor: 'white' }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold" style={{ color: P.navy }}>{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold" style={{ color: P.teal }}>₦{(plan.amount / 1000).toFixed(0)}k</span>
                    <span style={{ color: P.text }}>/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: P.text }}>
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {selectedPlan && (
              <div className="bg-white rounded-xl p-8 max-w-md">
                <PaymentCheckout
                  amount={plans.find(p => p.id === selectedPlan)?.amount}
                  description={`${plans.find(p => p.id === selectedPlan)?.name} - Monthly Subscription`}
                  type="subscription"
                />
              </div>
            )}
          </div>
        )}

        {/* Custom One-Time Payment */}
        {paymentMode === 'custom' && (
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-6" style={{ color: P.navy }}>One-Time Payment</h2>
            
            <div className="bg-white rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: P.navy }}>Amount (₦)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border-2 rounded-lg text-lg font-semibold"
                  style={{ borderColor: P.border, color: P.navy }}
                />
              </div>

              {customAmount && Number(customAmount) > 0 && (
                <>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: P.bg }}>
                    <p style={{ color: P.text }}>Total Amount</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: P.teal }}>₦{Number(customAmount).toLocaleString()}</p>
                  </div>

                  <PaymentCheckout
                    amount={Number(customAmount)}
                    description="One-time payment"
                    type="one-time"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="mt-16 p-6 rounded-xl" style={{ backgroundColor: '#F0F9FF', border: `1px solid #E0F2FE` }}>
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 mt-0.5" style={{ color: '#0369A1' }} />
            <div style={{ color: '#0369A1' }}>
              <p className="font-semibold">Payment Information</p>
              <p className="text-sm mt-1">All payments are securely processed through Stripe. You'll receive an invoice confirmation for tax and accounting purposes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}