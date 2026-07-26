'use client';

import Link from 'next/link';
import type { ICar } from '@car-auction/shared';
import { Clock, Gavel, Fuel, Gauge } from 'lucide-react';

interface CarCardProps {
  car: ICar;
}

export function CarCard({ car }: CarCardProps) {
  const imageUrl = car.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d';

  // Format currency
  const formattedBid = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(car.currentBid);

  // Simple countdown string calculation for static presentation
  const getTimeRemaining = (auctionEnd: string) => {
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

  const endMs = new Date(car.auctionEnd).getTime();
  const startMs = new Date(car.auctionStart).getTime();
  // Pure condition check
  const isEndingSoon = car.status === 'live' && endMs - startMs < 48 * 60 * 60 * 1000;

  return (
    <Link
      href={`/car/${car._id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Image Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Condition Badge Top Left */}
        <div className="absolute left-3 top-3">
          <span className="rounded-lg bg-black/60 backdrop-blur border border-white/20 px-2.5 py-1 text-xs font-semibold text-white">
            {car.condition}
          </span>
        </div>

        {/* Status Pill Top Right */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {car.status === 'live' && (
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md ${
                isEndingSoon ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              {isEndingSoon ? 'Ending Soon' : 'Live Auction'}
            </span>
          )}
          {car.status === 'upcoming' && (
            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Upcoming
            </span>
          )}
          {car.status === 'ended' && (
            <span className="rounded-lg bg-neutral-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-neutral-300">
              Ended
            </span>
          )}
        </div>

        {/* Floating Bid Count Bottom Right */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur px-2 py-0.5 text-xs text-white">
          <Gavel className="h-3 w-3 text-amber-400" />
          <span>{car.bidCount} bids</span>
        </div>
      </div>

      {/* Details Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
        </div>

        {/* Spec Pill Tags */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
            <Gauge className="h-3 w-3" />
            {car.mileage.toLocaleString()} mi
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
            <Fuel className="h-3 w-3" />
            {car.fuelType}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
            {car.transmission}
          </span>
        </div>

        {/* Footer info: Bid & Countdown */}
        <div className="mt-auto border-t border-border pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {car.status === 'ended' ? 'Winning Bid' : 'Current Bid'}
            </p>
            <p className="text-xl font-extrabold text-foreground tracking-tight">{formattedBid}</p>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground justify-end">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{getTimeRemaining(car.auctionEnd)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
