import type { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'About',
  description: 'SenExpert Global Energies is a fully Nigerian-owned oil tool and oilfield services firm providing well completion, project management, well intervention, and oil tools procurement solutions.',
};

export default function AboutPage() {
  return <AboutContent />;
}
