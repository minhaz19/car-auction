'use client';

import { useGetUserReviewsQuery } from '@/store/services/usersApi';
import { Star } from 'lucide-react';

interface SellerRatingBadgeProps {
  sellerId: string;
  size?: 'sm' | 'md';
}

export function SellerRatingBadge({ sellerId, size = 'sm' }: SellerRatingBadgeProps) {
  const { data } = useGetUserReviewsQuery(sellerId, { skip: !sellerId });

  if (!data || data.totalReviews === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Star className="h-3 w-3 text-muted-foreground/60" />
        New Seller
      </span>
    );
  }

  const starSizeClass = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
  const textSizeClass = size === 'md' ? 'text-xs' : 'text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 font-extrabold text-amber-500 ${textSizeClass}`}
      title={`${data.averageRating} star average based on ${data.totalReviews} verified reviews`}
    >
      <Star className={`${starSizeClass} fill-amber-400 text-amber-400`} />
      <span>{data.averageRating.toFixed(1)}</span>
      <span className="opacity-70 font-semibold">({data.totalReviews})</span>
    </span>
  );
}
