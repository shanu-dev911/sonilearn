
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { FirebaseClientProvider } from "@/firebase";
import WhatsAppFeedback from "@/components/WhatsAppFeedback";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoniLearn - AI-Powered Exam Prep",
  description: "Your AI-powered journey to success starts here.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className}`}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
        <WhatsAppFeedback />
      </body>
    </html>
  );
}
