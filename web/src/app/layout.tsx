import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = 'https://skillskonnect.online';

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'JobHub Global - The Autonomous Career & Hiring Engine',
    template: '%s | JobHub Global',
  },
  description:
    'Next-generation autonomous AI job matching, 1-tap automated applications, instant verified credentials, and ATS resume optimization for global talent and top employers.',
  keywords: [
    'JobHub Global',
    'AI job search',
    'autonomous hiring',
    'automated job application',
    'AI resume builder',
    'verified developer credentials',
    'tech jobs remote',
    'smart ATS optimization',
  ],
  authors: [{ name: 'JobHub Global Team', url: siteUrl }],
  creator: 'JobHub Global',
  publisher: 'JobHub Global',
  applicationName: 'JobHub Global',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'JobHub Global',
    title: 'JobHub Global - The Autonomous Career & Hiring Engine',
    description:
      'Autonomous AI job matching, 1-tap applications, verified credentials, and smart ATS optimization.',
    images: [
      {
        url: '/jobhub-preview.png',
        width: 1200,
        height: 630,
        alt: 'JobHub Global - The Autonomous Career & Hiring Engine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobHub Global - The Autonomous Career & Hiring Engine',
    description:
      'Autonomous AI job matching, 1-tap applications, verified credentials, and smart ATS optimization.',
    images: ['/jobhub-preview.png'],
    creator: '@jobhubglobal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import Header from '../components/Header';
import Footer from '../components/Footer';
import { ThemeProvider } from '../components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className="bg-[#0A0A0A] text-white transition-colors duration-300 min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          <Header />
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
