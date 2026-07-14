import type { Metadata } from "next";

import "./globals.css";
export const metadata: Metadata = {
  title: "SoniLearn",
  description: "SSC & Railway Preparation Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-gray-900">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}