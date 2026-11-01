import type { Transition, Variants } from "motion/react";

export const MOTION = {
  animationMs: {
    disabled: 0
  },
  duration: {
    instant: 0.16,
    fast: 0.24,
    base: 0.44,
    reveal: 0.68,
    slow: 1
  },
  easing: {
    enter: [0.22, 1, 0.36, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    standard: [0.4, 0, 0.2, 1] as const
  },
  stagger: {
    tight: 0.055,
    base: 0.09,
    relaxed: 0.14
  },
  spring: {
    responsive: { type: "spring", stiffness: 320, damping: 30, mass: 0.8 } as Transition,
    gentle: { type: "spring", stiffness: 170, damping: 24, mass: 0.9 } as Transition
  }
} as const;

export const transitions = {
  instant: { duration: MOTION.duration.instant, ease: MOTION.easing.standard },
  fast: { duration: MOTION.duration.fast, ease: MOTION.easing.standard },
  base: { duration: MOTION.duration.base, ease: MOTION.easing.enter },
  reveal: { duration: MOTION.duration.reveal, ease: MOTION.easing.enter },
  slow: { duration: MOTION.duration.slow, ease: MOTION.easing.enter }
} satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transitions.reveal }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.slow }
};

export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: MOTION.stagger.base }
  }
};

export const indexedReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...transitions.reveal,
      delay: index * MOTION.stagger.base
    }
  })
};

export const collapsibleMotion = {
  closed: { opacity: 0, height: 0 },
  open: { opacity: 1, height: "auto", transition: transitions.base },
  exit: { opacity: 0, height: 0, transition: transitions.fast }
} as const;
