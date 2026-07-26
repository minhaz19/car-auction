'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/store/services/usersApi';
import type { INotification } from '@car-auction/shared';
import {
  Car,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Bell,
  CheckCheck,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // RTK Query Notifications
  const { data: notifData } = useGetNotificationsQuery(undefined, { skip: !isAuthenticated });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const [realtimeNotifications, setRealtimeNotifications] = useState<INotification[]>([]);

  // Listen for real-time notification:new socket event
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onNewNotification = (newNotif: INotification) => {
      setRealtimeNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on('notification:new', onNewNotification);

    return () => {
      socket.off('notification:new', onNewNotification);
    };
  }, [isAuthenticated]);

  // Combine query data + real-time incoming pushes without side effects inside render
  const fetchedList = notifData?.notifications || [];
  const combinedNotifications = [
    ...realtimeNotifications.filter(
      (rn) => !fetchedList.some((fn) => fn._id === rn._id),
    ),
    ...fetchedList,
  ];

  const unreadCount =
    (notifData?.unreadCount || 0) +
    realtimeNotifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Car className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            RevBid
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/search" className="transition-colors hover:text-foreground">
            Buy Cars
          </Link>
          <Link
            href={isAuthenticated ? '/dashboard/sell' : '/auth/login?redirect=/dashboard/sell'}
            className="transition-colors hover:text-foreground"
          >
            Sell a Car
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
            How It Works
          </Link>
        </nav>

        {/* Right Actions / Auth State */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted shadow-sm transition-all"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-2xl z-50 space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2 px-1">
                      <span className="text-xs font-bold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            markAllRead();
                            setRealtimeNotifications([]);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                      {combinedNotifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          No notifications yet.
                        </p>
                      ) : (
                        combinedNotifications.slice(0, 5).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => !n.read && markRead(n._id)}
                            className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                              n.read
                                ? 'border-border/40 bg-background/40 text-muted-foreground'
                                : 'border-primary/30 bg-primary/5 font-semibold text-foreground'
                            }`}
                          >
                            <p>{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="block text-center text-xs font-bold text-primary border-t border-border pt-2 hover:underline"
                    >
                      View all in Dashboard
                    </Link>
                  </div>
                )}
              </div>

              {/* User Account Menu Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotifDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-all hover:bg-muted focus:outline-none"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl transition-all z-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-xs font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-block mt-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {user.role}
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/sell"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Listing
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border md:hidden text-foreground"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card px-4 pt-3 pb-6 md:hidden space-y-4">
          <nav className="flex flex-col gap-3 font-medium text-sm text-muted-foreground">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-muted hover:text-foreground"
            >
              Buy Cars
            </Link>
            <Link
              href="/dashboard/sell"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-muted hover:text-foreground"
            >
              Sell a Car
            </Link>
          </nav>

          <div className="border-t border-border pt-4">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 pb-2">
                  <UserIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{user.name}</span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="block w-full text-left px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-lg border border-border py-2 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
