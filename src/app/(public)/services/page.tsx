import type { Metadata } from 'next';
import ServicesContent from './ServicesContent';

export const metadata: Metadata = {
  title: 'Services',
  description: 'SenExpert Global Energies provides well completion, project management, well intervention, and oil tools procurement services for the oil and gas industry.',
};

export default function ServicesPage() {
  return <ServicesContent />;
}
