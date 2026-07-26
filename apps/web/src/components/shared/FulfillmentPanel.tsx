'use client';

import { useState, FormEvent } from 'react';
import type { ITransaction, IUserPublic } from '@car-auction/shared';
import {
  useCompleteTransactionMutation,
  useDisputeTransactionMutation,
} from '@/store/services/transactionsApi';
import {
  CheckCircle2,
  PhoneCall,
  Mail,
  User,
  ShieldAlert,
  AlertTriangle,
  Send,
  X,
  Truck,
} from 'lucide-react';

interface FulfillmentPanelProps {
  transaction: ITransaction;
  isBuyer: boolean;
  onOpenReviewModal?: () => void;
}

export function FulfillmentPanel({ transaction, isBuyer, onOpenReviewModal }: FulfillmentPanelProps) {
  const [completeTransactionMutation, { isLoading: isCompleting }] = useCompleteTransactionMutation();
  const [disputeTransactionMutation, { isLoading: isDisputing }] = useDisputeTransactionMutation();

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const buyerObj = typeof transaction.buyerId === 'object' ? (transaction.buyerId as IUserPublic) : null;
  const sellerObj = typeof transaction.sellerId === 'object' ? (transaction.sellerId as IUserPublic) : null;
  const counterpart = isBuyer ? sellerObj : buyerObj;
  const counterpartRole = isBuyer ? 'Seller' : 'Winning Buyer';

  const isCompleted = transaction.fulfillmentStatus === 'completed' || transaction.status === 'completed';
  const isDisputed = transaction.disputed || transaction.fulfillmentStatus === 'disputed';

  const handleConfirmHandoff = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await completeTransactionMutation(transaction._id).unwrap();
      setSuccessMsg(res.message);
    } catch (err: unknown) {
      setErrorMsg((err as { data?: { message?: string } })?.data?.message || 'Failed to complete transaction.');
    }
  };

  const handleSubmitDispute = async (e: FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    setErrorMsg('');
    try {
      const res = await disputeTransactionMutation({
        id: transaction._id,
        reason: disputeReason.trim(),
      }).unwrap();
      setSuccessMsg(res.message);
      setDisputeModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg((err as { data?: { message?: string } })?.data?.message || 'Failed to submit dispute.');
    }
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-6 shadow-sm">
      {/* Header & Step Indicator */}
      <div className="border-b border-border pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-extrabold text-foreground">
              Vehicle Pickup & Fulfillment Progress
            </h3>
          </div>
          {isDisputed && (
            <span className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-1 text-xs font-bold text-red-500">
              Dispute Under Review
            </span>
          )}
          {isCompleted && !isDisputed && (
            <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
              Handoff Complete
            </span>
          )}
        </div>

        {/* Fulfillment Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
          <div className="rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2">
            1. Paid & Verified
          </div>
          <div
            className={`rounded-xl py-2 border transition-colors ${
              isCompleted || transaction.fulfillmentStatus === 'paid_awaiting_pickup'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            2. Pickup Coordination
          </div>
          <div
            className={`rounded-xl py-2 border transition-colors ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            3. Handoff Confirmed
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-semibold text-red-400">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Disputed Banner Notice */}
      {isDisputed && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-1.5 text-xs text-red-400">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            Issue Reported: Support Case Open
          </div>
          <p className="opacity-90">
            {transaction.disputeReason || 'A dispute has been submitted for this vehicle order.'}
          </p>
          <p className="text-[11px] opacity-75 pt-1">
            Our customer compliance team will review within 24 hours and contact both parties.
          </p>
        </div>
      )}

      {/* Counterpart Direct Contact Info Box */}
      {counterpart && (
        <div className="rounded-2xl border border-border/80 bg-zinc-950 p-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Direct Contact Information ({counterpartRole})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <User className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>{counterpart.name}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <a href={`mailto:${counterpart.email}`} className="hover:underline text-emerald-400">
                {counterpart.email}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 border-t border-zinc-800 pt-2">
            <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
            <span>Direct phone coordination & pickup scheduling enabled.</span>
          </div>
        </div>
      )}

      {/* Action Buttons: Confirm Handoff, Review, Dispute */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {!isCompleted && !isDisputed ? (
          <button
            type="button"
            onClick={handleConfirmHandoff}
            disabled={isCompleting}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-black shadow-md hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleting
              ? 'Confirming…'
              : isBuyer
              ? 'Confirm Vehicle Received / Complete Handoff'
              : 'Mark Vehicle Handed Off'}
          </button>
        ) : isCompleted && isBuyer && onOpenReviewModal ? (
          <button
            type="button"
            onClick={onOpenReviewModal}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 px-5 py-2.5 text-xs font-extrabold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Leave Seller Rating & Review
          </button>
        ) : null}

        {!isDisputed && (
          <button
            type="button"
            onClick={() => setDisputeModalOpen(true)}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            Report an Issue
          </button>
        )}
      </div>

      {/* Report an Issue / Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Report an Issue / Dispute
              </div>
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Describe any discrepancy regarding condition, title, or handoff delays. Our compliance team will review and contact both parties.
              </p>

              <textarea
                required
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the issue in detail..."
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
                  {isDisputing ? 'Submitting…' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
