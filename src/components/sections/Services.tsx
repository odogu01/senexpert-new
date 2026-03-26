'use client';

import { motion } from 'framer-motion';
import { 
  Wrench, 
  Ship, 
  Globe, 
  Flame, 
  Cog 
} from 'lucide-react';
import ServiceCard from '@/components/ui/ServiceCard';

const services = [
  {
    icon: Cog,
    title: 'Completion Services',
    description: 'Expert completions operations and services to ensure optimal well performance and safety.',
  },
  {
    icon: Ship,
    title: 'Maritime Services',
    description: 'Comprehensive maritime solutions including logistics, support, and technical operations.',
  },
  {
    icon: Globe,
    title: 'Global Procurement',
    description: 'Strategic supply chain and procurement services to source high-quality materials globally.',
  },
  {
    icon: Flame,
    title: 'Welding',
    description: 'Professional welding services with high precision and adherence to safety standards.',
  },
  {
    icon: Wrench,
    title: 'Fabrication and Maintenance',
    description: 'Quality fabrication and maintenance services for industrial and energy infrastructure.',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <img
          src="/our service background.png"
          alt="Services background"
          className="w-full h-full object-cover"
        />
        {/* Dark Gradient Overlay with Primary and Secondary colors */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-secondary-light/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-transparent to-primary/60" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-white/10 text-accent rounded-full text-sm font-semibold mb-4">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Comprehensive
            <span className="text-accent"> Solutions</span>
          </h2>
          <p className="text-lg text-white/70">
            We offer a full range of integrated services across the energy and industrial sectors.
          </p>
        </motion.div>

        {/* Services Grid - 5 cards layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={service.title}
              icon={service.icon}
              title={service.title}
              description={service.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
