// Professional micro-interactions and transitions for clinical interfaces

export const TRANSITION_DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500
} as const

export const EASING = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  clinical: [0.25, 0.46, 0.45, 0.94] // Professional, smooth easing
} as const

// Framer Motion variants for common animations
export const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { 
    duration: TRANSITION_DURATIONS.normal / 1000,
    ease: EASING.clinical
  }
}

export const slideInFromRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: { 
    duration: TRANSITION_DURATIONS.normal / 1000,
    ease: EASING.clinical
  }
}

export const slideInFromLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
  transition: { 
    duration: TRANSITION_DURATIONS.normal / 1000,
    ease: EASING.clinical
  }
}

export const slideInFromTop = {
  initial: { y: '-100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
  transition: { 
    duration: TRANSITION_DURATIONS.normal / 1000,
    ease: EASING.clinical
  }
}

export const slideInFromBottom = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: { 
    duration: TRANSITION_DURATIONS.normal / 1000,
    ease: EASING.clinical
  }
}

export const scaleInOut = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { 
    duration: TRANSITION_DURATIONS.normal / 1000,
    ease: EASING.clinical
  }
}

export const modalVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { 
      duration: TRANSITION_DURATIONS.fast / 1000,
      ease: EASING.easeOut
    }
  },
  modal: {
    initial: { scale: 0.9, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.9, opacity: 0, y: 20 },
    transition: { 
      duration: TRANSITION_DURATIONS.normal / 1000,
      ease: EASING.clinical
    }
  }
}

export const listItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { 
    duration: TRANSITION_DURATIONS.normal / 1000,
    ease: EASING.clinical
  }
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const buttonHover = {
  scale: 1.02,
  transition: { 
    duration: TRANSITION_DURATIONS.fast / 1000,
    ease: EASING.easeOut
  }
}

export const buttonTap = {
  scale: 0.98,
  transition: { 
    duration: TRANSITION_DURATIONS.fast / 1000,
    ease: EASING.easeOut
  }
}

// CSS transition classes for non-Framer Motion components
export const transitionClasses = {
  all: `transition-all duration-${TRANSITION_DURATIONS.normal} ease-out`,
  colors: `transition-colors duration-${TRANSITION_DURATIONS.fast} ease-out`,
  transform: `transition-transform duration-${TRANSITION_DURATIONS.normal} ease-out`,
  opacity: `transition-opacity duration-${TRANSITION_DURATIONS.normal} ease-out`,
  shadow: `transition-shadow duration-${TRANSITION_DURATIONS.normal} ease-out`,
  clinical: `transition-all duration-${TRANSITION_DURATIONS.normal}`,
  
  // Hover states
  hover: {
    scale: 'hover:scale-105 active:scale-95',
    lift: 'hover:shadow-lg hover:-translate-y-1',
    glow: 'hover:shadow-md hover:shadow-blue-200/50',
    clinical: 'hover:bg-blue-50 hover:border-blue-300'
  },
  
  // Focus states (accessibility compliant)
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    clinicalRing: 'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
    visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  }
}

// Loading animation keyframes
export const loadingAnimations = {
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 }
  },
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  bounce: {
    '0%, 100%': { 
      transform: 'translateY(-25%)',
      animationTimingFunction: 'ease-in'
    },
    '50%': { 
      transform: 'translateY(0)',
      animationTimingFunction: 'ease-out'
    }
  },
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' }
  }
}

// Progress bar animations
export const progressVariants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: TRANSITION_DURATIONS.slow / 1000,
      ease: EASING.easeOut
    }
  })
}

// Toast notification animations
export const toastVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: { 
    type: 'spring',
    stiffness: 500,
    damping: 30
  }
}

// Form field animations
export const fieldVariants = {
  error: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  },
  success: {
    scale: [1, 1.02, 1],
    transition: { duration: 0.3 }
  }
}

// Clinical-specific animations (subtle and professional)
export const clinicalAnimations = {
  subtleFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { 
      duration: TRANSITION_DURATIONS.slow / 1000,
      ease: EASING.clinical
    }
  },
  
  gentleSlide: {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 },
    transition: { 
      duration: TRANSITION_DURATIONS.normal / 1000,
      ease: EASING.clinical
    }
  },
  
  professionalScale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { 
      duration: TRANSITION_DURATIONS.normal / 1000,
      ease: EASING.clinical
    }
  }
}

// Utility function to create staggered animations
export const createStaggeredAnimation = (
  baseVariant: any,
  staggerDelay: number = 0.1
) => ({
  container: {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: staggerDelay
      }
    }
  },
  item: baseVariant
})

// Accessibility-compliant focus animations
export const accessibleFocus = {
  ring: {
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
    transition: `box-shadow ${TRANSITION_DURATIONS.fast}ms ease-out`
  },
  clinicalRing: {
    boxShadow: '0 0 0 2px rgba(96, 165, 250, 0.5)',
    transition: `box-shadow ${TRANSITION_DURATIONS.fast}ms ease-out`
  }
}

// Reduced motion variants for accessibility
export const reducedMotionVariants = {
  fadeOnly: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 }
  }
}