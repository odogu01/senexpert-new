'use client';

import { motion } from 'framer-motion';

const clients = [
  {
    name: 'Shell',
    logo: '/clients/Shell.png',
  },
  {
    name: 'Seplat',
    logo: '/clients/Seplat.png',
  },
  {
    name: 'Anatolia Energy & Services Limited',
    logo: '/clients/Anatolia Energy & Services Limited.png',
  },
  {
    name: 'BAP Energy Limited',
    logo: '/clients/BAP ENERGY LIMITED.png',
  },
  {
    name: 'Eyrie Group',
    logo: '/clients/Eyrie Group.png',
  },
];

export default function Clients() {
  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-white" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Our Clients
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
            Clients We Have
            <span className="text-gradient"> Worked With</span>
          </h2>
          <p className="text-lg text-text-muted">
            We are proud to have partnered with leading companies in the oil and gas industry, delivering exceptional results and building lasting relationships.
          </p>
        </motion.div>

        {/* Desktop Clients Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center"
        >
          {clients.map((client, index) => (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group flex items-center justify-center p-6 rounded-xl bg-background hover:bg-primary/5 transition-all duration-300"
            >
              <div className="relative w-full h-16 flex items-center justify-center">
                <img
                  src={client.logo}
                  alt={client.name}
                  className="max-w-full max-h-full object-contain transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile Marquee - Infinite Scroll */}
        <div className="lg:hidden overflow-hidden relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />
          
          {/* Marquee wrapper */}
          <div className="relative flex overflow-x-auto hide-scrollbar">
            <style>{`
              @keyframes scroll {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-100%);
                }
              }
              .marquee-content {
                animation: scroll 40s linear infinite;
              }
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            
            {/* Single set of logos that will be duplicated by animation */}
            <div className="marquee-content flex gap-4 flex-shrink-0">
              {[...clients, ...clients, ...clients, ...clients].map((client, index) => (
                <div
                  key={`${client.name}-${index}`}
                  className="flex items-center justify-center px-4 py-3 bg-background rounded-lg flex-shrink-0"
                  style={{ width: '120px', height: '56px' }}
                >
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-text-muted text-sm">
            Trusted by industry leaders for quality, safety, and reliability
          </p>
        </motion.div>
      </div>
    </section>
  );
}
