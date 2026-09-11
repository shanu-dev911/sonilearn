import './globals.css';
import { FirebaseProvider } from '@/context/FirebaseContext';
import InstallPromptManager from '@/components/InstallPromptManager';
import type { Metadata, Viewport } from 'next';

// 👇 Yeh line pure project ke static prerendering error ko bypass kar degi
export const dynamic = 'force-dynamic';

// 👇 PWA + SEO + Google Search Console + Custom Logo Favicon metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://www.sonilearn.in'),
  title: {
    default: 'SoniLearn - Daily Challenge, Battleground, PYQ & Current Affairs',
    template: '%s | SoniLearn',
  },
  description: 'Prepare smarter with SoniLearn Daily Challenges, Warrior Battleground competitions, All India Leaderboard, PYQ, Weak Practice, Quick Practice, and Daily Current Affairs.',
  keywords: [
    'SoniLearn',
    'Daily Challenge',
    'Daily Challenges and Streaks',
    'Warrior Battleground',
    'Live Quiz Battle',
    'All India Leaderboard',
    'Previous Year Questions',
    'PYQ Practice',
    'Weak Practice',
    'Quick Practice',
    'Daily Current Affairs',
  ],
  authors: [{ name: 'SoniLearn Team' }],
  icons: {
    icon: [
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/icon-192x192.png'],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'SoniLearn - Daily Challenge, Warrior Battleground & PYQ',
    description: 'Take daily challenges, compete in Warrior Battleground, climb the All India Leaderboard, practice PYQ and weak topics, and read current affairs.',
    url: 'https://www.sonilearn.in',
    siteName: 'SoniLearn',
    images: [
      {
        url: '/logo.svg',
        width: 800,
        height: 600,
        alt: 'SoniLearn Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SoniLearn',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: 'PgGMKb0_JqwPrxpZmggy-9LV48ghIV-UQuOCS09KBDY',
  },
};

// 👇 PWA viewport settings
export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" sizes="192x192" />
      </head>
      <body>
        <FirebaseProvider>
          <InstallPromptManager />
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}