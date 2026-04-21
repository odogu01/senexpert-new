import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/authContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | SenExpert Global Energies',
    default: 'SenExpert Global Energies - Nigerian Oilfield Services Company',
  },
  description: 'SenExpert Global Energies is a fully Nigerian-owned oil tool and oilfield services firm providing well completion, project management, well intervention, and oil tools procurement solutions.',
  keywords: ['oil and gas', 'oilfield services', 'well completion', 'Nigeria', 'energy', 'oil tools', 'procurement'],
  authors: [{ name: 'SenExpert Global Energies' }],
  icons: {
    icon: '/title-logo.png',
    shortcut: '/title-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'SenExpert Global Energies',
    title: 'SenExpert Global Energies - Nigerian Oilfield Services Company',
    description: 'Fully Nigerian-owned oil tool and oilfield services firm providing well completion, project management, well intervention, and oil tools procurement solutions.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}