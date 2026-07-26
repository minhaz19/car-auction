'use client';

import { useState } from 'react';
import { useGetCarBidsQuery } from '@/store/services/carsApi';
import { Gavel, ChevronLeft, ChevronRight } from 'lucide-react';

interface BidHistoryListProps {
  carId: string;
}

export function BidHistoryList({ carId }: BidHistoryListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetCarBidsQuery({ id: carId, page, limit: 5 });

  const bids = data?.bids || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Pure date formatting
  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-bold text-foreground text-base">
          <Gavel className="h-4 w-4 text-primary" />
          Bid History ({total})
        </div>
        <span className="text-xs text-muted-foreground font-medium">Newest first</span>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : bids.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border rounded-2xl bg-muted/20">
          <p className="text-xs text-muted-foreground">No bids have been placed on this auction yet.</p>
          <p className="text-xs font-semibold text-primary mt-1">Be the first to place a bid!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bids.map((bid, idx) => {
            const formattedAmount = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(bid.amount);

            const isHighest = idx === 0 && page === 1;

            return (
              <div
                key={bid._id}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 border transition-colors ${
                  isHighest
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border/60 bg-background/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                      isHighest
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {bid.maskedBidderName?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {bid.maskedBidderName || 'B***r'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatTime(bid.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-foreground block">
                    {formattedAmount}
                  </span>
                  {isHighest ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Highest Bidder
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {bid.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
