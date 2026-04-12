"use client";
import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost" | "outline";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", className = "", children, ...rest }, ref) => {
    const base =
      "inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-medium transition-colors";
    const variants = {
      primary: "bg-[color:var(--color-accent)] text-black hover:bg-[color:var(--color-accent)]/90",
      ghost: "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-bg-card-hover)]",
      outline: "border border-[color:var(--color-border-strong)] text-[color:var(--color-fg)] hover:bg-[color:var(--color-bg-card-hover)]",
    };
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className={`${base} ${variants[variant]} ${className}`}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
