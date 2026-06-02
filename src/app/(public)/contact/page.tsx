import type { Metadata } from 'next';
import ContactContent from './ContactContent';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with SenExpert Global Energies. Contact us for well completion, project management, well intervention, and oil tools procurement services.',
};

export default function ContactPage() {
  return <ContactContent />;
}
