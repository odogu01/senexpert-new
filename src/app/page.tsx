import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import WhyChooseUs from '@/components/sections/WhyChooseUs';
import Clients from '@/components/sections/Clients';
import CTA from '@/components/sections/CTA';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar transparent={true} />
      <Hero />
      <About />
      <Services />
      <WhyChooseUs />
      <Clients />
      <CTA />
      <Footer />
    </main>
  );
}
