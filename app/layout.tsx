import './globals.css';
import { FirebaseProvider } from '@/context/FirebaseContext';
import InstallPromptManager from '@/components/InstallPromptManager';
import type { Metadata, Viewport } from 'next';

// 👇 Yeh line pure project ke static prerendering error ko bypass kar degi
export const dynamic = 'force-dynamic';

// 👇 PWA ke liye updated metadata
export const metadata: Metadata = {
  title: 'SoniLearn',
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