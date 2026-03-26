import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Senexpert Global',
    default: 'Senexpert Global - Expert Business Consulting',
  },
  description: 'Transform your business with Senexpert Global. Strategic consulting, digital transformation, and operational excellence solutions for enterprises worldwide.',
  keywords: ['consulting', 'business', 'strategy', 'digital transformation', 'corporate'],
  authors: [{ name: 'Senexpert Global' }],
  icons: {
    icon: '/title-logo.png',
    shortcut: '/title-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Senexpert Global',
    title: 'Senexpert Global - Expert Business Consulting',
    description: 'Transform your business with strategic consulting solutions',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
