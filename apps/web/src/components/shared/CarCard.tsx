'use client';

import Link from 'next/link';
import type { ICar } from '@car-auction/shared';
import { Clock, Gavel, Fuel, Gauge } from 'lucide-react';

interface CarCardProps {
  car: ICar;
}

export function CarCard({ car }: CarCardProps) {
  const imageUrl = car.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d';
  const bidAmount = car.currentBid ?? car.startingBid ?? 0;

  // Format currency
  const formattedBid = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(bidAmount);

  // Simple countdown string calculation for static presentation
  const getTimeRemaining = (auctionEnd?: string) => {
    if (!auctionEnd) return 'Unknown';
    const end = new Date(auctionEnd).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const endMs = car.auctionEnd ? new Date(car.auctionEnd).getTime() : 0;
  const startMs = car.auctionStart ? new Date(car.auctionStart).getTime() : 0;
  const isEndingSoon = car.status === 'live' && endMs > 0 && startMs > 0 && endMs - startMs < 48 * 60 * 60 * 1000;

  return (
    <Link
      href={`/car/${car._id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-emerald-500/50"
    >
      {/* Image Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${car.year || ''} ${car.make || ''} ${car.model || ''}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/30" />

        {/* Condition Badge Top Left */}
        {car.condition && (
          <div className="absolute left-3 top-3">
            <span className="rounded-xl bg-zinc-950/80 backdrop-blur border border-white/10 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
              {car.condition}
            </span>
          </div>
        )}

        {/* Status Pill Top Right */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {car.status === 'live' && (
            <span
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-black shadow-lg ${
                isEndingSoon ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping" />
              {isEndingSoon ? 'Ending Soon' : 'LIVE'}
            </span>
          )}
          {car.status === 'upcoming' && (
            <span className="rounded-xl bg-blue-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black">
              Upcoming
            </span>
          )}
          {car.status === 'ended' && (
            <span className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Ended
            </span>
          )}
        </div>

        {/* Floating Bid Count Bottom Right */}
        {car.bidCount !== undefined && (
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-xl bg-zinc-950/80 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white border border-white/10">
            <Gavel className="h-3.5 w-3.5 text-emerald-400" />
            <span>{car.bidCount} bids</span>
          </div>
        )}
      </div>

      {/* Details Body */}
      <div className="flex flex-1 flex-col p-5 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-extrabold text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
        </div>

        {/* Spec Pill Tags */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-1">
            <Gauge className="h-3.5 w-3.5 text-emerald-400" />
            {(car.mileage ?? 0).toLocaleString()} mi
          </span>
          {car.fuelType && (
            <span className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-1">
              <Fuel className="h-3.5 w-3.5 text-emerald-400" />
              {car.fuelType}
            </span>
          )}
          {car.transmission && (
            <span className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-1">
              {car.transmission}
            </span>
          )}
        </div>

        {/* Footer info: Bid & Countdown */}
        <div className="mt-auto border-t border-border/80 pt-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {car.status === 'ended' ? 'Winning Bid' : 'Current Bid'}
            </p>
            <p className="text-xl font-mono font-extrabold text-emerald-400 tracking-tight">
              {formattedBid}
            </p>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-300 justify-end">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>{getTimeRemaining(car.auctionEnd)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
