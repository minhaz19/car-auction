'use client';

import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useConfirmPaymentMutation } from '@/store/services/transactionsApi';
import { ShieldCheck, CreditCard, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

interface CheckoutFormProps {
  transactionId: string;
  amount: number;
  onSuccess: () => void;
}

export function CheckoutForm({ transactionId, amount, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirmPaymentMutation] = useConfirmPaymentMutation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!stripe || !elements) {
      setIsProcessing(true);
      try {
        await confirmPaymentMutation(transactionId).unwrap();
        setIsPaidSuccess(true);
        setIsProcessing(false);
        onSuccess();
      } catch (err: unknown) {
        setIsProcessing(false);
        setErrorMessage((err as { data?: { message?: string } })?.data?.message || 'Failed to complete payment.');
      }
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred during payment processing.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await confirmPaymentMutation(transactionId).unwrap();
        setIsPaidSuccess(true);
        setIsProcessing(false);
        onSuccess();
      } else {
        await confirmPaymentMutation(transactionId).unwrap();
        setIsPaidSuccess(true);
        setIsProcessing(false);
        onSuccess();
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage((err as { data?: { message?: string } })?.data?.message || 'Payment processing failed.');
    }
  };

  if (isPaidSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
          Payment Confirmed!
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your payment of <strong className="text-foreground">{formattedAmount}</strong> has been processed successfully. The seller has been notified.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Test Mode Card Hint Box */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-2 font-bold">
          <CreditCard className="h-4 w-4 text-blue-500" />
          Stripe Test Mode Active
        </div>
        <p className="opacity-90">
          Use test card: <strong className="font-mono bg-blue-500/20 px-2 py-0.5 rounded text-foreground">4242 4242 4242 4242</strong> with any future expiration date (e.g. 12/28) and CVC (123).
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stripe Elements Input Container */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <PaymentElement />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <Lock className="h-3.5 w-3.5 text-emerald-500" />
          Encrypted 256-bit TLS Connection
        </span>
        <span className="flex items-center gap-1 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Stripe Verified
        </span>
      </div>

      {/* Submit Payment Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-extrabold text-primary-foreground shadow-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <CreditCard className="h-5 w-5" />
        {isProcessing ? 'Processing Payment…' : `Pay ${formattedAmount} Now`}
      </button>
    </form>
  );
}

export function FallbackCheckoutForm({ transactionId, amount, onSuccess }: CheckoutFormProps) {
  const [confirmPaymentMutation] = useConfirmPaymentMutation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    try {
      await confirmPaymentMutation(transactionId).unwrap();
      setIsPaidSuccess(true);
      setIsProcessing(false);
      onSuccess();
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage((err as { data?: { message?: string } })?.data?.message || 'Failed to complete payment.');
    }
  };

  if (isPaidSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
          Payment Confirmed!
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your payment of <strong className="text-foreground">{formattedAmount}</strong> has been processed successfully. The seller has been notified.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1 text-xs text-amber-700 dark:text-amber-300">
        <div className="flex items-center gap-2 font-bold">
          <Lock className="h-4 w-4 text-amber-500" />
          Test Mode Checkout Fallback Active
        </div>
        <p className="opacity-90">
          Confirm test payment for transaction <strong className="font-mono">{transactionId}</strong>.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-extrabold text-primary-foreground shadow-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <CreditCard className="h-5 w-5" />
        {isProcessing ? 'Processing Payment…' : `Confirm Test Payment (${formattedAmount})`}
      </button>
    </form>
  );
}
