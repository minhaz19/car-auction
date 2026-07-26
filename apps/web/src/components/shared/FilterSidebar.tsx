'use client';

import { useGetBrandsQuery, useGetModelsByBrandQuery } from '@/store/services/carsApi';
import type {
  CarFilterParams,
  AuctionStatus,
  CarCondition,
  BodyType,
  Transmission,
  FuelType,
} from '@car-auction/shared';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  filters: CarFilterParams;
  onChange: (newFilters: Partial<CarFilterParams>) => void;
  onReset: () => void;
}

export function FilterSidebar({ filters, onChange, onReset }: FilterSidebarProps) {
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: models = [] } = useGetModelsByBrandQuery(filters.make || '', {
    skip: !filters.make,
  });

  return (
    <aside className="w-full space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-bold text-foreground text-sm uppercase tracking-wider">
          <Filter className="h-4 w-4 text-primary" />
          Filter Auctions
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Clear All
        </button>
      </div>

      {/* 1. Auction Status */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Auction Status
        </label>
        <select
          value={filters.status || ''}
          onChange={(e) =>
            onChange({ status: (e.target.value as AuctionStatus) || undefined })
          }
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="live">Live Auctions</option>
          <option value="upcoming">Upcoming</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* 2. Condition */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Condition
        </label>
        <select
          value={filters.condition || ''}
          onChange={(e) =>
            onChange({ condition: (e.target.value as CarCondition) || undefined })
          }
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Conditions</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Certified Pre-Owned">Certified Pre-Owned</option>
        </select>
      </div>

      {/* 3. Brand & Dependent Model */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Brand (Make)
          </label>
          <select
            value={filters.make || ''}
            onChange={(e) => {
              onChange({ make: e.target.value || undefined, model: undefined });
            }}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Model
          </label>
          <select
            value={filters.model || ''}
            onChange={(e) => onChange({ model: e.target.value || undefined })}
            disabled={!filters.make}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          >
            <option value="">{!filters.make ? 'Select Brand First' : 'All Models'}</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Price Range */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) =>
              onChange({ priceMin: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) =>
              onChange({ priceMax: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* 5. Year Range */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Year Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min Year"
            value={filters.yearMin || ''}
            onChange={(e) =>
              onChange({ yearMin: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="Max Year"
            value={filters.yearMax || ''}
            onChange={(e) =>
              onChange({ yearMax: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* 6. Body Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Body Type
        </label>
        <select
          value={filters.bodyType || ''}
          onChange={(e) =>
            onChange({ bodyType: (e.target.value as BodyType) || undefined })
          }
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Body Types</option>
          {['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Convertible', 'Wagon', 'Van'].map((bt) => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Transmission & Fuel Type */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Transmission
          </label>
          <select
            value={filters.transmission || ''}
            onChange={(e) =>
              onChange({ transmission: (e.target.value as Transmission) || undefined })
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Transmissions</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Fuel Type
          </label>
          <select
            value={filters.fuelType || ''}
            onChange={(e) =>
              onChange({ fuelType: (e.target.value as FuelType) || undefined })
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Fuel Types</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
