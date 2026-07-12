import './globals.css'; // <-- Yeh line add karni hai (path check kar lena agar css folder ke andar ho)
import { FirebaseProvider } from '@/context/FirebaseContext';

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