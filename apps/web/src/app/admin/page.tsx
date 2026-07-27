'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { useGetAdminAnalyticsQuery } from '@/store/services/adminApi';
import { Gavel, DollarSign, Users, Car } from 'lucide-react';

// Code-split heavy Recharts library so main app bundle is untouched
const AdminAnalyticsCharts = dynamic(
  () => import('@/components/admin/AdminAnalyticsCharts').then((mod) => mod.AdminAnalyticsCharts),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center rounded-3xl border border-border bg-card p-6 text-xs text-muted-foreground animate-pulse">
        Loading interactive analytics charts…
      </div>
    ),
    ssr: false,
  },
);

export default function AdminDashboardPage() {
  const { data: analytics, isLoading, isError } = useGetAdminAnalyticsQuery();

  const formattedVolume = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(analytics?.totalBidVolume || 0);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Overview & Analytics
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time platform metrics powered by MongoDB aggregation pipelines
            </p>
          </div>
          <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            System Online
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm font-semibold text-muted-foreground animate-pulse">
            Computing system analytics…
          </div>
        ) : isError || !analytics ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center text-xs text-red-400">
            Failed to load admin analytics. Ensure your user account has the <code className="font-bold">admin</code> role.
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Auctions */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Auctions</span>
                  <Gavel className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {analytics.totalActiveAuctions}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {analytics.listingsByStatus.live} live listings currently taking bids
                </p>
              </div>

              {/* Total Bid Volume */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Bid Volume</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-mono font-extrabold tracking-tight text-emerald-400">
                  {formattedVolume}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Aggregate valuation across platform inventory
                </p>
              </div>

              {/* Total Registered Users */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Registered Users</span>
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {analytics.totalUsers}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Buyers, sellers, and system accounts
                </p>
              </div>

              {/* Total Listings */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Listings</span>
                  <Car className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {analytics.listingsByStatus.live + analytics.listingsByStatus.ended + analytics.listingsByStatus.upcoming}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {analytics.listingsByStatus.ended} ended • {analytics.listingsByStatus.upcoming} upcoming
                </p>
              </div>
            </div>

            {/* Code-Split Recharts Analytics Charts */}
            <AdminAnalyticsCharts
              topBrands={analytics.topBrands}
              listingsByStatus={analytics.listingsByStatus}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
