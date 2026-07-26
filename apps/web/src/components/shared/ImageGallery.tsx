'use client';

import { useState } from 'react';

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
      {/* Main Image Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-neutral-950 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={galleryImages[selectedIndex]}
          alt={`${title} photo ${selectedIndex + 1}`}
          className="h-full w-full object-cover transition-all duration-300"
        />
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
          {selectedIndex + 1} / {galleryImages.length}
        </div>
      </div>

      {/* Thumbnails Row */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-[16/10] w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                idx === selectedIndex
                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                  : 'border-border opacity-70 hover:opacity-100'
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
