'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { FilterSidebar } from '@/components/shared/FilterSidebar';
import { FilterChip } from '@/components/shared/FilterChip';
import { CarCard } from '@/components/shared/CarCard';
import { CarCardSkeleton } from '@/components/ui/Skeleton';
import { useGetCarsQuery } from '@/store/services/carsApi';
import type {
  CarFilterParams,
  CarCondition,
  BodyType,
  Transmission,
  FuelType,
  AuctionStatus,
} from '@car-auction/shared';
import { SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parse URL query params into state
  const filtersFromUrl: CarFilterParams = {
    condition: (searchParams.get('condition') as CarCondition) || undefined,
    make: searchParams.get('make') || undefined,
    model: searchParams.get('model') || undefined,
    yearMin: searchParams.get('yearMin') ? Number(searchParams.get('yearMin')) : undefined,
    yearMax: searchParams.get('yearMax') ? Number(searchParams.get('yearMax')) : undefined,
    priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
    priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
    bodyType: (searchParams.get('bodyType') as BodyType) || undefined,
    mileageMax: searchParams.get('mileageMax') ? Number(searchParams.get('mileageMax')) : undefined,
    transmission: (searchParams.get('transmission') as Transmission) || undefined,
    fuelType: (searchParams.get('fuelType') as FuelType) || undefined,
    status: (searchParams.get('status') as AuctionStatus) || undefined,
    sort: (searchParams.get('sort') as CarFilterParams['sort']) || 'endingSoonest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 9,
  };

  const { data, isLoading, isFetching } = useGetCarsQuery(filtersFromUrl);

  const cars = data?.cars || [];
  const total = data?.total || 0;
  const page = data?.page || 1;
  const totalPages = data?.totalPages || 1;

  // Helper to push updated filters to URL
  const updateUrlFilters = (updated: Partial<CarFilterParams>) => {
    const nextFilters = { ...filtersFromUrl, ...updated, page: updated.page || 1 };
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });

    router.push(`/search?${params.toString()}`);
  };

  const removeFilter = (key: keyof CarFilterParams) => {
    const nextFilters = { ...filtersFromUrl, [key]: undefined, page: 1 };
    updateUrlFilters(nextFilters);
  };

  const resetAllFilters = () => {
    router.push('/search');
  };

  // Collect active filters for chips
  const activeChips: { key: keyof CarFilterParams; label: string; value: string }[] = [];
  if (filtersFromUrl.condition) activeChips.push({ key: 'condition', label: 'Condition', value: filtersFromUrl.condition });
  if (filtersFromUrl.make) activeChips.push({ key: 'make', label: 'Brand', value: filtersFromUrl.make });
  if (filtersFromUrl.model) activeChips.push({ key: 'model', label: 'Model', value: filtersFromUrl.model });
  if (filtersFromUrl.yearMin) activeChips.push({ key: 'yearMin', label: 'From Year', value: String(filtersFromUrl.yearMin) });
  if (filtersFromUrl.yearMax) activeChips.push({ key: 'yearMax', label: 'To Year', value: String(filtersFromUrl.yearMax) });
  if (filtersFromUrl.priceMin) activeChips.push({ key: 'priceMin', label: 'Min Price', value: `$${filtersFromUrl.priceMin}` });
  if (filtersFromUrl.priceMax) activeChips.push({ key: 'priceMax', label: 'Max Price', value: `$${filtersFromUrl.priceMax}` });
  if (filtersFromUrl.bodyType) activeChips.push({ key: 'bodyType', label: 'Body', value: filtersFromUrl.bodyType });
  if (filtersFromUrl.status) activeChips.push({ key: 'status', label: 'Status', value: filtersFromUrl.status });
  if (filtersFromUrl.transmission) activeChips.push({ key: 'transmission', label: 'Transmission', value: filtersFromUrl.transmission });
  if (filtersFromUrl.fuelType) activeChips.push({ key: 'fuelType', label: 'Fuel', value: filtersFromUrl.fuelType });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Car Listings Search</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Showing <span className="font-semibold text-foreground">{total}</span> matching auction listings
            </p>
          </div>

          {/* Controls: Mobile Filter Button & Sort Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters {activeChips.length > 0 && `(${activeChips.length})`}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <select
                value={filtersFromUrl.sort || 'endingSoonest'}
                onChange={(e) => updateUrlFilters({ sort: e.target.value as CarFilterParams['sort'] })}
                className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
              >
                <option value="endingSoonest">Ending Soonest</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="mostBids">Most Bids</option>
                <option value="newest">Newest Listed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
            <span className="text-xs font-bold uppercase text-muted-foreground mr-1">
              Active Filters:
            </span>
            {activeChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                value={chip.value}
                onRemove={() => removeFilter(chip.key)}
              />
            ))}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-primary hover:underline font-semibold ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="lg:hidden mb-6">
            <FilterSidebar
              filters={filtersFromUrl}
              onChange={(updated) => {
                updateUrlFilters(updated);
                setMobileFilterOpen(false);
              }}
              onReset={resetAllFilters}
            />
          </div>
        )}

        {/* Main Search Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterSidebar
              filters={filtersFromUrl}
              onChange={updateUrlFilters}
              onReset={resetAllFilters}
            />
          </div>

          {/* Results Grid Area */}
          <div className="lg:col-span-3 space-y-8">
            {isLoading || isFetching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <CarCardSkeleton key={i} />
                ))}
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
                <p className="text-base font-semibold">No cars match your selected filters</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Try broadening your price, year, or model filter settings.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <CarCard key={car._id} car={car} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-6">
                <p className="text-xs text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                  <span className="font-semibold text-foreground">{totalPages}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateUrlFilters({ page: page - 1 })}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateUrlFilters({ page: page + 1 })}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
          Loading Search Results…
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
