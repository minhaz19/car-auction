'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, Users, ShieldAlert, ArrowLeft } from 'lucide-react';

export function AdminNavbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Analytics Dashboard', icon: LayoutDashboard },
    { href: '/admin/listings', label: 'Listing Moderation', icon: Car },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/disputes', label: 'Dispute Queue', icon: ShieldAlert },
  ];

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            User Area
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-extrabold text-sm text-foreground tracking-tight">
              RevBid Admin Portal
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
