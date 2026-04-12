import type { HTMLAttributes } from "react";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "accent" | "secondary" | "critical" | "positive";
}

const TONES: Record<NonNullable<PillProps["tone"]>, string> = {
  default: "text-[color:var(--color-fg-muted)] border-[color:var(--color-border)]",
  accent: "text-[color:var(--color-accent)] border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent-soft)]",
  secondary: "text-[color:var(--color-secondary)] border-[color:var(--color-secondary)]/40 bg-[color:var(--color-secondary)]/10",
  critical: "text-[color:var(--color-critical)] border-[color:var(--color-critical)]/40 bg-[color:var(--color-critical)]/10",
  positive: "text-[color:var(--color-positive)] border-[color:var(--color-positive)]/40 bg-[color:var(--color-positive)]/10",
};

export function Pill({ tone = "default", className = "", children, ...rest }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
