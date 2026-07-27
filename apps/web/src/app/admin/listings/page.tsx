'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import {
  AdminTableRow,
  AdminTableHeaderCell,
  AdminTableCell,
} from '@/components/admin/AdminTableRow';
import {
  useGetAdminListingsQuery,
  useUpdateListingStatusMutation,
} from '@/store/services/adminApi';
import type { ICar, IUserPublic } from '@car-auction/shared';
import { Search, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function AdminListingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const { data: cars = [], isLoading, isError } = useGetAdminListingsQuery({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const [updateStatusMutation, { isLoading: isUpdating }] = useUpdateListingStatusMutation();

  const [selectedCar, setSelectedCar] = useState<ICar | null>(null);
  const [targetStatus, setTargetStatus] = useState<'live' | 'ended' | 'upcoming'>('ended');
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleOpenModal = (car: ICar, status: 'live' | 'ended' | 'upcoming') => {
    setSelectedCar(car);
    setTargetStatus(status);
    setReason('');
    setErrorMsg('');
    setFeedback('');
  };

  const handleSubmitStatusUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !reason.trim()) return;

    setErrorMsg('');
    try {
      const res = await updateStatusMutation({
        id: selectedCar._id,
        status: targetStatus,
        reason: reason.trim(),
      }).unwrap();

      setFeedback(res.message);
      setTimeout(() => {
        setSelectedCar(null);
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg((err as { data?: { message?: string } })?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Vehicle Listing Moderation
            </h1>
            <p className="text-xs text-muted-foreground">
              Review, force-close, suspend, or reactivate platform auction listings
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search make or model..."
                className="rounded-xl border border-input bg-zinc-950 pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter pill */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-input bg-zinc-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="live">Live Only</option>
              <option value="ended">Ended Only</option>
              <option value="upcoming">Upcoming Only</option>
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-semibold text-muted-foreground animate-pulse">
              Loading platform listings…
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-xs text-red-400">
              Failed to load admin listings.
            </div>
          ) : cars.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No vehicle listings match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <AdminTableHeaderCell>Vehicle</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Seller</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Status</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Current Bid</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Bids</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Actions</AdminTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => {
                    const sellerObj = typeof car.sellerId === 'object' ? (car.sellerId as IUserPublic) : null;
                    const sellerName = sellerObj ? sellerObj.name : 'Unknown';
                    const sellerEmail = sellerObj ? sellerObj.email : '';

                    return (
                      <AdminTableRow key={car._id}>
                        <AdminTableCell>
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={car.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'}
                              alt=""
                              className="h-9 w-12 object-cover rounded-lg bg-zinc-900 border border-zinc-800"
                            />
                            <div>
                              <Link
                                href={`/car/${car._id}`}
                                className="font-bold hover:text-emerald-400 transition-colors line-clamp-1"
                              >
                                {car.year} {car.make} {car.model}
                              </Link>
                              <span className="text-[10px] text-muted-foreground">ID: {car._id}</span>
                            </div>
                          </div>
                        </AdminTableCell>

                        <AdminTableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{sellerName}</span>
                            <span className="text-[10px] text-muted-foreground">{sellerEmail}</span>
                          </div>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              car.status === 'live'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : car.status === 'ended'
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {car.status}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span className="font-mono font-bold text-emerald-400">
                            ${(car.currentBid || 0).toLocaleString()}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span className="font-semibold">{car.bidCount || 0}</span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <div className="flex items-center gap-2">
                            {car.status === 'live' && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(car, 'ended')}
                                className="rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                Force Close
                              </button>
                            )}

                            {car.status === 'ended' && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(car, 'live')}
                                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </AdminTableCell>
                      </AdminTableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Confirmation Modal */}
        {selectedCar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Listing Moderation Action
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCar(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {feedback ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-emerald-400">{feedback}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitStatusUpdate} className="space-y-4">
                  {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

                  <p className="text-xs text-muted-foreground">
                    Update status for <strong>{selectedCar.year} {selectedCar.make} {selectedCar.model}</strong> to <code className="font-bold uppercase text-emerald-400">{targetStatus}</code>.
                  </p>

                  <div className="space-y-1">
                    <label htmlFor="reason" className="text-xs font-bold text-zinc-300">
                      Reason for Moderation (Required)
                    </label>
                    <textarea
                      id="reason"
                      required
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Terms violation, fraudulent bidding, or seller request..."
                      className="w-full rounded-2xl border border-input bg-zinc-950 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setSelectedCar(null)}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-black hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating…' : 'Confirm Action'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
