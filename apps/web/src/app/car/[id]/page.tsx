'use client';

import { use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { useGetCarByIdQuery } from '@/store/services/carsApi';
import { ArrowLeft, Clock, Gavel, UserCheck } from 'lucide-react';

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: car, isLoading, isError } = useGetCarByIdQuery(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading car details…</p>
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
          <h1 className="text-2xl font-bold">Vehicle Listing Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The car listing you requested does not exist or was removed.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedCurrentBid = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(car.currentBid);

  const formattedStartingBid = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(car.startingBid);

  const sellerName =
    typeof car.sellerId === 'object' && car.sellerId !== null && 'name' in car.sellerId
      ? (car.sellerId as { name: string }).name
      : 'Verified Seller';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search Results
          </Link>
        </div>

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {car.condition}
              </span>
              <span className="rounded-lg bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                VIN Verified
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {car.year} {car.make} {car.model}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              {car.status} Auction
            </span>
          </div>
        </div>

        {/* Gallery & Live Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-neutral-900 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={car.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Thumbnail Row */}
            {car.images && car.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {car.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-[16/10] overflow-hidden rounded-xl border border-border bg-neutral-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="Thumbnail" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
              <h3 className="text-lg font-bold">Seller Notes & Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {car.description}
              </p>
            </div>
          </div>

          {/* Right Column: Live Auction Status Panel Placeholder */}
          <div className="space-y-6">
            {/* Price & Bid Card */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-6 shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Highest Bid
                </span>
                <div className="text-4xl font-extrabold tracking-tight text-foreground mt-1">
                  {formattedCurrentBid}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Starting bid: {formattedStartingBid} • {car.bidCount} bids placed
                </p>
              </div>

              {/* Countdown Placeholder */}
              <div className="rounded-2xl bg-muted/60 p-4 border border-border space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    Time Remaining
                  </span>
                  <span className="text-foreground">Server Authoritative</span>
                </div>
                <div className="text-xl font-mono font-bold text-foreground">
                  {new Date(car.auctionEnd).toLocaleString()}
                </div>
              </div>

              {/* Live Bidding Note */}
              <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Gavel className="h-4 w-4" />
                  Live Auction Room Preview
                </p>
                <p className="opacity-90">
                  Real-time bidding, Socket.io feed, and concurrency-safe transactions are coming in Phase 4.
                </p>
              </div>

              {/* Seller Badge */}
              <div className="border-t border-border pt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Seller: {sellerName}</span>
                </div>
                <span className="text-muted-foreground">Verified</span>
              </div>
            </div>

            {/* Spec Sheet Table */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold">Vehicle Specifications</h3>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Make</span>
                  <span className="font-bold text-foreground">{car.make}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Model</span>
                  <span className="font-bold text-foreground">{car.model}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Year</span>
                  <span className="font-bold text-foreground">{car.year}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Mileage</span>
                  <span className="font-bold text-foreground">
                    {car.mileage.toLocaleString()} mi
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Body Type</span>
                  <span className="font-bold text-foreground">{car.bodyType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Transmission</span>
                  <span className="font-bold text-foreground">{car.transmission}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Fuel Type</span>
                  <span className="font-bold text-foreground">{car.fuelType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Exterior Color</span>
                  <span className="font-bold text-foreground">{car.color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
