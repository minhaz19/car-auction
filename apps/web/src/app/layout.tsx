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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://revbid.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'RevBid — Live Automotive Auctions & Real-Time Bidding Platform',
    template: '%s | RevBid Car Auctions',
  },
  description:
    'Experience high-stakes live car auctions with sub-second Socket.io bidding, anti-sniping protection, Stripe payments, and verified vehicle handoff.',
  keywords: [
    'Car Auctions',
    'Live Bidding',
    'Automotive Marketplace',
    'Porsche Auctions',
    'BMW Auctions',
    'Real-Time Bidding',
  ],
  authors: [{ name: 'RevBid Engineering' }],
  openGraph: {
    title: 'RevBid — Live Automotive Auctions & Real-Time Bidding',
    description:
      'Place concurrency-safe bids, experience anti-sniping extensions, and complete vehicle transactions on RevBid.',
    url: baseUrl,
    siteName: 'RevBid',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'RevBid Live Automotive Auctions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RevBid — Live Automotive Auctions',
    description:
      'Real-time automotive auction platform with anti-sniping protection and Stripe checkout.',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    ],
  },
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
