'use client';

import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Carousel } from '@/components/shared/Carousel';
import { QuickSearchPanel } from '@/components/shared/QuickSearchPanel';
import { CarCard } from '@/components/shared/CarCard';
import { CarCardSkeleton } from '@/components/ui/Skeleton';
import { useGetFeaturedCarsQuery } from '@/store/services/carsApi';
import { Flame, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { data: featuredCars = [], isLoading } = useGetFeaturedCarsQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Carousel & Quick Search Overlay */}
        <section className="relative px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <Carousel />
          <QuickSearchPanel />
        </section>

        {/* Featured Listings Section */}
        <section className="px-4 py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                <Flame className="h-3.5 w-3.5 fill-amber-500" />
                Featured Auctions
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ending Soonest</h2>
              <p className="text-sm text-muted-foreground mt-1">
                High-demand auctions closing in the next few hours. Place your bid before time runs out.
              </p>
            </div>

            <Link
              href="/search?status=live"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline group"
            >
              View All Live Auctions
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredCars.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card/50">
              <p className="text-muted-foreground text-sm">No live featured auctions currently active.</p>
              <Link href="/search" className="text-xs text-primary underline mt-2 inline-block font-semibold">
                Browse All Listings
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.map((car) => (
                <CarCard key={car._id} car={car} />
              ))}
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="border-t border-border bg-card/40 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <div className="max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Transparent & Secure
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">How RevBid Auctions Work</h2>
              <p className="text-sm text-muted-foreground">
                Experience dynamic live bidding with real-time countdown enforcement, anti-sniping protection, and transparent history.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="rounded-2xl border border-border bg-card p-8 text-left space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 font-bold text-lg">
                  01
                </div>
                <h3 className="text-lg font-bold">Discover Verified Vehicles</h3>
                <p className="text-sm text-muted-foreground">
                  Browse curated high-res galleries, detailed spec sheets, VIN verification reports, and seller notes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-border bg-card p-8 text-left space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 font-bold text-lg">
                  02
                </div>
                <h3 className="text-lg font-bold">Bid Live with Concurrency Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Place atomic bids in real-time. Anti-sniping auto-extends the timer by 2 minutes if a bid lands in the last 60 seconds.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-border bg-card p-8 text-left space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold text-lg">
                  03
                </div>
                <h3 className="text-lg font-bold">Win & Finalize Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Winning bidders lock in the vehicle with escrow-style payment protection and direct seller contact for pickup.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
