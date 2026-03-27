'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Cog, 
  Ship, 
  Globe, 
  Flame, 
  Wrench,
  Award,
  Users,
  Clock,
  Shield,
  Target,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const stats = [
  { value: '60+', label: 'Years Combined Experience', icon: Award },
  { value: '500+', label: 'Projects Completed', icon: TrendingUp },
  { value: '98%', label: 'On-Time Delivery', icon: Clock },
  { value: '150+', label: 'Expert Personnel', icon: Users },
];

const values = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Unmatched commitment to safety with zero incidents across all operations. We prioritize the well-being of our team and assets.'
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We leverage cutting-edge technology and innovative solutions to deliver efficient and cost-effective services.'
  },
  {
    icon: Target,
    title: 'Customer focus and satisfactory',
    description: 'Our clients are at the heart of everything we do. We tailor solutions to meet their unique needs.'
  },
  {
    icon: Users,
    title: 'Local Content',
    description: 'Committed to developing and training indigenous engineers and young professionals in the oil and gas industry.'
  },
];

const teamMembers = [
  {
    name: 'Usen Emmanuel',
    role: 'Chief Executive Officer',
    image: '/usen emmanuel.png',
    description: 'A seasoned Petroleum Engineer with over 20 years of progressive experience in the oil and gas industry, spanning drilling, completions, and well intervention operations.'
  },
  {
    name: 'Ubong Udofia',
    role: 'Chief Technical Officer',
    image: '/ubong udofia.png',
    description: 'A seasoned Well Engineering and Project Management professional with over 18 years of multidisciplinary experience in the oil and gas industry.'
  },
  {
    name: 'Tony Uzuazor Oboezi',
    role: 'Operations Director',
    image: '/Tony Uzuazor Oboezi.png',
    description: 'A seasoned Operations Director with over 15 years experience as a High-Performing Wellsite lead completions supervisor.'
  },
  {
    name: 'Stanley Odhegba',
    role: 'Executive Director',
    image: '/Stanley Odhegba.png',
    description: 'A seasoned Executive Director with over 25 years of leadership experience in the petroleum industry.'
  },
];

const equipmentCategories = [
  { name: 'Completion Equipment', description: 'Bridge plugs, packers, subsurface safety valves, and completion accessories for wellbore operations.', image: '/Completion Equipment.png' },
  { name: 'Wellhead Equipment', description: 'Valves, chokes, BOP accessories, and pressure control equipment for surface operations.', image: '/wellhead Equipment.png' },
  { name: 'Tubulars', description: 'Casing, tubing, pup joints, crossovers, and landing nipples for well construction.', image: '/Tabulars.png' },
  { name: 'Sand Control', description: 'Gravel pack screens, inflow control devices, and sand management solutions.', image: '/sand control.png' },
  { name: 'Intervention Tools', description: 'Slickline, E-line, and coiled tubing tools for well intervention operations.', image: '/Intervention Tools.png' },
  { name: 'Artificial Lift', description: 'Gas lift systems, ESP units, and hydraulic lift equipment for production optimization.', image: '/Artificial lift.png' },
  { name: 'Welding and Fabrication', description: 'Professional welding and fabrication services with precision and adherence to safety standards for industrial infrastructure.', image: '/welding.png' },
];

export default function About() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const heroImages = [
    '/about hero background1.png',
    '/about hero background2.png',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <main className="min-h-screen">
      <Navbar transparent={false} />
      {/* Hero Section */}
      <section className="relative min-h-[70vh] lg:min-h-[80vh] overflow-hidden">
        {/* Sliding Background Images */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentSlide ? 1 : 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <img
                src={image}
                alt={`Hero background ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-transparent to-primary/40" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center min-h-[70vh] lg:min-h-[80vh] py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent rounded-full text-sm font-semibold">
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Empowering Nigeria's
              <br />
              <span className="text-accent">Energy Future</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-white/80 leading-relaxed">
              SenExpert Global Energies is a fully Nigerian-owned oil tool and oilfield services firm committed to providing top-notch solutions for the oil and gas industry.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
                Who We Are
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6 leading-tight">
                Leading Indigenous
                <br />
                <span className="text-gradient">Oilfield Services</span>
              </h2>
              <div className="space-y-4 text-text-muted leading-relaxed">
                <p>
                  SenExpert Global Energies is a fully Nigerian-owned oil tool oilfield services and engineering firm committed to providing top-notch solutions for the oil and gas industry.
                </p>
                <p>
                  Founded to offer integrated project management, well engineering, well completion, production optimization, Marine logistics services, and General procurement and supplies services.
                </p>
                <p>
                  Our Team of seasoned upstream experts with over 60 years of combined experience leading the oil and gas in Integrated project management, well completions, workover, well intervention (CWI), and oil tool rental/procurement services.
                </p>
                <p>
                  SenExpert blends deep local insight with global technical expertise. The breadth and depth of our knowledge, experience, and practical expertise in the oil and gas sector are very beneficial to our clients.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 group">
                <img
                  src="/who are we.png"
                  alt="Who We Are"
                  className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20" />
              </div>
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-xl p-5 shadow-xl shadow-gray-200/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
                    <Award className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-text">Fully Nigerian</p>
                    <p className="text-text-muted text-sm">Owned Company</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 text-center shadow-lg shadow-gray-200/50"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-accent" />
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <p className="text-text-muted text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical OEM Partners Section */}
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
              Our Partners
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
              Technical OEM <span className="text-gradient">Partners</span>
            </h2>
            <p className="text-lg text-text-muted">
              We are proud to collaborate with leading Original Equipment Manufacturers (OEMs) globally, ensuring access to world-class technology and equipment for our clients.
            </p>
          </motion.div>

          {/* Partners Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center"
          >
            {[
              { name: 'SLB', logo: '/partners/SLB.png' },
              { name: 'Weatherford', logo: '/partners/Weatherford.png' },
              { name: 'Baker Hughes', logo: '/partners/Baker Hughes.webp' },
              { name: 'Giants Oil Tool', logo: '/partners/Giants Oil Tool.svg' },
              { name: 'PetroForge Technology', logo: '/partners/petroForge Technology.jpg' },
            ].map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group flex items-center justify-center p-6 rounded-xl bg-background hover:bg-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20"
              >
                <div className="relative w-full h-16 flex items-center justify-center">
                  <img
                    src={partner.logo}
                    alt={partner.name}
className="max-w-full max-h-full object-contain"
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
                @keyframes partner-scroll {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-100%);
                  }
                }
                .partner-marquee-content {
                  animation: partner-scroll 40s linear infinite;
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
              <div className="partner-marquee-content flex gap-4 flex-shrink-0">
                {[
                  { name: 'SLB', logo: '/partners/SLB.png' },
                  { name: 'Weatherford', logo: '/partners/Weatherford.png' },
                  { name: 'Baker Hughes', logo: '/partners/Baker Hughes.webp' },
                  { name: 'Giants Oil Tool', logo: '/partners/Giants Oil Tool.svg' },
                  { name: 'PetroForge Technology', logo: '/partners/petroForge Technology.jpg' },
                ].map((partner, index) => (
                  <div
                    key={`${partner.name}-${index}`}
                    className="flex items-center justify-center px-4 py-3 bg-background rounded-lg flex-shrink-0"
                    style={{ width: '120px', height: '56px' }}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
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
              Strategic partnerships with industry leaders for quality, technology, and reliability
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-primary to-secondary-light rounded-2xl p-8 text-white"
            >
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Vision Statement</h3>
              <p className="text-white/80 leading-relaxed">
                To be Nigeria's leading indigenous oilfield service company, recognized for technical excellence, operational integrity, and sustainable value creation.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-accent to-secondary-light rounded-2xl p-8 text-white"
            >
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Mission Statement</h3>
              <p className="text-white/80 leading-relaxed">
                To provide innovative and efficient oilfield solutions through professionalism, technology, and commitment to quality, safety, and environmental responsibility.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Our Values
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
              What Drives <span className="text-gradient">Us</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
                  <value.icon className="w-7 h-7 text-primary group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-text mb-3">{value.title}</h3>
                <p className="text-text-muted leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Bring Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Our Strength
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
              What We <span className="text-gradient">Bring to the Table</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'OEM support and excellent service delivery',
                description: 'Full support from OEM and Technical partners for all Clients completions tools design, manufacturing and installations.',
                icon: Cog
              },
              {
                title: 'Quick Response',
                description: 'On the Go response and solution provision to client\'s project request.',
                icon: Clock
              },
              {
                title: 'Local Inventory',
                description: 'In Country Owned inventory for a variety of OEM\'s completion tools for on-the-spot makeup during unplanned operations.',
                icon: Globe
              },
              {
                title: 'Time Savings',
                description: 'Saves Customer\'s project time up to 8 weeks or more waiting for tools from OEM manufacturing plant.',
                icon: TrendingUp
              },
              {
                title: 'Cost Efficiency',
                description: 'Cost Saving for our client as the urgency of going through OEM manufacturing plant and its induced high cost is eliminated.',
                icon: Wrench
              },
              {
                title: 'One-Stop Shop',
                description: 'Local One Stop shop solutions for unplanned project/operations needs.',
                icon: Shield
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-background rounded-2xl p-8 hover:bg-primary/5 transition-colors"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{item.title}</h3>
                <p className="text-text-muted">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Inventory Section with Flip Cards */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Equipment Inventory
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
              Our <span className="text-gradient">Inventory</span>
            </h2>
            <p className="text-text-muted text-lg">
              Hover over each card to see details about our equipment capabilities.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {equipmentCategories.map((equipment, index) => (
              <motion.div
                key={equipment.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group h-64 [perspective:1000px]"
              >
                <div className="relative h-full w-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  {/* Front Side - Image with Animated Gradient */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-xl shadow-gray-200/50">
                    <img
                      src={equipment.image}
                      alt={equipment.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Animated Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-secondary-light animate-gradient" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                      <h3 className="text-2xl font-bold text-center drop-shadow-lg">{equipment.name}</h3>
                    </div>
                  </div>
                  
                  {/* Back Side - Details */}
                  <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gradient-to-br from-primary to-secondary-light rounded-2xl p-8 flex flex-col items-center justify-center text-white shadow-xl shadow-gray-200/50">
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                      <Cog className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-center mb-3">{equipment.name}</h3>
                    <p className="text-white/80 text-center text-sm">{equipment.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Leadership
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
              Meet Our <span className="text-gradient">Team</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-background rounded-2xl p-6 lg:p-8 text-center hover:shadow-xl hover:shadow-primary/10 transition-all"
              >
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-lg shadow-gray-200/50">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">{member.name}</h3>
                <p className="text-accent font-medium mb-4">{member.role}</p>
                <p className="text-text-muted text-sm leading-relaxed">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-light via-primary to-secondary-light animate-gradient" />
        
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
            </motion.a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}