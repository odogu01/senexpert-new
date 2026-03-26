'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  as?: 'button' | 'a';
  href?: string;
}

const variants = {
  primary: 'bg-primary text-white hover:bg-secondary shadow-lg shadow-primary/25',
  secondary: 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary',
  accent: 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25',
  ghost: 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  as: Tag = 'button',
  href,
}: ButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-300',
    variants[variant],
    sizes[size],
    className
  );

  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 },
  };

  if (Tag === 'a') {
    return (
      <motion.a
        href={href}
        onClick={onClick}
        className={baseClasses}
        {...motionProps}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={baseClasses}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
