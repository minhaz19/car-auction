import Link from 'next/link';
import { Car, Send, ShieldCheck, Zap, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Car className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">RevBid</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              The premium real-time car auction platform. Buy and sell exotic, sports, luxury, and daily vehicles with concurrency-safe live bidding.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Verified Sellers
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                Real-Time Bids
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-blue-500" />
                Auction Guarantee
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  All Auctions
                </Link>
              </li>
              <li>
                <Link href="/search?status=live" className="hover:text-foreground transition-colors">
                  Live Auctions
                </Link>
              </li>
              <li>
                <Link href="/search?status=endingSoonest" className="hover:text-foreground transition-colors">
                  Ending Soon
                </Link>
              </li>
              <li>
                <Link href="/dashboard/sell" className="hover:text-foreground transition-colors">
                  Sell Your Car
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Support & Info</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">
                  How Auctions Work
                </a>
              </li>
              <li>
                <a href="#buyer-protection" className="hover:text-foreground transition-colors">
                  Buyer Protection
                </a>
              </li>
              <li>
                <a href="#anti-sniping" className="hover:text-foreground transition-colors">
                  Anti-Sniping Rules
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Stay Updated</h4>
            <p className="text-xs text-muted-foreground">
              Get notified about rare car drops and ending auctions.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-1.5">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="rounded-lg bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} RevBid Platform Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:underline">
              Terms of Use
            </a>
            <a href="#cookies" className="hover:underline">
              Cookie Preferences
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
