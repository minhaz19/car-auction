'use client';

import { useState } from 'react';
import { ImagePlus, X, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const PRESET_PHOTOS = [
  { name: 'Sports Coupe', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d' },
  { name: 'Luxury Sedan', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537' },
  { name: 'Supercar Front', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70' },
  { name: 'Classic Vintage', url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd' },
  { name: 'Performance Track', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738' },
];

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [inputUrl, setInputUrl] = useState('');

  const handleAddUrl = () => {
    if (inputUrl.trim() && !images.includes(inputUrl.trim())) {
      onChange([...images, inputUrl.trim()]);
      setInputUrl('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleAddPreset = (url: string) => {
    if (!images.includes(url)) {
      onChange([...images, url]);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <ImagePlus className="h-4 w-4 text-primary" />
          Vehicle Image Gallery ({images.length} added)
        </label>
        <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          Upload Stub (Cloudinary/S3 Integration Ready)
        </span>
      </div>

      {/* URL Input & Add Button */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste image URL (https://...)"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          className="flex-1 rounded-2xl border border-input bg-background px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Add Image
        </button>
      </div>

      {/* Preset Unsplash Picker */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          Or pick from demo showcase photos:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_PHOTOS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset.url)}
              className="rounded-xl border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary transition-colors"
            >
              + {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Image Thumbnails Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-neutral-950 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Vehicle photo ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-primary px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground uppercase">
                  Cover Photo
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
