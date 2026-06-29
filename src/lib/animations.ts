// Animation presets for Framer Motion
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.2 }
};

export const slideInFromLeft = {
  initial: { x: -50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3 }
};

export const slideInFromRight = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3 }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const rotateIn = {
  initial: { rotate: -10, opacity: 0 },
  animate: { rotate: 0, opacity: 1 },
  transition: { duration: 0.4 }
};

export const bounceIn = {
  initial: { scale: 0.3, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring', stiffness: 100, damping: 15 }
};

export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  }
};
