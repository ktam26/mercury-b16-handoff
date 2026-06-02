import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { DesktopHeader } from '@/components/DesktopHeader';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mercury Black B16',
  description: 'Almaden Mercury Black B16 Team App',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mercury B16',
  },
  openGraph: {
    title: 'Mercury Black B16',
    description: 'Almaden Mercury Black B16 Team App',
    images: [
      {
        url: '/images/album-003-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Mercury Black B16 Team',
      },
    ],
    type: 'website',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f5f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1412' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <ErrorBoundary>
            <VoiceAssistant>
              <OfflineIndicator />
              <DesktopHeader />
              <main className="halo-bg min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
                {children}
              </main>
              <div className="md:hidden">
                <BottomNav />
              </div>
            </VoiceAssistant>
          </ErrorBoundary>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
