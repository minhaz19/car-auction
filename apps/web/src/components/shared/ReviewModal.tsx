'use client';

import { useState, FormEvent } from 'react';
import { useSubmitTransactionReviewMutation } from '@/store/services/transactionsApi';
import { Star, Send, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ transactionId, isOpen, onClose }: ReviewModalProps) {
  const [submitReviewMutation, { isLoading: isSubmitting }] = useSubmitTransactionReviewMutation();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!comment.trim()) {
      setErrorMsg('Please write a review comment.');
      return;
    }

    try {
      const res = await submitReviewMutation({
        transactionId,
        rating,
        comment: comment.trim(),
      }).unwrap();

      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg((err as { data?: { message?: string } })?.data?.message || 'Failed to submit review.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-extrabold text-foreground text-base">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            Rate & Review Seller
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-400">{successMsg}</p>
            <p className="text-xs text-muted-foreground">Thank you for leaving a verified review!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-semibold text-red-400">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Star Rating Picker */}
            <div className="space-y-1 text-center py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Overall Experience Rating
              </span>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-1">
              <label htmlFor="review-comment" className="text-xs font-bold text-zinc-300">
                Written Feedback
              </label>
              <textarea
                id="review-comment"
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about vehicle condition accuracy, communication, and handoff experience..."
                className="w-full rounded-2xl border border-input bg-zinc-950 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-extrabold text-black shadow hover:bg-emerald-400 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
