/**
 * Onboarding Animation Presets
 *
 * Framer Motion variants for consistent animations across the PLG onboarding flow.
 * All animations are designed to feel smooth, responsive, and delightful.
 *
 * Design Principles:
 * - Fast: Most transitions complete in 300-500ms
 * - Natural: Uses spring physics for organic feel
 * - Purposeful: Every animation serves a UX goal (guide, celebrate, confirm)
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================
// SLIDE TRANSITIONS (between wizard steps)
// ============================================================

export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95,
  }),
};

export const slideTransition: Transition = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
  scale: { duration: 0.2 },
};

// ============================================================
// FADE TRANSITIONS (gentle in/out)
// ============================================================

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeTransition: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
};

// ============================================================
// SCALE TRANSITIONS (for emphasis)
// ============================================================

export const scaleVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

export const scaleTransition: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth scale
};

// ============================================================
// CELEBRATION ANIMATIONS (for success states)
// ============================================================

/**
 * Pulse animation for "Aha!" moments
 * Uses a gentle scale and shadow animation
 */
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0 0 rgba(99, 102, 241, 0.4)',
      '0 0 0 10px rgba(99, 102, 241, 0)',
    ],
  },
};

export const pulseTransition: Transition = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut',
};

/**
 * Bounce animation for success states
 * Springy overshoot for celebratory feel
 */
export const bounceVariants: Variants = {
  initial: { scale: 0, y: 20 },
  animate: {
    scale: 1,
    y: 0,
  },
};

export const bounceTransition: Transition = {
  duration: 0.5,
  type: 'spring',
  bounce: 0.5,
  stiffness: 200,
};

/**
 * Checkmark animation for completion states
 */
export const checkmarkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
  },
};

export const checkmarkTransition: Transition = {
  pathLength: { duration: 0.5, ease: 'easeInOut' },
  opacity: { duration: 0.3 },
};

// ============================================================
// STAGGER ANIMATIONS (list items appearing sequentially)
// ============================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

// ============================================================
// LOADING STATES
// ============================================================

/**
 * Spinner animation for loading states
 */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
  },
};

export const spinnerTransition: Transition = {
  duration: 1,
  repeat: Infinity,
  ease: 'linear',
};

/**
 * Skeleton loading animation
 */
export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
  },
};

export const skeletonTransition: Transition = {
  duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut',
};

// ============================================================
// PROGRESS BAR ANIMATIONS
// ============================================================

/**
 * Smooth progress bar fill
 */
export const progressVariants: Variants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
  }),
};

export const progressTransition: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
};

// ============================================================
// HOVER & FEEDBACK ANIMATIONS
// ============================================================

/**
 * Subtle lift on hover for cards/buttons
 */
export const hoverLift: Variants = {
  initial: { y: 0 },
  hover: {
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Scale up on hover for interactive elements
 */
export const hoverScale: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Press down animation for buttons
 */
export const pressDown: Variants = {
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeOut',
    },
  },
};

// ============================================================
// NOTIFICATION/TOAST ANIMATIONS
// ============================================================

export const toastSlideIn: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

export const toastSlideInTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

// ============================================================
// MODAL ANIMATIONS
// ============================================================

export const modalScaleIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

export const modalScaleInTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get transition based on screen size
 * Slower on mobile for better readability
 */
export function getResponsiveTransition(
  isMobile: boolean
): Transition {
  return {
    duration: isMobile ? 0.4 : 0.3,
    ease: 'easeInOut',
  };
}

/**
 * Get stagger delay based on number of items
 * Prevents overly long animations for large lists
 */
export function getOptimizedStagger(count: number): number {
  if (count <= 3) return 0.1;
  if (count <= 10) return 0.08;
  return 0.05; // Faster for large lists
}
