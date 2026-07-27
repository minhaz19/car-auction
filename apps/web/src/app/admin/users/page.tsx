'use client';

import { useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import {
  AdminTableRow,
  AdminTableHeaderCell,
  AdminTableCell,
} from '@/components/admin/AdminTableRow';
import {
  useGetAdminUsersQuery,
  useSuspendUserMutation,
} from '@/store/services/adminApi';
import type { IAdminUser } from '@car-auction/shared';
import { UserX, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: users = [], isLoading, isError } = useGetAdminUsersQuery();
  const [suspendUserMutation] = useSuspendUserMutation();

  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleToggleSuspend = async (user: IAdminUser) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    setLoadingUserId(user._id);
    setFeedback('');
    setErrorMsg('');

    try {
      const res = await suspendUserMutation({
        id: user._id,
        status: nextStatus,
      }).unwrap();

      setFeedback(res.message);
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    } catch (err: unknown) {
      setErrorMsg((err as { data?: { message?: string } })?.data?.message || 'Failed to update user status.');
    } finally {
      setLoadingUserId(null);
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
              User Management & Access Control
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage accounts, roles, and enforce account suspensions across buyers and sellers
            </p>
          </div>
        </div>

        {feedback && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-400">
            <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-semibold text-muted-foreground animate-pulse">
              Loading platform user accounts…
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-xs text-red-400">
              Failed to load admin user list.
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No registered user accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <AdminTableHeaderCell>User</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Role</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Account Status</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Joined Date</AdminTableHeaderCell>
                    <AdminTableHeaderCell>Actions</AdminTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isBusy = loadingUserId === u._id;
                    const isSuspended = u.status === 'suspended';

                    return (
                      <AdminTableRow key={u._id}>
                        <AdminTableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              u.role === 'admin'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : u.role === 'seller'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              isSuspended
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <UserX className="h-3 w-3" /> Suspended
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3" /> Active
                              </>
                            )}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </AdminTableCell>

                        <AdminTableCell>
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleSuspend(u)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-40 ${
                                isSuspended
                                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                                  : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'
                              }`}
                            >
                              {isBusy
                                ? 'Updating…'
                                : isSuspended
                                ? 'Reinstate Account'
                                : 'Suspend Account'}
                            </button>
                          )}
                        </AdminTableCell>
                      </AdminTableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
