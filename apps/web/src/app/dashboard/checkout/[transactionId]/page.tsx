'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import dynamic from 'next/dynamic';
import {
  useGetTransactionQuery,
  useCreatePaymentIntentMutation,
} from '@/store/services/transactionsApi';
import type { ICar } from '@car-auction/shared';
import { ArrowLeft, ShieldCheck, Trophy, Lock } from 'lucide-react';

const CheckoutForm = dynamic(
  () => import('@/components/shared/CheckoutForm').then((mod) => mod.CheckoutForm),
  {
    loading: () => (
      <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-3 animate-pulse">
        <p className="text-sm text-muted-foreground font-bold">Loading secure payment element…</p>
      </div>
    ),
    ssr: false,
  },
);

export default function WinnerCheckoutPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const router = useRouter();

  const { data: transaction, isLoading: isTxLoading, isError } = useGetTransactionQuery(transactionId);
  const [createPaymentIntent] = useCreatePaymentIntentMutation();

  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [intentError, setIntentError] = useState<string>('');

  useEffect(() => {
    if (!transactionId) return;

    createPaymentIntent(transactionId)
      .unwrap()
      .then((res) => {
        if (res.clientSecret) {
          setClientSecret(res.clientSecret);
        }
        if (res.stripePublishableKey) {
          setStripePromise(loadStripe(res.stripePublishableKey));
        }
      })
      .catch((err) => {
        setIntentError(err?.data?.message || 'Failed to initialize payment gateway.');
      });
  }, [transactionId, createPaymentIntent]);

  if (isTxLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Loading secure checkout session…
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">Transaction Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The payment transaction you requested does not exist or you do not have permission to view it.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const carObj = transaction.carId as unknown as ICar;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(transaction.amount);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Winner Hero Header */}
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Trophy className="h-3.5 w-3.5" /> Auction Winner Checkout
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Finalize Purchase: {carObj.year} {carObj.make} {carObj.model}
            </h1>
            <p className="text-xs text-muted-foreground">
              Winning bid amount: <strong className="text-foreground">{formattedAmount}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Buyer Protection Guarantee
          </div>
        </div>

        {/* 2-Column Layout: Vehicle Summary & Stripe Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Car Summary Card */}
          <div className="lg:col-span-1 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-bold border-b border-border pb-3">Order Summary</h3>

            {carObj.images?.[0] && (
              <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={carObj.images[0]}
                  alt={`${carObj.year} ${carObj.make} ${carObj.model}`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-bold text-foreground">
                  {carObj.year} {carObj.make} {carObj.model}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Condition</span>
                <span className="font-bold text-foreground">{carObj.condition}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Winning Bid</span>
                <span className="font-extrabold text-foreground">{formattedAmount}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-extrabold text-primary pt-1">
                <span>Total Due</span>
                <span>{formattedAmount}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Stripe Elements Payment Form */}
          <div className="lg:col-span-2 space-y-4">
            {transaction.status === 'paid' ? (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  This transaction is fully paid!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Payment of {formattedAmount} was confirmed on{' '}
                  {transaction.paidAt ? new Date(transaction.paidAt).toLocaleDateString() : 'today'}.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  Return to Dashboard
                </Link>
              </div>
            ) : clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm
                  transactionId={transaction._id}
                  amount={transaction.amount}
                  onSuccess={() => setTimeout(() => router.push('/dashboard'), 1500)}
                />
              </Elements>
            ) : (
              // Fallback Checkout Form if clientSecret is mock or loading
              <div className="rounded-3xl border border-border bg-card p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl">
                  <Lock className="h-4 w-4" />
                  Stripe Elements Test Mode Ready
                </div>
                {intentError && <p className="text-xs text-red-500">{intentError}</p>}
                <CheckoutForm
                  transactionId={transaction._id}
                  amount={transaction.amount}
                  onSuccess={() => setTimeout(() => router.push('/dashboard'), 1500)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
