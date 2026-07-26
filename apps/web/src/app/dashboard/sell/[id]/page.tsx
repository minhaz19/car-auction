'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { SpecSheet } from '@/components/shared/SpecSheet';
import { BidHistoryList } from '@/components/shared/BidHistoryList';
import {
  useGetCarByIdQuery,
  useDeleteCarMutation,
} from '@/store/services/carsApi';
import { useGetUserTransactionsQuery } from '@/store/services/transactionsApi';
import { FulfillmentPanel } from '@/components/shared/FulfillmentPanel';
import { ArrowLeft, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function SellerListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: car, isLoading, isError } = useGetCarByIdQuery(id);
  const [deleteCarMutation, { isLoading: isDeleting }] = useDeleteCarMutation();
  const { data: userTransactions = [] } = useGetUserTransactionsQuery();

  const sellerTx = userTransactions.find((tx) => {
    if (!tx.carId) return false;
    const txCarId = typeof tx.carId === 'object' && tx.carId !== null ? (tx.carId as { _id: string })._id : tx.carId;
    return String(txCarId) === String(id);
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDeleteListing = async () => {
    if (!confirm('Are you sure you want to cancel this auction listing? This action cannot be undone.')) return;
    setErrorMsg('');
    try {
      await deleteCarMutation(id).unwrap();
      setSuccessMsg('Listing cancelled successfully');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      setErrorMsg(message || 'Cannot delete listing after bids have been placed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading seller listing dashboard…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !car) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">Listing Not Found</h1>
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

  const hasBids = car.bidCount > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary uppercase">
              Seller Control Panel
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">
              {car.year} {car.make} {car.model}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href={`/car/${car._id}`}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold hover:bg-muted transition-colors"
            >
              View Public Auction Room
            </Link>

            <button
              type="button"
              onClick={handleDeleteListing}
              disabled={hasBids || isDeleting}
              className="flex items-center gap-1.5 rounded-xl bg-red-600/10 border border-red-500/30 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-40"
              title={hasBids ? 'Listings with active bids cannot be cancelled' : 'Cancel Listing'}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Cancelling…' : 'Cancel Listing'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {successMsg}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Auction Status</span>
            <span className="text-lg font-bold block capitalize text-foreground">{car.status}</span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Current Highest Bid</span>
            <span className="text-lg font-mono font-bold block text-foreground">
              ${car.currentBid.toLocaleString()}
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Total Bids Placed</span>
            <span className="text-lg font-bold block text-foreground">{car.bidCount} bids</span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Payout Status</span>
            <span className="text-xs font-bold block text-amber-600 dark:text-amber-300">
              {car.status === 'ended' ? 'Payout processing — Stripe Connect planned' : 'Auction Live'}
            </span>
          </div>
        </div>

        {/* Fulfillment Panel for Seller if transaction exists */}
        {sellerTx && (sellerTx.status === 'paid' || sellerTx.status === 'completed') && (
          <FulfillmentPanel transaction={sellerTx} isBuyer={false} />
        )}

        {/* 2-Column Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <SpecSheet car={car} />
          </div>
          <div className="lg:col-span-1">
            <BidHistoryList carId={car._id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
