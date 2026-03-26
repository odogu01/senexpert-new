'use client';

import { motion } from 'framer-motion';
import { Cog, Ship, Globe, Flame, Wrench } from 'lucide-react';

const highlights = [
  { icon: Cog, text: 'Completion Services - Expert completions for optimal well performance' },
  { icon: Ship, text: 'Maritime Services - Comprehensive logistics and technical operations' },
  { icon: Globe, text: 'Global Procurement - Strategic supply chain and sourcing solutions' },
  { icon: Flame, text: 'Welding - Professional welding with precision and safety standards' },
  { icon: Wrench, text: 'Fabrication and Maintenance - Quality services for industrial infrastructure' },
];

export default function About() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
              About Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6 leading-tight">
              Excellent Work Ethics &
              <br />
              <span className="text-gradient">On-Time Delivery</span>
            </h2>
            <p className="text-lg text-text-muted mb-10 leading-relaxed">
              SenExpert Global Energies is dedicated to providing world-class integrated services. 
              We pride ourselves on our excellent work ethics and our ability to deliver complex 
              projects on time and on budget, utilizing smart technology and expert engineering.
            </p>

            {/* Highlights */}
            <div className="space-y-4">
              {highlights.map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-text font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
            className="relative"
          >
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src="/about-image.png"
                alt="SenExpert Global operations"
                className="w-full h-auto"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>

            {/* Floating Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-xl p-5 shadow-xl shadow-gray-200/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent">20+</span>
                </div>
                <div>
                  <p className="font-bold text-text">Years of</p>
                  <p className="text-text-muted text-sm">Excellence</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -top-4 -right-4 bg-primary rounded-xl p-5 shadow-xl shadow-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">500+</span>
                </div>
                <div>
                  <p className="font-bold text-white">Global</p>
                  <p className="text-white/70 text-sm">Clients</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
