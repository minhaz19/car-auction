'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink, Flame } from 'lucide-react';

interface Slide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  isSponsored?: boolean;
  sponsorName?: string;
}

const CAROUSEL_SLIDES: Slide[] = [
  {
    id: '1',
    badge: 'LIVE AUCTION',
    title: '2023 Porsche 911 Taycan & GT Series',
    subtitle: 'Bid on low-mileage German engineering starting under reserve',
    ctaText: 'Explore Porsche Drop',
    ctaLink: '/search?make=Porsche',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: '2',
    badge: 'ENDING SOON',
    title: '2024 Tesla Cybertruck Cyberbeast',
    subtitle: 'Tri-motor all-wheel drive flagship monster up for auction now',
    ctaText: 'Place Bid Now',
    ctaLink: '/search?make=Tesla',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: '3',
    badge: 'FEATURED DROP',
    title: 'BMW M & AMG Performance Collection',
    subtitle: 'Track-ready performance coupes and sedans with full service histories',
    ctaText: 'View M Performance',
    ctaLink: '/search?make=BMW',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'sponsored-1',
    badge: 'SPONSORED PARTNER',
    title: 'Michelin Pilot Sport 5 — Ultimate Grip',
    subtitle: 'Exclusive 15% discount for RevBid auction winners & verified sellers',
    ctaText: 'Claim Partner Perk',
    ctaLink: 'https://michelin.com',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=1600&q=80',
    isSponsored: true,
    sponsorName: 'Michelin Tyres Official',
  },
];

export function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(nextSlide, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  const currentSlide = CAROUSEL_SLIDES[currentIndex];

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Container */}
      <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden bg-neutral-900">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out transform scale-105"
          style={{ backgroundImage: `url('${currentSlide.imageUrl}')` }}
        />
        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />

        {/* Content Box */}
        <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end p-6 sm:p-12 text-white">
          {/* Badge */}
          <div className="mb-3 flex items-center gap-2">
            {currentSlide.isSponsored ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold tracking-wider text-amber-300 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Sponsored • {currentSlide.sponsorName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/30 border border-primary/40 px-3 py-1 text-xs font-bold tracking-wider text-primary-foreground uppercase">
                <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                {currentSlide.badge}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2 text-white drop-shadow-md">
            {currentSlide.title}
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 mb-6 line-clamp-2">
            {currentSlide.subtitle}
          </p>

          {/* CTA */}
          <div>
            {currentSlide.isSponsored ? (
              <a
                href={currentSlide.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg"
              >
                {currentSlide.ctaText}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href={currentSlide.ctaLink}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg"
              >
                {currentSlide.ctaText}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60 transition-all"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60 transition-all"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Indicator Dots */}
        <div className="absolute bottom-4 right-6 z-10 flex gap-2">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-white/50 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
