import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { fadeUp } from "@/lib/motion/primitives";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", children, ...rest }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className={`relative rounded-[12px] border border-[color:var(--color-border)] ${
        variant === "elevated"
          ? "bg-[color:var(--color-bg-elevated)] shadow-[var(--shadow-card)]"
          : "bg-[color:var(--color-bg-card)] backdrop-blur-sm"
      } ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  ),
);
Card.displayName = "Card";
