"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LiveIndicator } from "@/components/ui/live-indicator";

interface SidebarProps {
  active: string;
  onChange: (v: string) => void;
}

const NAV_SECTIONS = [
  {
    label: "View",
    items: [
      { id: "overview", label: "Overzicht", icon: "⊞" },
      { id: "warehouse", label: "Warehouse Map", icon: "⊟" },
    ],
  },
  {
    label: "Analyse",
    items: [
      { id: "problems", label: "Problemen", icon: "⚡", badge: 5 },
      { id: "optimize", label: "Optimalisatie", icon: "◉" },
    ],
  },
  {
    label: "Actions",
    items: [
      { id: "movements", label: "Verplaatsingen", icon: "⇄" },
      { id: "opex", label: "Opex Impact", icon: "€" },
    ],
  },
];

export function WarehouseSidebar({ active, onChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 64 },
  };

  return (
    <motion.div
      initial="expanded"
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        minHeight: "calc(100vh - 3.5rem)",
        background: "rgba(10,10,15,0.6)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 2,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 16,
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background:
              "linear-gradient(135deg, var(--color-accent) 0%, rgba(202,218,56,0.6) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 900,
            color: "#0a0a0f",
            flexShrink: 0,
            boxShadow: "0 0 20px var(--color-accent-glow)",
          }}
        >
          S
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--color-fg)",
                }}
              >
                SlotPilot
              </div>
              <div className="label" style={{ marginTop: 1 }}>
                Warehouse Intelligence
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <motion.button
          onClick={() => setCollapsed((c) => !c)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: "absolute",
            top: 20,
            right: collapsed ? 16 : 14,
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "1px solid var(--color-border-strong)",
            background: "var(--color-bg-card)",
            color: "var(--color-fg-muted)",
            cursor: "pointer",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {collapsed ? "→" : "←"}
        </motion.button>
      </div>

      {/* Nav sections */}
      <nav style={{ padding: "8px 0", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            {/* Section label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="label"
                  style={{
                    padding: "8px 20px 4px",
                    display: "block",
                  }}
                >
                  {section.label}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 1 }}>
              {section.items.map((item, ii) => {
                const isActive = active === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: si * 0.06 + ii * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ x: 2 }}
                    title={item.label}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: collapsed ? "10px 0" : "9px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: "var(--radius-sm)",
                      border: isActive
                        ? "none"
                        : "none",
                      borderLeft: isActive
                        ? "2px solid var(--color-accent)"
                        : "2px solid transparent",
                      cursor: "pointer",
                      background: isActive
                        ? "var(--color-accent-soft)"
                        : "transparent",
                      color: isActive
                        ? "var(--color-fg)"
                        : "var(--color-fg-muted)",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 450,
                      fontFamily: "var(--font-sans)",
                      transition: "background 0.15s ease, color 0.15s ease",
                      position: "relative",
                      boxShadow: isActive
                        ? "inset 0 0 12px var(--color-accent-glow)"
                        : "none",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        textAlign: "center",
                        fontSize: collapsed ? 15 : 13,
                        color: isActive ? "var(--color-accent)" : "inherit",
                        filter: isActive
                          ? "drop-shadow(0 0 6px var(--color-accent-glow))"
                          : "none",
                      }}
                    >
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ flex: 1, textAlign: "left" }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {"badge" in item && item.badge && (
                      <span
                        style={{
                          background: "var(--color-critical)",
                          color: "#fff",
                          fontSize: 8,
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "var(--radius-pill)",
                          minWidth: 14,
                          textAlign: "center",
                          ...(collapsed
                            ? { position: "absolute", top: 2, right: 2 }
                            : {}),
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: collapsed ? "16px 8px" : "16px 16px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: collapsed ? "center" : "flex-start",
          transition: "padding 0.2s ease",
        }}
      >
        {/* Live indicator row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflow: "hidden",
          }}
        >
          <LiveIndicator />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontSize: 11,
                  color: "var(--color-fg-muted)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Live data
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Timestamp */}
        <AnimatePresence>
          {!collapsed && timestamp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tnum label"
              style={{ fontSize: 10, color: "var(--color-fg-ghost)" }}
            >
              {timestamp}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CICT Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: 0.65,
            marginTop: 4,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
            <rect x="5" y="5" width="55" height="55" rx="4" fill="var(--color-accent)" />
            <path
              d="M 52 8 Q 8 8, 8 52"
              stroke="#0a0a0f"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <text
              x="22"
              y="52"
              fontSize="38"
              fontWeight="900"
              fill="#0a0a0f"
              fontFamily="var(--font-sans)"
            >
              C
            </text>
            <text
              x="48"
              y="80"
              fontSize="26"
              fontWeight="900"
              fill="var(--color-fg)"
              fontFamily="var(--font-sans)"
            >
              ICT
            </text>
          </svg>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="label" style={{ fontSize: 9 }}>
                  POWERED BY
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                  }}
                >
                  CICT Innovations
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
