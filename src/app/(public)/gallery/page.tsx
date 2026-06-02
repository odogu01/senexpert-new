import type { Metadata } from 'next';
import GalleryContent from './GalleryContent';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Explore SenExpert Global Energies gallery showcasing our events, trainings, safety meetings, celebrations, operations, and community service activities.',
};

// ISR: Revalidate every hour — gallery content could change
export const revalidate = 3600;

export default function GalleryPage() {
  return <GalleryContent />;
}
