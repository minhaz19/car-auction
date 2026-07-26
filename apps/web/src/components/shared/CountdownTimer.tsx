'use client';

import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';

interface CountdownTimerProps {
  auctionEnd: string;
  serverTimeOffset?: number;
  isExtendedAlert?: boolean;
}

export function CountdownTimer({
  auctionEnd,
  serverTimeOffset = 0,
  isExtendedAlert = false,
}: CountdownTimerProps) {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('Loading…');
  const [isEnded, setIsEnded] = useState<boolean>(false);

  useEffect(() => {
    const calculateTime = () => {
      const targetEnd = new Date(auctionEnd).getTime();
      const adjustedNow = Date.now() + serverTimeOffset;
      const diff = targetEnd - adjustedNow;

      if (diff <= 0) {
        setTimeLeftStr('Auction Ended');
        setIsEnded(true);
        return;
      }

      setIsEnded(false);
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n: number) => String(n).padStart(2, '0');

      if (days > 0) {
        setTimeLeftStr(`${days}d ${hours}h ${minutes}m left`);
      } else {
        setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [auctionEnd, serverTimeOffset]);

  return (
    <div
      aria-live="polite"
      className={`relative rounded-2xl p-4 border transition-all duration-500 ${
        isExtendedAlert
          ? 'bg-amber-500/20 border-amber-500 animate-pulse ring-4 ring-amber-500/30'
          : isEnded
            ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
            : 'bg-muted/60 border-border text-foreground'
      }`}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          Time Remaining
        </span>
        {isExtendedAlert && (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300 uppercase tracking-wider animate-bounce">
            <Zap className="h-3.5 w-3.5 fill-amber-400" />
            +2M Anti-Sniping Extension!
          </span>
        )}
      </div>

      <div className="text-2xl font-mono font-extrabold tracking-tight">
        {timeLeftStr}
      </div>
    </div>
  );
}
