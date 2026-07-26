'use client';

import type { ICar } from '@car-auction/shared';
import { UserCheck, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface SpecSheetProps {
  car: ICar;
}

export function SpecSheet({ car }: SpecSheetProps) {
  const sellerName =
    typeof car.sellerId === 'object' && car.sellerId !== null && 'name' in car.sellerId
      ? (car.sellerId as { name: string }).name
      : 'Verified Seller';

  const sellerEmail =
    typeof car.sellerId === 'object' && car.sellerId !== null && 'email' in car.sellerId
      ? (car.sellerId as { email: string }).email
      : 'seller@revbid.dev';

  return (
    <div className="space-y-6">
      {/* Seller Profile Card */}
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-foreground">{sellerName}</h4>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">{sellerEmail} • Verified Member</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Seller Guarantee
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">Vehicle Specifications</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Make</span>
            <span className="font-bold text-sm text-foreground">{car.make}</span>
          </div>
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Model</span>
            <span className="font-bold text-sm text-foreground">{car.model}</span>
          </div>
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Year</span>
            <span className="font-bold text-sm text-foreground">{car.year}</span>
          </div>
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Mileage</span>
            <span className="font-bold text-sm text-foreground">
              {car.mileage.toLocaleString()} mi
            </span>
          </div>
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Condition</span>
            <span className="font-bold text-sm text-foreground">{car.condition}</span>
          </div>
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Body Type</span>
            <span className="font-bold text-sm text-foreground">{car.bodyType}</span>
          </div>
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Transmission</span>
            <span className="font-bold text-sm text-foreground">{car.transmission}</span>
          </div>
          <div className="space-y-0.5 rounded-xl bg-muted/40 p-3">
            <span className="text-muted-foreground block font-medium">Fuel Type</span>
            <span className="font-bold text-sm text-foreground">{car.fuelType}</span>
          </div>
        </div>
      </div>

      {/* Seller Notes & Description */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-3 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Seller Notes & Description</h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {car.description}
        </p>
      </div>
    </div>
  );
}
