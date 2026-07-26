'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { CarCard } from '@/components/shared/CarCard';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetUserBidsQuery,
  useGetCarsQuery,
} from '@/store/services/carsApi';
import {
  useGetWatchlistQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useUpdateRoleMutation,
} from '@/store/services/usersApi';
import {
  useGetUserTransactionsQuery,
} from '@/store/services/transactionsApi';
import { Skeleton, CarCardSkeleton, DashboardBannerSkeleton } from '@/components/ui/Skeleton';
import type { ICar } from '@car-auction/shared';
import {
  Gavel,
  Heart,
  Bell,
  Car,
  PlusCircle,
  ShieldAlert,
  CheckCircle2,
  Trophy,
  XCircle,
  Clock,
  CreditCard,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'bids' | 'watchlist' | 'notifications' | 'listings'>('bids');

  // Queries (skipped until session restoration produces accessToken)
  const { data: userBids = [], isLoading: bidsLoading } = useGetUserBidsQuery(undefined, { skip: !accessToken });
  const { data: watchlistCars = [], isLoading: watchlistLoading } = useGetWatchlistQuery(undefined, { skip: !accessToken });
  const { data: notifData, isLoading: notifLoading } = useGetNotificationsQuery(undefined, { skip: !accessToken });
  const { data: userTransactions = [] } = useGetUserTransactionsQuery(undefined, { skip: !accessToken });
  const { data: sellerCarsData } = useGetCarsQuery(
    { limit: 50 },
    { skip: !accessToken || (user?.role !== 'seller' && user?.role !== 'admin') },
  );

  // Mutations
  const [updateRole, { isLoading: isUpgrading }] = useUpdateRoleMutation();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const [roleMessage, setRoleMessage] = useState('');

  const handleUpgradeRole = async () => {
    try {
      const res = await updateRole({ role: 'seller' }).unwrap();
      setRoleMessage(res.message);
      // Reload page after role upgrade to sync state
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setRoleMessage('Failed to upgrade account role.');
    }
  };

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <DashboardBannerSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CarCardSkeleton />
            <CarCardSkeleton />
            <CarCardSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* User Profile Banner */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold">{user?.name}</h1>
                <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-bold text-primary uppercase">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
          </div>

          {!isSeller ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 max-w-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4" />
                Seller Account Status
              </div>
              <p className="text-xs text-muted-foreground">
                Currently registered as a Buyer. Upgrade to a Seller account to list vehicles for auction!
              </p>
              {roleMessage ? (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{roleMessage}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleUpgradeRole}
                  disabled={isUpgrading}
                  className="w-full rounded-xl bg-amber-600 text-white px-3 py-2 text-xs font-bold shadow hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isUpgrading ? 'Upgrading…' : 'Upgrade to Seller Account (Free)'}
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/dashboard/sell"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="h-5 w-5" />
              Create New Listing
            </Link>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('bids')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'bids'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gavel className="h-4 w-4" />
            My Bids ({userBids.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'watchlist'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className="h-4 w-4" />
            Watchlist ({watchlistCars.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'notifications'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications ({notifData?.unreadCount || 0})
          </button>

          {isSeller && (
            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                activeTab === 'listings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Car className="h-4 w-4" />
              My Listings
            </button>
          )}
        </div>

        {/* Tab 1: My Bids */}
        {activeTab === 'bids' && (
          <div className="space-y-6">
            {bidsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CarCardSkeleton />
                <CarCardSkeleton />
                <CarCardSkeleton />
              </div>
            ) : userBids.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4">
                <Gavel className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="text-lg font-bold">No Active Bids</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  You have not placed bids on any vehicle auctions yet.
                </p>
                <Link
                  href="/search"
                  className="inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  Browse Auctions
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userBids.map((b) => {
                  const carObj = b.carId as unknown as ICar;
                  if (!carObj || typeof carObj !== 'object') return null;

                  // Find matching transaction for won bids
                  const matchingTx = userTransactions.find((tx) => {
                    if (!tx.carId) return false;
                    const txCarId = typeof tx.carId === 'object' && tx.carId !== null ? (tx.carId as { _id: string })._id : tx.carId;
                    return String(txCarId) === String(carObj._id);
                  });

                  const isWon = b.status === 'won' || (carObj.status === 'ended' && b.amount >= (carObj.currentBid || 0));

                  return (
                    <div key={b._id} className="relative group space-y-2">
                      <CarCard car={carObj} />
                      <div className="flex items-center justify-between px-2 text-xs font-bold">
                        <span className="text-muted-foreground">Your Bid: ${b.amount.toLocaleString()}</span>
                        {isWon ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <Trophy className="h-3.5 w-3.5" /> Won Auction
                          </span>
                        ) : b.status === 'active' ? (
                          <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            <Clock className="h-3.5 w-3.5" /> Highest Bidder
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                            <XCircle className="h-3.5 w-3.5" /> Outbid
                          </span>
                        )}
                      </div>

                      {/* Checkout CTA for Won Auctions */}
                      {isWon && (
                        matchingTx?.status === 'paid' ? (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" /> Paid & Confirmed
                          </div>
                        ) : matchingTx ? (
                          <Link
                            href={`/dashboard/checkout/${matchingTx._id}`}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white py-2 text-xs font-extrabold shadow-md hover:bg-emerald-700 transition-colors animate-pulse"
                          >
                            <CreditCard className="h-4 w-4" /> Payment Due — Complete Checkout
                          </Link>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/80 text-white py-2 text-xs font-extrabold shadow-md">
                            <CreditCard className="h-4 w-4" /> Auction Won — Generating Checkout…
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Watchlist */}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            {watchlistLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CarCardSkeleton />
                <CarCardSkeleton />
                <CarCardSkeleton />
              </div>
            ) : watchlistCars.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4">
                <Heart className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="text-lg font-bold">Your Watchlist is Empty</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Click the heart icon on any car detail page to save auctions here.
                </p>
                <Link
                  href="/search"
                  className="inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  Explore Vehicles
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchlistCars.map((car) => (
                  <CarCard key={car._id} car={car} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold">Notification History</h3>
              {notifData && notifData.unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              )}
            </div>

            {notifLoading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : !notifData || notifData.notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No notifications found.</p>
            ) : (
              <div className="space-y-2">
                {notifData.notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && markRead(n._id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      n.read
                        ? 'border-border/60 bg-card/40 text-muted-foreground'
                        : 'border-primary/40 bg-primary/5 font-semibold text-foreground shadow-sm'
                    }`}
                  >
                    <div>
                      <p className="text-sm">{n.message}</p>
                      <span className="text-[11px] text-muted-foreground block mt-1">
                        {new Date(n.createdAt).toLocaleDateString()} at{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {!n.read && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Seller Listings */}
        {activeTab === 'listings' && isSeller && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Your Created Auction Listings</h3>
              <Link
                href="/dashboard/sell"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Listing
              </Link>
            </div>

            {sellerCarsData && sellerCarsData.cars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerCarsData.cars.map((car) => (
                  <div key={car._id} className="relative space-y-2">
                    <CarCard car={car} />
                    <Link
                      href={`/dashboard/sell/${car._id}`}
                      className="block text-center rounded-xl border border-border bg-muted/40 py-2 text-xs font-bold hover:bg-muted transition-colors"
                    >
                      Manage Seller Dashboard
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                You have not created any auction listings yet.
              </p>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
