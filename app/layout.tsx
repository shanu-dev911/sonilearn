import './globals.css';
import { FirebaseProvider } from '@/context/FirebaseContext';
import InstallPromptManager from '@/components/InstallPromptManager';
import type { Metadata, Viewport } from 'next';

// 👇 Yeh line pure project ke static prerendering error ko bypass kar degi
export const dynamic = 'force-dynamic';

// 👇 PWA + SEO + Google Search Console Verification ke liye updated metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://sonilearn.in'),
  title: {
    default: 'SoniLearn - Daily Learning Challenges & Skill Quizzes',
    template: '%s | SoniLearn',
  },
  description: 'Solve daily challenges, improve your skills every day, maintain streaks, and compete on the SoniLearn leaderboard.',
  keywords: [
    'SoniLearn',
    'Daily Challenge',
    'Daily Quiz',
    'Daily Learning Challenge',
    'Online Challenges',
    'Skill Practice',
    'Daily Streak',
  ],
  authors: [{ name: 'SoniLearn Team' }],
  openGraph: {
    title: 'SoniLearn - Take Today’s Challenge',
    description: 'Solve daily challenges, test your knowledge, and build your learning streak every day on SoniLearn.',
    url: 'https://sonilearn.in',
    siteName: 'SoniLearn',
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
    // 👇 Search Console se milne wala HTML tag ka content code yahan paste karein
    google: 'YOUR_SEARCH_CONSOLE_VERIFICATION_CODE',
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
      <body>
        <FirebaseProvider>
          <InstallPromptManager />
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}