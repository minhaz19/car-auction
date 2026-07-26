'use client';

import { use, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { HandoffTracker } from '@/components/shared/HandoffTracker';
import { MessageThread } from '@/components/shared/MessageThread';
import { ReviewModal } from '@/components/shared/ReviewModal';
import { SellerRatingBadge } from '@/components/shared/SellerRatingBadge';
import {
  useGetTransactionQuery,
  useDisputeTransactionMutation,
} from '@/store/services/transactionsApi';
import type { ICar, IUserPublic } from '@car-auction/shared';
import {
  ArrowLeft,
  ShieldCheck,
  Trophy,
  User,
  Mail,
  PhoneCall,
  ShieldAlert,
  Star,
  Send,
  X,
} from 'lucide-react';

export default function TransactionHandoffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data: transaction, isLoading, isError } = useGetTransactionQuery(id);
  const [disputeTransactionMutation, { isLoading: isDisputing }] = useDisputeTransactionMutation();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Loading vehicle handoff portal…
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
  const buyerObj = typeof transaction.buyerId === 'object' ? (transaction.buyerId as IUserPublic) : null;
  const sellerObj = typeof transaction.sellerId === 'object' ? (transaction.sellerId as IUserPublic) : null;

  const buyerIdStr = buyerObj ? buyerObj._id : String(transaction.buyerId);
  const sellerIdStr = sellerObj ? sellerObj._id : String(transaction.sellerId);

  const isBuyer = user?._id === buyerIdStr;
  const counterpart = isBuyer ? sellerObj : buyerObj;
  const counterpartRole = isBuyer ? 'Seller' : 'Winning Buyer';

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(transaction.amount);

  const isCompleted = transaction.status === 'completed';
  const isDisputed = transaction.status === 'disputed' || transaction.disputed;

  const handleDisputeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    setDisputeError('');
    setDisputeSuccess('');

    try {
      const res = await disputeTransactionMutation({
        id: transaction._id,
        reason: disputeReason.trim(),
      }).unwrap();
      setDisputeSuccess(res.message);
      setDisputeModalOpen(false);
    } catch (err: unknown) {
      setDisputeError((err as { data?: { message?: string } })?.data?.message || 'Failed to submit dispute.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Hero Header */}
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Trophy className="h-3.5 w-3.5" /> Vehicle Handoff & Settlement Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {carObj.year} {carObj.make} {carObj.model}
            </h1>
            <p className="text-xs text-muted-foreground">
              Transaction ID: <span className="font-mono text-foreground">{transaction._id}</span> | Sale Price: <strong className="text-foreground">{formattedAmount}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {sellerIdStr && <SellerRatingBadge sellerId={sellerIdStr} size="md" />}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Escrow Protected
            </div>
          </div>
        </div>

        {/* Disputed Banner */}
        {isDisputed && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 space-y-2 text-red-400">
            <div className="flex items-center gap-2 font-bold text-base">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Dispute Case Flagged
            </div>
            <p className="text-xs opacity-90">
              {transaction.disputeReason || 'A dispute has been opened regarding vehicle condition or delivery paperwork.'}
            </p>
            <p className="text-[11px] opacity-75">
              Customer support compliance will contact both buyer and seller within 24 hours.
            </p>
          </div>
        )}

        {/* Counterparty Contact Reveal Card */}
        {counterpart && (
          <div className="rounded-3xl border border-border bg-card p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-extrabold text-foreground">
                Verified Contact Details ({counterpartRole})
              </h3>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Payment Confirmed — Contact Revealed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 font-semibold text-foreground">
                <User className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Name: {counterpart.name}</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-foreground">
                <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Email: </span>
                <a href={`mailto:${counterpart.email}`} className="text-emerald-400 hover:underline">
                  {counterpart.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t border-border/50 pt-2">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
              <span>Use the in-app chat thread below to coordinate exact meeting time and delivery location.</span>
            </div>
          </div>
        )}

        {/* Handoff Progress Tracker */}
        <HandoffTracker transaction={transaction} isBuyer={isBuyer} />

        {/* In-App Real-Time Chat Thread */}
        <MessageThread transactionId={transaction._id} />

        {/* Bottom Actions: Review & Dispute */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          {isCompleted && (
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 px-5 py-3 text-xs font-extrabold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Leave Transaction Rating & Review
            </button>
          )}

          {!isDisputed && (
            <button
              type="button"
              onClick={() => setDisputeModalOpen(true)}
              className="ml-auto rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            >
              Report an Issue / Open Dispute
            </button>
          )}
        </div>

        {/* Review Modal */}
        <ReviewModal
          transactionId={transaction._id}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
        />

        {/* Dispute Confirmation Modal */}
        {disputeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Report an Issue / Flag Dispute
                </div>
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDisputeSubmit} className="space-y-4">
                {disputeError && <p className="text-xs text-red-500">{disputeError}</p>}
                {disputeSuccess && <p className="text-xs text-emerald-400">{disputeSuccess}</p>}

                <p className="text-xs text-muted-foreground">
                  Describe any condition mismatch, title transfer delay, or handoff issue. Support will freeze payout and review.
                </p>

                <textarea
                  required
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Provide detailed reason..."
                  className="w-full rounded-2xl border border-input bg-zinc-950 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOpen(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDisputing}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isDisputing ? 'Flagging…' : 'Submit Dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
