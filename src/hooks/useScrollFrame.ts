'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Total number of frames in the sequence
const TOTAL_FRAMES = 150;
const FRAME_BASE_PATH = '/hero-background/frame_';

interface UseScrollFrameOptions {
  startFrame?: number;
  endFrame?: number;
  sensitivity?: number; // How much scrolling affects frame change (lower = more scroll needed)
  preloadCount?: number; // Number of frames to preload initially
}

/**
 * Custom hook for scroll-driven frame animation
 * Maps scroll position to frame index for a video-like experience
 */
export function useScrollFrame(options: UseScrollFrameOptions = {}) {
  const {
    startFrame = 0,
    endFrame = TOTAL_FRAMES - 1,
    sensitivity = 3000, // Pixels of scroll to go through all frames
    preloadCount = 10,
  } = options;

  const [currentFrame, setCurrentFrame] = useState(startFrame);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const loadedFramesRef = useRef<Set<number>>(new Set());

  const frameCount = endFrame - startFrame + 1;

  // Generate frame paths in correct order (frame_000 to frame_149)
  const getFramePath = useCallback((frameIndex: number): string => {
    const paddedIndex = String(frameIndex).padStart(3, '0');
    return `${FRAME_BASE_PATH}${paddedIndex}_delay-0.033s.jpg`;
  }, []);

  // Preload a specific frame
  const preloadFrame = useCallback((frameIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      if (loadedFramesRef.current.has(frameIndex)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        loadedFramesRef.current.add(frameIndex);
        resolve();
      };
      img.onerror = () => {
        // Still resolve on error to not block other operations
        resolve();
      };
      img.src = getFramePath(frameIndex);
    });
  }, [getFramePath]);

  // Preload frames around current position
  const preloadNearbyFrames = useCallback(async (current: number) => {
    const framesToPreload: number[] = [];
    
    // Preload frames ahead
    for (let i = 1; i <= preloadCount; i++) {
      const nextFrame = current + i;
      if (nextFrame <= endFrame && !loadedFramesRef.current.has(nextFrame)) {
        framesToPreload.push(nextFrame);
      }
    }

    // Preload frames behind (lower priority)
    for (let i = 1; i <= 5; i++) {
      const prevFrame = current - i;
      if (prevFrame >= startFrame && !loadedFramesRef.current.has(prevFrame)) {
        framesToPreload.push(prevFrame);
      }
    }

    // Load frames in parallel
    await Promise.all(framesToPreload.map(preloadFrame));

    // Update preload progress
    const progress = Math.min(
      (loadedFramesRef.current.size / frameCount) * 100,
      100
    );
    setPreloadProgress(progress);
  }, [endFrame, startFrame, preloadCount, preloadFrame, frameCount]);

  // Calculate frame from scroll position
  const calculateFrame = useCallback((scrollY: number, heroElement: HTMLElement) => {
    const heroRect = heroElement.getBoundingClientRect();
    const heroTop = heroRect.top + scrollY;
    const heroHeight = heroRect.height;
    
    // Calculate how far we've scrolled into the hero section
    // Start animation when hero enters viewport, complete when hero leaves
    const scrollStart = heroTop;
    const scrollEnd = heroTop - window.innerHeight;
    const scrollRange = sensitivity;
    
    // Calculate progress (0 = start frame, 1 = end frame)
    const scrollProgress = Math.max(0, Math.min(1, (scrollY - scrollStart) / scrollRange));
    
    // Map to frame index
    const frameIndex = Math.round(startFrame + (scrollProgress * (endFrame - startFrame)));
    
    return Math.max(startFrame, Math.min(endFrame, frameIndex));
  }, [startFrame, endFrame, sensitivity]);

  // Check for browser support
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check for low memory devices (simple heuristic)
    const isLowMemory = (navigator as { deviceMemory?: number }).deviceMemory !== undefined 
      && (navigator as { deviceMemory?: number }).deviceMemory! < 4;
    
    // Check for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (prefersReducedMotion || isLowMemory || (isMobile && window.innerWidth < 768)) {
      setIsSupported(false);
    }
  }, []);

  // Initialize hero ref
  useEffect(() => {
    heroRef.current = document.getElementById('home');
  }, []);

  // Handle scroll
  useEffect(() => {
    if (!isSupported) return;

    const handleScroll = () => {
      if (!heroRef.current) {
        heroRef.current = document.getElementById('home');
      }
      
      if (!heroRef.current) return;

      const scrollY = window.scrollY;
      const newFrame = calculateFrame(scrollY, heroRef.current);
      
      setCurrentFrame(newFrame);
      
      // Preload nearby frames
      preloadNearbyFrames(newFrame);
    };

    // Initial preload of first few frames
    const initialPreload = async () => {
      const initialFrames = [];
      for (let i = startFrame; i < Math.min(startFrame + preloadCount, endFrame + 1); i++) {
        initialFrames.push(preloadFrame(i));
      }
      await Promise.all(initialFrames);
      setIsLoaded(true);
    };

    initialPreload();

    // Add scroll listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Handle resize
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isSupported, calculateFrame, preloadNearbyFrames, preloadFrame, startFrame, endFrame, preloadCount]);

  return {
    currentFrame,
    framePath: getFramePath(currentFrame),
    isLoaded,
    isSupported,
    preloadProgress,
    getFramePath,
    totalFrames: frameCount,
  };
}
