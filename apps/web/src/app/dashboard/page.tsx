'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>!
        </p>
        <p className="text-sm text-muted-foreground">
          Role: <span className="capitalize">{user?.role}</span>
        </p>
      </div>

      <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-6 py-4 max-w-md text-center">
        🚧 Dashboard content coming in Phase 2. Auth is working if you can see this page.
      </p>

      <button
        id="logout-btn"
        onClick={logout}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        Log out
      </button>
    </main>
  );
}
