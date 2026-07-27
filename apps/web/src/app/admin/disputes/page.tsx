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
  useGetAdminDisputesQuery,
  useResolveDisputeMutation,
} from '@/store/services/adminApi';
import type { ICar, IUserPublic, ITransaction } from '@car-auction/shared';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function AdminDisputesPage() {
  const { data: disputes = [], isLoading, isError } = useGetAdminDisputesQuery();
  const [resolveDisputeMutation, { isLoading: isResolving }] = useResolveDisputeMutation();

  const [selectedTx, setSelectedTx] = useState<ITransaction | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleOpenResolveModal = (tx: ITransaction) => {
    setSelectedTx(tx);
    setNotes('');
    setFeedback('');
    setErrorMsg('');
  };

  const handleResolveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !notes.trim()) return;

    setErrorMsg('');
    try {
      const res = await resolveDisputeMutation({
        id: selectedTx._id,
        resolutionNotes: notes.trim(),
      }).unwrap();

      setFeedback(res.message);
      setTimeout(() => {
        setSelectedTx(null);
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg((err as { data?: { message?: string } })?.data?.message || 'Failed to resolve dispute.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Customer Support Dispute Queue
            </h1>
            <p className="text-xs text-muted-foreground">
              Review flagged vehicle transactions, adjudicate condition mismatches, and resolve escrow disputes
            </p>
          </div>
        </div>

        {/* Dispute Queue Table */}
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-semibold text-muted-foreground animate-pulse">
              Loading dispute queue…
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-xs text-red-400">
              Failed to load admin dispute queue.
            </div>
          ) : disputes.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-foreground">No Active Disputes</p>
              <p className="text-[11px]">All platform vehicle transactions are running smoothly!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <AdminTableHeaderCell>Transaction & Vehicle</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Parties (Buyer / Seller)</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Dispute Reason</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Status</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Action</AdminTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((tx) => {
                    const carObj = typeof tx.carId === 'object' ? (tx.carId as ICar) : null;
                    const buyerObj = typeof tx.buyerId === 'object' ? (tx.buyerId as IUserPublic) : null;
                    const sellerObj = typeof tx.sellerId === 'object' ? (tx.sellerId as IUserPublic) : null;

                    return (
                      <AdminTableRow key={tx._id}>
                        <AdminTableCell>
                          <div className="flex flex-col">
                            {carObj ? (
                              <Link
                                href={`/dashboard/transaction/${tx._id}`}
                                className="font-bold hover:text-emerald-400 transition-colors"
                              >
                                {carObj.year} {carObj.make} {carObj.model}
                              </Link>
                            ) : (
                              <span className="font-bold">Transaction {tx._id}</span>
                            )}
                            <span className="font-mono text-[10px] text-muted-foreground">
                              Valuation: ${(tx.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        </AdminTableCell>

                        <AdminTableCell>
                          <div className="flex flex-col text-[11px]">
                            <span>Buyer: <strong className="text-foreground">{buyerObj?.name || 'Unknown'}</strong></span>
                            <span>Seller: <strong className="text-foreground">{sellerObj?.name || 'Unknown'}</strong></span>
                          </div>
                        </AdminTableCell>

                        <AdminTableCell>
                          <p className="text-xs text-red-400 max-w-xs line-clamp-2 italic">
                            &quot;{tx.disputeReason || 'Unspecified dispute reason'}&quot;
                          </p>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] font-extrabold text-red-400 uppercase">
                            <ShieldAlert className="h-3 w-3" />
                            {tx.status}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <button
                            type="button"
                            onClick={() => handleOpenResolveModal(tx)}
                            className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors"
                          >
                            Resolve Dispute
                          </button>
                        </AdminTableCell>
                      </AdminTableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resolve Dispute Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Adjudicate & Resolve Dispute
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
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
                <form onSubmit={handleResolveSubmit} className="space-y-4">
                  {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

                  <p className="text-xs text-muted-foreground">
                    Closing dispute for Transaction <code className="font-bold">{selectedTx._id}</code>. Enter administrative resolution terms:
                  </p>

                  <div className="space-y-1">
                    <label htmlFor="notes" className="text-xs font-bold text-zinc-300">
                      Resolution Notes & Agreement (Required)
                    </label>
                    <textarea
                      id="notes"
                      required
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Inspected paperwork, mutual resolution agreed, initiating seller payout..."
                      className="w-full rounded-2xl border border-input bg-zinc-950 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setSelectedTx(null)}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResolving}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-black hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {isResolving ? 'Resolving…' : 'Mark Dispute Resolved'}
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
