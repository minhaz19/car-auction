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
    setOptimisticWatchlisted(nextState);

    try {
      if (nextState) {
        await addToWatchlist(car._id).unwrap();
      } else {
        await removeFromWatchlist(car._id).unwrap();
      }
    } catch {
      setOptimisticWatchlisted(!nextState);
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
    <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur p-6 space-y-6 shadow-2xl sticky top-20">
      {/* Socket Disconnection Reconnecting Banner */}
      {isReconnecting && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs font-semibold text-amber-400 animate-pulse">
          <WifiOff className="h-4 w-4 text-amber-500" />
          <span>Reconnecting to live auction room…</span>
        </div>
      )}

      {/* Top Bar: Live Status, Watcher Presence & Watchlist Heart */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-2">
          {!isEnded ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Auction Ended
            </span>
          )}

          {/* Presence Indicator */}
          {!isEnded && isConnected && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800/60 px-3 py-1.5 rounded-full border border-zinc-700/50">
              <Eye className="h-3.5 w-3.5 text-emerald-400" />
              <span>{watcherCount} watching</span>
            </span>
          )}
        </div>

        {/* Watchlist Toggle Heart Button (Min 44px touch target) */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleToggleWatchlist}
            className={`flex items-center gap-1.5 min-h-[44px] rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
              isWatchlisted
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : 'border-border bg-zinc-900/60 text-zinc-300 hover:text-white'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{isWatchlisted ? 'Saved' : 'Watch'}</span>
          </button>
        ) : (
          <Link
            href={`/auth/login?redirect=/car/${car._id}`}
            className="flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-zinc-400 hover:text-white"
          >
            <Heart className="h-4 w-4" />
            Watch
          </Link>
        )}
      </div>

      {/* Prominent Current Bid Display (64px+ font size in JetBrains Mono) */}
      <div aria-live="polite" className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          {isEnded ? 'Winning Bid' : 'Current Highest Bid'}
        </span>
        <div className="text-5xl sm:text-6xl font-mono font-extrabold tracking-tight text-emerald-400">
          {formattedCurrentBid}
        </div>
        <p className="text-xs text-muted-foreground pt-1">
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
        <div className="flex items-start gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{successMsg}</p>
            <p className="opacity-90">Your bid is currently the highest bid!</p>
          </div>
        </div>
      )}

      {/* Error / Outbid Alert Box */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-400">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Bid Input & Action Form (44px+ Touch Targets) */}
      {!isEnded ? (
        isAuthenticated ? (
          <form onSubmit={handlePlaceBid} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="bid-amount" className="text-zinc-300">
                  Your Bid Amount ($)
                </label>
                <span className="text-emerald-400 font-bold">Min: {formattedMinRequired}</span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-base">
                  $
                </span>
                <input
                  id="bid-amount"
                  type="number"
                  min={minRequiredBid}
                  step={minIncrement}
                  value={bidInput}
                  onChange={(e) => setBidInput(e.target.value)}
                  className="w-full min-h-[48px] rounded-2xl border border-input bg-zinc-950 pl-9 pr-4 py-3 text-xl font-mono font-bold text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Minimum increment: +${minIncrement.toLocaleString()} (1% of current bid)
              </p>
            </div>

            <button
              type="submit"
              disabled={isPlacingBid}
              className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-base font-extrabold text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50"
            >
              <Gavel className="h-5 w-5" />
              {isPlacingBid ? 'Placing Bid…' : 'Place Bid Now'}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-border bg-zinc-900/50 p-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-400">
              <Lock className="h-4 w-4 text-emerald-400" />
              Sign in required to place bids
            </div>
            <Link
              href={`/auth/login?redirect=/car/${car._id}`}
              className="inline-flex items-center justify-center w-full min-h-[44px] rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-black shadow-md hover:bg-emerald-400 transition-all"
            >
              Sign In to Bid
            </Link>
          </div>
        )
      ) : (
        <div className="rounded-2xl bg-zinc-950 text-white p-4 text-center space-y-1 border border-zinc-800">
          <p className="text-sm font-bold">This auction has closed</p>
          <p className="text-xs text-zinc-400">Winning bid finalized at {formattedCurrentBid}</p>
        </div>
      )}
    </div>
  );
}
