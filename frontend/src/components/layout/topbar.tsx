"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/warehouse", label: "Warehouse" },
  { href: "/opex", label: "OPEX" },
];

export function Topbar() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.6) 100%)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex h-14 items-center gap-6 px-6">
        {/* Brand */}
        <Link href="/warehouse" className="flex items-center gap-2.5 group">
          <motion.div
            className="relative h-6 w-6 rounded-md"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%)",
            }}
            whileHover={{ rotate: 4, scale: 1.05 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"
              style={{ boxShadow: "0 0 18px var(--color-accent-glow)" }}
            />
          </motion.div>
          <span className="text-[13px] font-semibold tracking-tight">
            Slotting
          </span>
          <span className="text-[11px] text-[color:var(--color-fg-dim)] tracking-wider uppercase">
            DC-Demo
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.18 }}
                  className={`relative rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "text-[color:var(--color-fg)]"
                      : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-x-2 -bottom-0.5 h-[2px] rounded-full"
                      style={{
                        background: "var(--color-accent)",
                        boxShadow: "0 0 8px var(--color-accent-glow)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 40,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Right: live + actions */}
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <Link href="/present">
            <Button variant="outline" className="text-[12px]">
              Presentation mode
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
