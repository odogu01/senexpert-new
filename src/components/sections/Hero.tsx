'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

// Frame configuration
const TOTAL_FRAMES = 150;
const FRAME_BASE_PATH = '/hero-background/frame_';
const FRAME_DURATION = 46; // ~22fps (46ms per frame) - 40% slower than 30fps

export default function Hero() {
  const scrollToAbout = () => {
    document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
  };

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const animationRef = useRef<number | null>(null);
  const frameCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastFrameTimeRef = useRef(0);
  const directionRef = useRef(1); // 1 = forward, -1 = backward
  const animationStartedRef = useRef(false);

  // Generate frame path
  const getFramePath = (frameIndex: number): string => {
    const paddedIndex = String(frameIndex).padStart(3, '0');
    return `${FRAME_BASE_PATH}${paddedIndex}_delay-0.033s.jpg`;
  };

  // Preload an image
  const preloadImage = useCallback((frameIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      if (frameCacheRef.current.has(frameIndex)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        frameCacheRef.current.set(frameIndex, img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = getFramePath(frameIndex);
    });
  }, []);

  // Animation loop - ping-pong effect
  const animate = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    const elapsed = timestamp - lastFrameTimeRef.current;

    if (elapsed >= FRAME_DURATION) {
      lastFrameTimeRef.current = timestamp;

      setCurrentFrame(prevFrame => {
        let nextFrame = prevFrame + directionRef.current;

        // Reverse direction at boundaries (ping-pong effect)
        if (nextFrame >= TOTAL_FRAMES) {
          nextFrame = TOTAL_FRAMES - 2; // Go back one frame
          directionRef.current = -1;
        } else if (nextFrame < 0) {
          nextFrame = 1; // Go forward one frame
          directionRef.current = 1;
        }

        // Preload next few frames ahead of current direction
        const preloadStart = directionRef.current === 1 
          ? Math.min(nextFrame, TOTAL_FRAMES - 5)
          : Math.max(nextFrame - 4, 0);
        
        for (let i = 0; i < 5; i++) {
          const preloadFrame = preloadStart + (i * directionRef.current);
          if (preloadFrame >= 0 && preloadFrame < TOTAL_FRAMES) {
            preloadImage(preloadFrame);
          }
        }

        return nextFrame;
      });
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [preloadImage]);

  // Check browser support
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowMemory = (navigator as { deviceMemory?: number }).deviceMemory !== undefined 
      && (navigator as { deviceMemory?: number }).deviceMemory! < 4;

    if (prefersReducedMotion || (isMobile && window.innerWidth < 768) || isLowMemory) {
      setIsSupported(false);
    }
  }, []);

  // Preload initial frames and start animation
  useEffect(() => {
    if (!isSupported) {
      setIsLoaded(true);
      return;
    }

    const initAnimation = async () => {
      // Preload first 20 frames
      const initialFrames = Array.from({ length: 20 }, (_, i) => i);
      await Promise.all(initialFrames.map(preloadImage));
      
      setIsLoaded(true);
      
      // Start animation after a short delay for content to render
      setTimeout(() => {
        if (!animationStartedRef.current) {
          animationStartedRef.current = true;
          animationRef.current = requestAnimationFrame(animate);
        }
      }, 500);
    };

    initAnimation();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSupported, preloadImage, animate]);

  // Get current frame path
  const framePath = getFramePath(currentFrame);

  // Fallback static background for unsupported browsers
  if (!isSupported) {
    return (
      <section id="home" className="relative min-h-screen overflow-hidden">
        {/* Static Background Fallback */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${getFramePath(0)})` }}
        />
        <div className="absolute inset-0 bg-primary/60" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center min-h-screen py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium">Empowering Global Energy</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
            >
              Powering the
              <br />
              <span className="text-accent">Future of Industry</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="max-w-2xl mx-auto text-lg sm:text-xl text-white/80 leading-relaxed"
            >
              SenExpert Global delivers world-class integrated services across Maritime, Oil & Gas, and Global Procurement with unmatched precision and safety.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Our Services
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { value: '60+', label: 'Years Experience' },
                { value: '500+', label: 'Projects Completed' },
                { value: '98%', label: 'On-Time Delivery' },
                { value: '150+', label: 'Expert Personnel' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.button
          onClick={scrollToAbout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors cursor-pointer z-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8" />
          </motion.div>
        </motion.button>
      </section>
    );
  }

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      {/* Video-Style Frame Animation Background */}
      <div className="absolute inset-0">
        {/* Current Frame */}
        <img
          src={framePath}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-[1.3]"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease-out'
          }}
        />
        
        {/* Loading placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-primary animate-pulse" />
        )}
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-primary/50" />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-primary/30" />
        <div className="absolute inset-0 bg-gradient-135deg from-secondary-light/20 via-transparent to-accent/10" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        />
        
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center min-h-screen py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Empowering Global Energy</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            Powering the
            <br />
            <span className="text-accent">Future of the Oil and Gas Industry</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-white/80 leading-relaxed"
          >
            SenExpert Global delivers world-class integrated services across Maritime, Oil & Gas, and Global Procurement with unmatched precision and safety.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Our Services
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { value: '60+', label: 'Years Experience' },
              { value: '500+', label: 'Projects Completed' },
              { value: '98%', label: 'On-Time Delivery' },
              { value: '150+', label: 'Expert Personnel' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToAbout}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors cursor-pointer z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </motion.button>
    </section>
  );
}
