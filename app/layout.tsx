import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import NavBar from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DPI Summit Fieldbook',
  description: 'Private fieldbook for DPI Summit ecosystem mapping',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" />
        <header className="bg-slate-900 border-b border-slate-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-white">DPI Summit Fieldbook</h1>
          </div>
        </header>
        <main className="min-h-screen bg-slate-50 pb-20">{children}</main>
        <NavBar />
      </body>
    </html>
  );
}
