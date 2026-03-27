'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent = true }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/')) {
      setIsMobileMenuOpen(false);
      return;
    }
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          (isScrolled || transparent === false) 
            ? 'bg-primary/95 backdrop-blur-lg shadow-lg shadow-primary/20' 
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group z-50">
              <motion.img 
                src="/logo.png" 
                alt="SenExpert Global" 
                className="h-12 sm:h-14 md:h-16 w-auto transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'group relative px-4 py-2 font-medium transition-colors',
                      isActive 
                        ? 'text-accent' 
                        : 'text-white/90 hover:text-accent'
                    )}
                  >
                    <motion.span
                      className="absolute inset-0 bg-white/10 rounded-lg"
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ originX: 0, originY: 0 }}
                    />
                    <span className="relative z-10 flex items-center gap-1">
                      <span className={cn(
                        'relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300',
                        isActive && 'after:scale-x-100'
                      )}>
                        {link.label}
                      </span>
                    </span>
                  </motion.a>
                );
              })}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="hidden md:block"
            >
              <Link href="/login">
                <Button variant="accent" size="sm">
                  <User className="w-4 h-4" />
                  Login
                </Button>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors z-50 relative"
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Gradient accent line */}
        <motion.div 
          className="h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isScrolled ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </motion.nav>

      {/* Mobile Menu Overlay - Slide from right */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Slide-in Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-gradient-to-b from-primary to-primary/95 shadow-2xl z-50 md:hidden overflow-y-auto"
            >
              {/* Close button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Logo in menu */}
              <div className="px-6 pb-6">
                <img 
                  src="/logo.png" 
                  alt="SenExpert Global" 
                  className="h-12 w-auto"
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10 mx-6 mb-6" />

              {/* Navigation Links */}
              <nav className="flex flex-col px-6">
                {navLinks.map((link, index) => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'py-4 text-lg font-medium transition-colors border-b border-white/5',
                        isActive ? 'text-accent' : 'text-white/90 hover:text-accent'
                      )}
                    >
                      {link.label}
                    </motion.a>
                  );
                })}
              </nav>

              {/* Login Button */}
              <div className="px-6 pt-6">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="accent" size="lg" className="w-full">
                    <User className="w-5 h-5" />
                    Login
                  </Button>
                </Link>
              </div>

              {/* Decorative element */}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-4 w-20 h-20 bg-secondary-light/10 rounded-full blur-2xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
