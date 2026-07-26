'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetBrandsQuery, useGetModelsByBrandQuery } from '@/store/services/carsApi';
import { Search, SlidersHorizontal } from 'lucide-react';

export function QuickSearchPanel() {
  const router = useRouter();

  const [condition, setCondition] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');

  const { data: brands = [], isLoading: isBrandsLoading } = useGetBrandsQuery();
  const { data: models = [], isLoading: isModelsLoading } = useGetModelsByBrandQuery(make, {
    skip: !make,
  });

  const handleBrandChange = (selectedBrand: string) => {
    setMake(selectedBrand);
    setModel(''); // Reset model when brand changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (condition) params.set('condition', condition);
    if (make) params.set('make', make);
    if (model) params.set('model', model);
    if (yearMin) params.set('yearMin', yearMin);
    if (yearMax) params.set('yearMax', yearMax);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Find Your Dream Car</h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Search
        </span>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Condition */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Condition
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Certified Pre-Owned">Certified Pre-Owned</option>
          </select>
        </div>

        {/* 2. Brand */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Brand (Make)
          </label>
          <select
            value={make}
            onChange={(e) => handleBrandChange(e.target.value)}
            disabled={isBrandsLoading}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Model (Dependent Dropdown) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make || isModelsLoading}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {!make ? 'Select Brand First' : isModelsLoading ? 'Loading models…' : 'All Models'}
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Year Range */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Year Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="From"
              value={yearMin}
              onChange={(e) => setYearMin(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="number"
              placeholder="To"
              value={yearMax}
              onChange={(e) => setYearMax(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* 5. Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
          >
            <Search className="h-4 w-4" />
            Search Cars
          </button>
        </div>
      </form>
    </div>
  );
}
