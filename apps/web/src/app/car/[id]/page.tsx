'use client';

import { use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { SpecSheet } from '@/components/shared/SpecSheet';
import { AuctionPanel } from '@/components/shared/AuctionPanel';
import { BidHistoryList } from '@/components/shared/BidHistoryList';
import { SellerRatingBadge } from '@/components/shared/SellerRatingBadge';
import { useGetCarByIdQuery } from '@/store/services/carsApi';
import { useAuctionRoom } from '@/hooks/useAuctionRoom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: car, isLoading, isError } = useGetCarByIdQuery(id);
  const auctionRoom = useAuctionRoom(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Loading vehicle auction room…
          </p>
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
            The car auction listing you requested does not exist or has been removed.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search Results
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search Results
          </Link>
        </div>

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {car.condition}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                VIN Verified
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {car.year} {car.make} {car.model}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {car.sellerId && (
              <SellerRatingBadge
                sellerId={typeof car.sellerId === 'object' && car.sellerId !== null ? (car.sellerId as { _id: string })._id : String(car.sellerId)}
                size="md"
              />
            )}
            {car.status === 'live' && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live Auction Room
              </span>
            )}
          </div>
        </div>

        {/* Main 2-Column Auction Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Image Gallery, Specs, Description & Bid History */}
          <div className="lg:col-span-2 space-y-8">
            <ImageGallery
              images={car.images}
              title={`${car.year} ${car.make} ${car.model}`}
            />
            <SpecSheet car={car} />
            <BidHistoryList carId={car._id} />
          </div>

          {/* Right Column: Sticky Real-time Auction Bidding Panel */}
          <div className="lg:col-span-1">
            <AuctionPanel
              car={car}
              watcherCount={auctionRoom.watcherCount}
              serverTimeOffset={auctionRoom.serverTimeOffset}
              isExtendedAlert={auctionRoom.isExtendedAlert}
              latestAuctionEnd={auctionRoom.latestAuctionEnd}
              isConnected={auctionRoom.isConnected}
              isReconnecting={auctionRoom.isReconnecting}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
