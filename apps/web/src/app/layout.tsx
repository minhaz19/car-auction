import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/providers/StoreProvider';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RevBid — Live Car Auctions & Real-Time Bidding',
  description:
    'Buy and sell cars through real-time live auctions. Place bids, track ending-soon listings, and win your next vehicle on RevBid.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full font-sans antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-emerald-500 selection:text-black">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
