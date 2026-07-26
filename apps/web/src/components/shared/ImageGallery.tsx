'use client';

import { useState } from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fallbackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d';
  const galleryImages = images && images.length > 0 ? images : [fallbackImage];

  return (
    <div className="space-y-4">
      {/* Main Image Banner with Crest Badge */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border/80 bg-zinc-950 shadow-2xl group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={galleryImages[selectedIndex]}
          alt={`${title} photo ${selectedIndex + 1}`}
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-102"
        />

        {/* Team-Crest Style Prominence Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-2xl bg-zinc-950/80 backdrop-blur border border-white/10 px-3.5 py-1.5 shadow-xl">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block leading-none">
              RevBid Verified
            </span>
            <span className="text-[9px] text-zinc-400 font-medium leading-none">Inspected Listing</span>
          </div>
        </div>

        {/* Image Counter Pill */}
        <div className="absolute bottom-4 right-4 rounded-xl bg-zinc-950/80 backdrop-blur px-3 py-1.5 text-xs font-mono font-bold text-white border border-white/10">
          <Sparkles className="inline h-3.5 w-3.5 text-emerald-400 mr-1" />
          {selectedIndex + 1} / {galleryImages.length}
        </div>
      </div>

      {/* Thumbnails Row */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-[16/10] w-24 flex-shrink-0 min-h-[44px] overflow-hidden rounded-xl border-2 transition-all ${
                idx === selectedIndex
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-md'
                  : 'border-zinc-800 opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
