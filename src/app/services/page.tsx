'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Cog, 
  Wrench, 
  Globe, 
  Ship,
  TrendingUp,
  Shield,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const services = [
  {
    icon: Cog,
    title: 'Well Completion Services',
    description: 'Comprehensive well completion solutions including engineering design, artificial lift systems, and well integrity management.',
    features: [
      'Completion design and modelling',
      'Artificial lift design and services',
      'Well Integrity management',
      'Oil Tools & completions equipment supply',
      'OEM certified completions inventory',
      'Completion consultancy & technical support',
      'Completion tubular supply'
    ]
  },
  {
    icon: TrendingUp,
    title: 'Project Management',
    description: 'Integrated project management services from planning to execution, ensuring timely delivery within budget.',
    features: [
      'Front End Engineering Design',
      'Project planning & coordination',
      'Quality Assurance & Control',
      '3rd party equipment certification',
      'Project execution supervision',
      'End of Well Reports'
    ]
  },
  {
    icon: Wrench,
    title: 'Well Intervention',
    description: 'Expert well intervention services including slickline, wireline, and coiled tubing operations.',
    features: [
      'Slickline & Wireline/E-Line operations',
      'Wellhead services & maintenance',
      'Coil Tubing (Nitrogen, Acid, Fishing)',
      'Water/Gas Shut-off',
      'Hot Oil dewaxing',
      'Gaslift retrofit',
      'Short Term Oil Gain (STOG) operations'
    ]
  },
  {
    icon: Globe,
    title: 'Oil Tools & Procurement',
    description: 'Global procurement and supply of OEM-certified drilling and completion tools and equipment.',
    features: [
      'OEM tool procurement & distribution',
      'Installation supervision',
      'OCTG supply (Casing, Tubing, Pup Joints)',
      'Screens & Blank pipes',
      'In-country inventory',
      '24/7 technical support'
    ]
  }
];

const coreOfferings = [
  {
    title: 'Sand Control Solutions',
    description: 'Gravel pack, screens, and inflow control systems for sand management in wellbores.'
  },
  {
    title: 'Intelligent Completions',
    description: 'Real-time reservoir monitoring and remote flow control for optimized production.'
  },
  {
    title: 'Dual & Multizone Completions',
    description: 'Advanced completion systems for multi-zone reservoir exploitation.'
  },
  {
    title: 'Artificial Lift Systems',
    description: 'ESP, gas lift, and hydraulic lift design and implementation for enhanced recovery.'
  },
  {
    title: 'Well Integrity Management',
    description: 'Diagnostics, remediation, and integrity assurance programs for well longevity.'
  },
  {
    title: 'HPHT Completions',
    description: 'Chrome alloy and high-pressure/high-temperature equipment for challenging wells.'
  }
];

const projects = [
  {
    title: 'OKOS-08 Well Completion Supervision Service',
    client: 'Sahara Energy',
    scope: 'Lower completion SAS, Perforation, Lower completion CHGP, dual string upper completion installation',
    date: 'January 2026',
    result: 'Successfully delivered well completion supervision service'
  },
  {
    title: 'Igbomotoru-3 (IGBN-3) Integrated Project Management',
    client: 'Eyrie Energy Limited',
    scope: 'Well re-entry & re-completion',
    date: 'September 2025',
    result: 'Successfully delivered IPM for well re-entry and recompletion operations'
  },
  {
    title: 'Seplat Orogho-10 Lower Completion',
    client: 'Multi Integral Limited',
    scope: 'Lower completion operations',
    date: 'April - May 2025',
    result: 'Successfully completed on behalf of Multi Integral Limited'
  },
  {
    title: 'Seplat Orogho-11 Lower Completion',
    client: 'Multi Integral Limited',
    scope: 'Lower completion operations',
    date: 'June 2025',
    result: 'Successfully completed on behalf of Multi Integral Limited'
  },
  {
    title: 'Ogbanabou-2 Expandable Screens',
    client: 'Kal-Marine Petroleum Services',
    scope: 'Expandable screens installation',
    date: 'July 2024',
    result: 'Successfully installed expandable screens for Matpatson'
  },
  {
    title: 'Okpohuru-8 Dual String Upper Completion',
    client: 'Seplat Energy',
    scope: 'Dual string upper completion',
    date: 'May 2024',
    result: 'Partnered with Mansfield Energy for installation'
  },
  {
    title: 'Ovhor-4 Dual String Upper Completion',
    client: 'Seplat Energy',
    scope: 'Dual string upper completion',
    date: 'July - August 2025',
    result: 'Partnered with Mansfield Energy for installation'
  },
  {
    title: 'Ugheli-42 Single String Completion',
    client: 'ND-Western',
    scope: 'Upper & lower completion',
    date: 'July 2023',
    result: 'Successfully installed single string completion'
  },
  {
    title: 'Ugheli-46 Single String Completion',
    client: 'ND-Western',
    scope: 'Upper & lower completion',
    date: 'April 2023',
    result: 'Successfully installed single string completion'
  },
  {
    title: 'Igbomotoru-02 (IGB-02) Well Re-entry',
    client: 'BAP Energy',
    scope: 'Well re-entry & completions',
    date: 'While with Alpharetta',
    result: 'Superintended program to produce ~2000BOPD using HWU'
  },
  {
    title: 'Okoro-01 Well Re-entry & Dual Completions',
    client: 'Anatolia Energy',
    scope: 'Well re-entry & initial dual completions',
    date: 'Completed',
    result: 'Successfully delivered to produce ~1500BOPD with HWU'
  },
  {
    title: 'APANI-1 Well Re-entry',
    client: 'Matrix Energy',
    scope: 'Well re-entry operations',
    date: 'While with Alpharetta',
    result: 'Superintended to produce live crude (Land Rig)'
  },
  {
    title: 'Seplat Amukpe-6 Lower Completion',
    client: 'Multi-Integral Limited',
    scope: '3-zones Lower completion Stand-alone screens',
    date: 'Completed',
    result: 'Successfully completed all 3 zones'
  }
];

const stats = [
  { value: '60+', label: 'Years Combined Experience', icon: Clock },
  { value: '500+', label: 'Projects Completed', icon: TrendingUp },
  { value: '98%', label: 'On-Time Delivery', icon: CheckCircle },
  { value: '150+', label: 'Expert Personnel', icon: Users },
];

function ProjectCard({ project, index }: { project: typeof projects[0]; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border-l-4 border-accent hover:border-l-8 hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text mb-2">{project.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1 flex-shrink-0">
                <Building2 className="w-4 h-4 text-accent" />
                {project.client}
              </span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <FileText className="w-4 h-4 text-accent" />
                <span className={`${isExpanded ? '' : 'line-clamp-1'} max-w-xs`}>{project.scope}</span>
              </span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-4 h-4 text-accent" />
                {project.date}
              </span>
            </div>
          </div>
          <button className="p-2 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-primary" />}
          </button>
        </div>
        
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <p className="text-text-muted text-sm">{project.result}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function Services() {
  return (
    <main className="min-h-screen">
      <Navbar transparent={false} />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] lg:min-h-[70vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/our service background.png"
            alt="Services background"
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary-light/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center min-h-[60vh] lg:min-h-[70vh] py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent rounded-full text-sm font-semibold">
              Our Services
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Comprehensive
              <br />
              <span className="text-accent">Energy Solutions</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-white/80 leading-relaxed">
              Delivering world-class integrated services across Well Completion, Project Management, Well Intervention, and Oil Tools Procurement.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <p className="text-text-muted text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services at a Glance */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Services at a Glance
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
              What We <span className="text-gradient">Offer</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                    <service.icon className="w-7 h-7 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text">{service.title}</h3>
                  </div>
                </div>
                <p className="text-text-muted mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-muted">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Offerings */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Core Offerings
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
              Specialized <span className="text-gradient">Solutions</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreOfferings.map((offering, index) => (
              <motion.div
                key={offering.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 hover:from-primary/10 hover:to-accent/10 transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Cog className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{offering.title}</h3>
                <p className="text-text-muted text-sm">{offering.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Notably Executed Projects */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Track Record
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-4">
              NOTABLY EXECUTED PROJECTS
            </h2>
            <p className="text-text-muted text-lg">
              A track record of successfully delivering complex well operations, completions, and energy solutions across multiple clients.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={index} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-secondary animate-gradient" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to Power Your
              <br />
              Next Project?
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Partner with SenExpert Global for world-class oilfield services. Let's discuss how we can support your operations.
            </p>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              Contact Us Today
              <ArrowRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}