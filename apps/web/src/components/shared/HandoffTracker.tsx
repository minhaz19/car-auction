'use client';

import { useState } from 'react';
import type { ITransaction } from '@car-auction/shared';
import { useConfirmHandoffMutation } from '@/store/services/transactionsApi';
import { CheckCircle2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface HandoffTrackerProps {
  transaction: ITransaction;
  isBuyer: boolean;
}

export function HandoffTracker({ transaction, isBuyer }: HandoffTrackerProps) {
  const [confirmHandoffMutation, { isLoading }] = useConfirmHandoffMutation();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isBuyerConfirmed = transaction.handoffConfirmedByBuyer;
  const isSellerConfirmed = transaction.handoffConfirmedBySeller;
  const isCompleted = transaction.status === 'completed';

  const myConfirmed = isBuyer ? isBuyerConfirmed : isSellerConfirmed;

  const handleConfirm = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await confirmHandoffMutation(transaction._id).unwrap();
      setSuccessMsg(res.message);
    } catch (err: unknown) {
      setErrorMsg((err as { data?: { message?: string } })?.data?.message || 'Failed to confirm handoff.');
    }
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h4 className="text-sm font-extrabold text-foreground">
            Mutual Handoff Confirmation Tracker
          </h4>
        </div>
        {isCompleted ? (
          <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            Completed & Closed
          </span>
        ) : (
          <span className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-500">
            Awaiting Dual Confirmation
          </span>
        )}
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

      {/* Dual Confirmation Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Buyer Confirmation */}
        <div
          className={`rounded-2xl border p-4 space-y-2 transition-colors ${
            isBuyerConfirmed
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-zinc-800 bg-zinc-950 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span>Buyer Confirmation</span>
            {isBuyerConfirmed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
          </div>
          <p className="text-[11px] opacity-80">
            {isBuyerConfirmed
              ? 'Buyer has confirmed receipt of vehicle and keys.'
              : 'Awaiting buyer vehicle receipt confirmation.'}
          </p>
        </div>

        {/* Seller Confirmation */}
        <div
          className={`rounded-2xl border p-4 space-y-2 transition-colors ${
            isSellerConfirmed
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-zinc-800 bg-zinc-950 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span>Seller Confirmation</span>
            {isSellerConfirmed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
          </div>
          <p className="text-[11px] opacity-80">
            {isSellerConfirmed
              ? 'Seller has confirmed vehicle and title handed off.'
              : 'Awaiting seller vehicle handoff confirmation.'}
          </p>
        </div>
      </div>

      {/* Confirmation Action CTA */}
      {!isCompleted && (
        <div className="border-t border-border pt-4">
          {myConfirmed ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              You have confirmed handoff! Awaiting counterpart confirmation.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs font-extrabold text-black shadow-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isLoading
                ? 'Confirming…'
                : isBuyer
                ? 'Confirm Vehicle Received'
                : 'Mark Vehicle Handed Off'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
