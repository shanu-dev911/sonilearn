import './globals.css';
import { FirebaseProvider } from '@/context/FirebaseContext';

// 👇 Yeh line pure project ke static prerendering error ko bypass kar degi
export const dynamic = 'force-dynamic';

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