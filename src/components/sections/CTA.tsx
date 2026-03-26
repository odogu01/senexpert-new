'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Phone, Wrench, Ship } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CTA() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary-light via-primary to-secondary-light animate-gradient" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 border border-white/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-96 h-96 border border-white/5 rounded-full"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Power Your
            <br />
            Next Project?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Partner with SenExpert Global for world-class services in Maritime, Oil & Gas, 
            and Global Procurement. Let's discuss how we can support your operations.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button 
              variant="accent" 
              size="lg"
              onClick={() => window.location.href = '/contact'}
            >
              <Phone className="w-5 h-5" />
              Contact Us Today
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full" />
              Project Assessment
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full" />
              Custom Solutions
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full" />
              24/7 Support
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
