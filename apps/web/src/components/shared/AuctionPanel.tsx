'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import type { ICar } from '@car-auction/shared';
import { useAuth } from '@/hooks/useAuth';
import { usePlaceBidMutation } from '@/store/services/carsApi';
import {
  useGetWatchlistQuery,
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
} from '@/store/services/usersApi';
import { CountdownTimer } from './CountdownTimer';
import { Gavel, Heart, AlertTriangle, CheckCircle2, Lock, Eye, WifiOff } from 'lucide-react';

interface AuctionPanelProps {
  car: ICar;
  watcherCount?: number;
  serverTimeOffset?: number;
  isExtendedAlert?: boolean;
  latestAuctionEnd?: string | null;
  isConnected?: boolean;
  isReconnecting?: boolean;
}

export function AuctionPanel({
  car,
  watcherCount = 1,
  serverTimeOffset = 0,
  isExtendedAlert = false,
  latestAuctionEnd,
  isConnected = true,
  isReconnecting = false,
}: AuctionPanelProps) {
  const { isAuthenticated } = useAuth();
  const [placeBidMutation, { isLoading: isPlacingBid }] = usePlaceBidMutation();

  // Watchlist queries & mutations
  const { data: watchlistCars } = useGetWatchlistQuery(undefined, { skip: !isAuthenticated });
  const [addToWatchlist] = useAddToWatchlistMutation();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const serverIsWatchlisted = Boolean(watchlistCars?.some((item) => item._id === car._id));
  const [optimisticWatchlisted, setOptimisticWatchlisted] = useState<boolean | null>(null);

  const isWatchlisted = optimisticWatchlisted !== null ? optimisticWatchlisted : serverIsWatchlisted;

  const minIncrement = Math.max(100, Math.round(car.currentBid * 0.01));
  const minRequiredBid = car.currentBid + minIncrement;

  const [bidInput, setBidInput] = useState<string>(String(minRequiredBid));
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const formattedCurrentBid = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(car.currentBid);

  const formattedMinRequired = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(minRequiredBid);

  const effectiveAuctionEnd = latestAuctionEnd || car.auctionEnd;
  const isEnded = car.status === 'ended';

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) return;
    const nextState = !isWatchlisted;
    setOptimisticWatchlisted(nextState); // Optimistic UI update

    try {
      if (nextState) {
        await addToWatchlist(car._id).unwrap();
      } else {
        await removeFromWatchlist(car._id).unwrap();
      }
    } catch {
      setOptimisticWatchlisted(!nextState); // Rollback on error
    }
  };

  const handlePlaceBid = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numericAmount = Number(bidInput);
    if (!numericAmount || numericAmount < minRequiredBid) {
      setErrorMsg(`Bid must be at least ${formattedMinRequired}`);
      return;
    }

    try {
      const res = await placeBidMutation({ carId: car._id, amount: numericAmount }).unwrap();
      setSuccessMsg(res.message || 'Bid placed successfully!');
      const nextMin = res.car.currentBid + Math.max(100, Math.round(res.car.currentBid * 0.01));
      setBidInput(String(nextMin));
    } catch (err: unknown) {
      const errorData = (err as { data?: { message?: string }; status?: number })?.data;
      const status = (err as { status?: number })?.status;

      if (status === 409) {
        setErrorMsg(
          errorData?.message ||
            'Outbid! Another bidder placed a higher bid just before your request arrived.',
        );
      } else {
        setErrorMsg(errorData?.message || 'Failed to place bid. Please try again.');
      }
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-6 shadow-xl sticky top-20">
      {/* Socket Disconnection Reconnecting Banner */}
      {isReconnecting && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs text-amber-600 dark:text-amber-300 animate-pulse">
          <WifiOff className="h-4 w-4 text-amber-500" />
          <span>Reconnecting to live auction room…</span>
        </div>
      )}

      {/* Top Bar: Live Status, Watcher Presence & Watchlist Heart */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          {!isEnded ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live Auction
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-500/10 border border-neutral-500/30 px-3 py-1 text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Auction Ended
            </span>
          )}

          {/* Presence Indicator */}
          {!isEnded && isConnected && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>{watcherCount} watching</span>
            </span>
          )}
        </div>

        {/* Watchlist Toggle Heart Button with Optimistic Updates */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleToggleWatchlist}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              isWatchlisted
                ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                : 'border-border bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Heart className={`h-3.5 w-3.5 ${isWatchlisted ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{isWatchlisted ? 'Saved' : 'Watch'}</span>
          </button>
        ) : (
          <Link
            href={`/auth/login?redirect=/car/${car._id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Heart className="h-3.5 w-3.5" />
            Watch
          </Link>
        )}
      </div>

      {/* Current Bid Display (ARIA Live Region for Accessibility) */}
      <div aria-live="polite">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
          {isEnded ? 'Winning Bid' : 'Current Highest Bid'}
        </span>
        <div className="text-4xl font-extrabold tracking-tight text-foreground">
          {formattedCurrentBid}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {car.bidCount} bids placed • Starting bid: ${car.startingBid.toLocaleString()}
        </p>
      </div>

      {/* Real-time Server-Authoritative Countdown Timer */}
      <CountdownTimer
        auctionEnd={effectiveAuctionEnd}
        serverTimeOffset={serverTimeOffset}
        isExtendedAlert={isExtendedAlert}
      />

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{successMsg}</p>
            <p className="opacity-90">Your bid is currently the highest bid!</p>
          </div>
        </div>
      )}

      {/* Error / Outbid Alert Box */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Bid Input & Action Form */}
      {!isEnded ? (
        isAuthenticated ? (
          <form onSubmit={handlePlaceBid} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="bid-amount" className="text-muted-foreground">
                  Your Bid Amount ($)
                </label>
                <span className="text-primary">Min: {formattedMinRequired}</span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                  $
                </span>
                <input
                  id="bid-amount"
                  type="number"
                  min={minRequiredBid}
                  step={minIncrement}
                  value={bidInput}
                  onChange={(e) => setBidInput(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background pl-8 pr-4 py-3 text-lg font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Minimum increment: +${minIncrement.toLocaleString()} (1% of current bid)
              </p>
            </div>

            <button
              type="submit"
              disabled={isPlacingBid}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-extrabold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Gavel className="h-5 w-5" />
              {isPlacingBid ? 'Placing Bid…' : 'Place Bid Now'}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Lock className="h-4 w-4" />
              Sign in required to place bids
            </div>
            <Link
              href={`/auth/login?redirect=/car/${car._id}`}
              className="inline-block w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              Sign In to Bid
            </Link>
          </div>
        )
      ) : (
        <div className="rounded-2xl bg-neutral-900 text-white p-4 text-center space-y-1">
          <p className="text-sm font-bold">This auction has closed</p>
          <p className="text-xs text-neutral-400">Winning bid finalized at {formattedCurrentBid}</p>
        </div>
      )}
    </div>
  );
}
