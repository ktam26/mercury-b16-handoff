'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Premium glass card component with entrance animation
 */
export function GlassCard({ children, className, delay = 0, padding = 'p-4' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn(
        "bg-stadium-dark/80 backdrop-blur-xl rounded-2xl",
        "border border-stadium-border",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        padding,
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated section wrapper for staggered reveals
 */
export function AnimatedSection({ children, className, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/**
 * Container with staggered children animation
 */
export function StaggerContainer({ children, className, staggerDelay = 0.1 }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Child item for StaggerContainer
 */
export function StaggerItem({ children, className }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
