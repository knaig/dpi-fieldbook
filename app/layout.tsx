import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import NavBar from '@/components/NavBar';
import { EnrichedDataSyncProvider } from '@/components/EnrichedDataSyncProvider';
// import PWAInitializer from '@/components/PWAInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DPI Summit Fieldbook',
  description: 'Private fieldbook for DPI Summit ecosystem mapping',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DPI Fieldbook',
  },
  icons: {
    icon: '/dpi-page.png',
    apple: '/dpi-page.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DPI Fieldbook" />
      </head>
      <body className={inter.className}>
        <Toaster position="top-right" />
        {false && /* PWA disabled in dev to avoid cache issues */ null}
        <EnrichedDataSyncProvider>
          <NavBar />
          <main className="min-h-screen bg-slate-50 pb-16 sm:pb-20 pt-14 sm:pt-20">{children}</main>
        </EnrichedDataSyncProvider>
      </body>
    </html>
  );
}
