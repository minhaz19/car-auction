'use client';

import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/20">
      <span className="text-muted-foreground font-normal">{label}:</span>
      <span>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors focus:outline-none"
        aria-label={`Remove filter ${label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
