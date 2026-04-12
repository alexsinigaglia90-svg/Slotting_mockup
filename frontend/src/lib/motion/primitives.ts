import type { Transition, Variants } from "motion/react";

export const EASE_OUT_EXPO: Transition["ease"] = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUART: Transition["ease"] = [0.25, 1, 0.5, 1];
export const EASE_IN_OUT_QUART: Transition["ease"] = [0.76, 0, 0.24, 1];

export const DUR_QUICK = 0.18;
export const DUR_BASE = 0.32;
export const DUR_SLOW = 0.56;

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR_BASE, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR_QUICK, ease: EASE_OUT_QUART } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR_BASE, ease: EASE_OUT_QUART } },
  exit: { opacity: 0, transition: { duration: DUR_QUICK } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: DUR_BASE, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DUR_QUICK } },
};

export const stagger = (delay = 0.04): Variants => ({
  initial: {},
  animate: {
    transition: { staggerChildren: delay, delayChildren: 0.05 },
  },
});
