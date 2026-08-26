import './globals.css';
import { FirebaseProvider } from '@/context/FirebaseContext';
import type { Metadata, Viewport } from 'next';

// 👇 Yeh line pure project ke static prerendering error ko bypass kar degi
export const dynamic = 'force-dynamic';

// 👇 PWA ke liye naya add kiya gaya
export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SoniLearn',
  },
  formatDetection: {
    telephone: false,
  },
};

// 👇 PWA ke liye naya add kiya gaya (themeColor yahan jaata hai, metadata mein nahi)
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
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}