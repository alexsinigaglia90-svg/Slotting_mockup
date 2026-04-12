"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HoldToCommit } from "./hold-to-commit";

/* ─── Types ─── */
type Velocity = "A" | "B" | "C" | "D" | "empty";

interface NewSkuWizardProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/* ─── Static data (mirrors page.tsx) ─── */
const VCOL: Record<Velocity, string> = {
  A: "#34d89e", B: "#f0c040", C: "#5ba8ff", D: "#8090b8", empty: "transparent",
};

const NEW_SKUS = [
  { id: "SKU-NEW-001", name: "LED Tuinverlichting Solar 4st", cat: "Tuin & Seizoen", velocity: "A" as Velocity, expectedPicks: 62 },
  { id: "SKU-NEW-002", name: "Zonnebrand SPF50 200ml", cat: "Beauty", velocity: "A" as Velocity, expectedPicks: 55 },
  { id: "SKU-NEW-003", name: "Picknickkleed 150x200", cat: "Tuin & Seizoen", velocity: "B" as Velocity, expectedPicks: 28 },
  { id: "SKU-NEW-004", name: "Insectenspray 400ml", cat: "Huishoudelijk", velocity: "B" as Velocity, expectedPicks: 22 },
  { id: "SKU-NEW-005", name: "Opblaasbaar Zwembad 120cm", cat: "Tuin & Seizoen", velocity: "B" as Velocity, expectedPicks: 18 },
  { id: "SKU-NEW-006", name: "IJsvormpjes Siliconen", cat: "Huishoudelijk", velocity: "C" as Velocity, expectedPicks: 8 },
  { id: "SKU-NEW-007", name: "Strandlaken 90x170", cat: "Kleding", velocity: "C" as Velocity, expectedPicks: 7 },
  { id: "SKU-NEW-008", name: "Citronella Kaars Set 3st", cat: "Tuin & Seizoen", velocity: "C" as Velocity, expectedPicks: 9 },
  { id: "SKU-NEW-009", name: "Waterpistool XL 45cm", cat: "Speelgoed", velocity: "C" as Velocity, expectedPicks: 6 },
  { id: "SKU-NEW-010", name: "Tuinslang Koppeling Set", cat: "Tuin & Seizoen", velocity: "D" as Velocity, expectedPicks: 3 },
  { id: "SKU-NEW-011", name: "Camping Bestek Set", cat: "Huishoudelijk", velocity: "D" as Velocity, expectedPicks: 2 },
  { id: "SKU-NEW-012", name: "Hangmat Katoen Naturel", cat: "Tuin & Seizoen", velocity: "D" as Velocity, expectedPicks: 2 },
];

const SLOT_SUGGESTIONS = [
  { sku: "LED Tuinverlichting Solar 4st", location: "A02-R05-L1", reason: "ML voorspelt A-class velocity — 89% co-occurrence met Tuin & Buiten cluster" },
  { sku: "Zonnebrand SPF50 200ml", location: "A01-L12-L1", reason: "A-class verwacht — OR-solver plaatst in Beauty Basics cluster, route-score optimaal" },
  { sku: "Picknickkleed 150x200", location: "A04-R08-L2", reason: "B-class, tuin-zone, co-occurrence met BBQ producten" },
  { sku: "Insectenspray 400ml", location: "A03-L15-L1", reason: "B-class, huishoudelijk zone, grondniveau" },
  { sku: "Opblaasbaar Zwembad 120cm", location: "A05-R02-L1", reason: "B-class, groot formaat → grondniveau verplicht" },
  { sku: "IJsvormpjes Siliconen", location: "A06-L09-L2", reason: "C-class, huishoudelijk cluster" },
  { sku: "Strandlaken 90x170", location: "A08-R03-L2", reason: "C-class, kleding/accessoires zone" },
  { sku: "Citronella Kaars Set 3st", location: "A07-L11-L2", reason: "C-class, naast bestaande kaarsen" },
  { sku: "Waterpistool XL 45cm", location: "A09-R06-L3", reason: "C-class, speelgoed zone, niveau 3" },
  { sku: "Tuinslang Koppeling Set", location: "A12-L04-L3", reason: "D-class, bulk storage zone" },
  { sku: "Camping Bestek Set", location: "A13-R07-L4", reason: "D-class, laagfrequent, bovenin" },
  { sku: "Hangmat Katoen Naturel", location: "A14-L02-L4", reason: "D-class, groot, bulk storage" },
];

const DISPLACED = [
  { sku: "Wintersjaal Grijs", from: "A02-R05-L1", to: "A11-L08-L3", reason: "D-class, 1 pick/wk → verplaatst naar bulk" },
  { sku: "Kerstverlichting 200LED", from: "A01-L12-L1", to: "A13-R12-L4", reason: "Seizoensartikel buiten seizoen → opslag" },
  { sku: "Handschoenen Fleece", from: "A04-R08-L2", to: "A14-L09-L4", reason: "0 picks afgelopen maand → verplaatst" },
];

const STEP_LABELS = ["Nieuwe SKUs", "Voorgestelde locaties", "Impact", "Bevestig"];

export function NewSkuWizard({ onConfirm, onCancel }: NewSkuWizardProps) {
  const [step, setStep] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 16, scale: 0.97, filter: "blur(10px)" }}
      transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 150,
        width: 480,
        maxHeight: "70vh",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        background: "rgba(10,10,15,0.78)",
        backdropFilter: "blur(28px) saturate(1.4)",
        WebkitBackdropFilter: "blur(28px) saturate(1.4)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 60px 120px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(202,218,56,0.08)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
        <div>
          <div className="label" style={{ marginBottom: 5, color: "#8b6fff" }}>NIEUWE SKU BATCH</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {NEW_SKUS.length} artikelen
          </div>
          <div style={{ fontSize: 11, color: "var(--color-fg-muted)", marginTop: 2 }}>ontvangen van WMS</div>
        </div>
        <motion.button
          onClick={onCancel}
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            width: 28, height: 28, borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--color-fg-muted)",
            cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </motion.button>
      </div>

      {/* Step indicators */}
      <div style={{ padding: "14px 20px 10px", display: "flex", gap: 6, flexShrink: 0 }}>
        {STEP_LABELS.map((s, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div
              key={i}
              style={{ flex: 1, cursor: i <= step ? "pointer" : "default" }}
              onClick={() => i <= step && setStep(i)}
            >
              <div style={{ position: "relative", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 5 }}>
                {(isActive || isDone) && (
                  <motion.div
                    initial={{ width: isDone ? "100%" : 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "absolute", inset: 0,
                      background: isDone ? "#34d89e" : "#cada38",
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                  background: isDone ? "#34d89e" : isActive ? "#cada38" : "rgba(255,255,255,0.08)",
                  border: `2px solid ${isDone ? "#34d89e" : isActive ? "#cada38" : "rgba(255,255,255,0.12)"}`,
                  boxShadow: isActive ? "0 0 10px rgba(202,218,56,0.4)" : isDone ? "0 0 8px rgba(52,216,158,0.3)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, color: "#000", fontWeight: 800,
                  transition: "all 0.3s ease",
                }}>
                  {isDone ? "✓" : null}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#cada38" : isDone ? "#34d89e" : "var(--color-fg-muted)",
                  transition: "color 0.2s ease",
                }}>
                  {s}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: "4px 20px 16px" }}
            >
              <div style={{ fontSize: 12, color: "var(--color-fg-muted)", marginBottom: 12 }}>
                De volgende artikelen zijn ontvangen en wachten op slotting:
              </div>
              {NEW_SKUS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.25 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: i < NEW_SKUS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-fg)" }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "var(--color-fg-muted)" }}>{s.cat} · {s.id}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-fg-muted)" }}>{s.expectedPicks}/wk</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 7px",
                      borderRadius: 999, background: VCOL[s.velocity], color: "#000",
                    }}>{s.velocity}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: "4px 20px 16px" }}
            >
              <div style={{ fontSize: 12, color: "var(--color-fg-muted)", marginBottom: 12 }}>
                Op basis van velocity, affiniteit en beschikbaarheid stellen wij de volgende locaties voor:
              </div>
              {SLOT_SUGGESTIONS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.25 }}
                  style={{
                    padding: "9px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-fg)" }}>{s.sku}</span>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#34d89e", fontWeight: 600 }}>{s.location}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-fg-muted)" }}>{s.reason}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: "4px 20px 16px" }}
            >
              <div style={{ fontSize: 12, color: "var(--color-fg-muted)", marginBottom: 12 }}>
                Om ruimte te maken worden de volgende bestaande producten verplaatst:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div style={{ fontSize: 10, color: "var(--color-fg-muted)", marginBottom: 4 }}>Producten verplaatst</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ffb340" }}>{DISPLACED.length}</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div style={{ fontSize: 10, color: "var(--color-fg-muted)", marginBottom: 4 }}>Netto impact</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#34d89e" }}>+8%</div>
                  <div style={{ fontSize: 10, color: "var(--color-fg-muted)" }}>picks/uur</div>
                </motion.div>
              </div>
              {DISPLACED.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.25 }}
                  style={{
                    padding: "9px 12px",
                    background: "rgba(255,190,48,0.05)",
                    border: "1px solid rgba(255,190,48,0.12)",
                    borderRadius: 10,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-fg)", marginBottom: 5 }}>{d.sku}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#ff5c7c" }}>{d.from}</span>
                    <span style={{ fontSize: 11, color: "var(--color-fg-muted)" }}>→</span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#ffb340" }}>{d.to}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-fg-muted)" }}>{d.reason}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: "24px 20px", textAlign: "center" }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 6 }}>
                {NEW_SKUS.length} nieuwe SKUs slotten
              </div>
              <div style={{ fontSize: 13, color: "var(--color-fg-muted)", marginBottom: 4 }}>{DISPLACED.length} bestaande producten verplaatsen</div>
              <div style={{ fontSize: 13, color: "#34d89e", fontWeight: 600, marginBottom: 28 }}>Verwachte verbetering: +8% picks/uur</div>

              <HoldToCommit onConfirm={onConfirm} label="Houd ingedrukt om te slotten" size={100} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      {step < 3 && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: "7px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: step === 0 ? "rgba(255,255,255,0.2)" : "var(--color-fg-muted)",
              fontSize: 12, fontWeight: 500, cursor: step === 0 ? "default" : "pointer",
              transition: "color 0.15s ease",
            }}
          >
            Vorige
          </button>
          <motion.button
            onClick={() => setStep(s => s + 1)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "7px 18px", borderRadius: 10, border: "none",
              background: "#cada38",
              color: "#000",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 0 16px rgba(202,218,56,0.3)",
            }}
          >
            Volgende
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
