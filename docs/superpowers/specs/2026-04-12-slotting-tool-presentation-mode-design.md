# Slotting Tool — Presentation Mode & Foundation

**Date:** 2026-04-12
**Status:** Draft (awaiting user review)
**Owner:** Alex

## Context

The slotting tool currently feels unfinished for its intended first audience: Action directie (executive decision-makers). Two root causes:

1. **No narrative spine.** The tool is a sandbox — usable, but there is no guided flow that walks a viewer from "this is the pain" to "this is the outcome" in the ~5 minutes typical of a directie pitch.
2. **Missing functionality behind the story.** Several scenes that would carry the narrative don't exist yet (risk view, people-impact view, closing promise screen), and the existing numbers in the tool are partly hardcoded rather than computed from a real data model.

This spec addresses both in a single coordinated piece of work: we add a **Presentation Mode** on top of the existing Next.js frontend, and we add the foundation (real grid-data model) that makes both the presentation and the existing sandbox honest.

## Goals

- A ~5-minute guided demo for Action directie that lands the value story in three dimensions: **risk**, **people**, **tempo**.
- A real grid-data model in the tool so that meters, compliance violations, and hours are *computed* from data, not pasted on slides. This makes in-tool numbers "absolute", not claims.
- Strip all "AI / ML / neural" framing from user-facing copy. The tool sells on outcomes and mechanics, not on a technology label.
- Preserve the sandbox. The existing tool remains available for deeper exploration; Presentation Mode is a new mode, not a replacement.

## Non-goals

- No pilot CTA, no "pilot in DC X, 8 weeks". The closing is a product promise, not a pitch ask.
- No speculative downstream claims (verloop%, nachtshifts vermeden, retention, RSI). Not in demo, not in tool, not anywhere.
- No logos of WMS vendors on the closing screen. Text-only positioning.
- No separate pitch-deck codebase. One tool, two modes.
- No visual redesign of existing components beyond what the AI-cleanup and grid-wiring require.
- No real Action data. Demo runs on a plausible fixture dataset; structure allows swap-in later without UI changes.

## Audience & narrative frame

**Primary viewer:** Action directie. Non-food retail, 26 DCs, cost-discipline culture, skeptical of hype, labor-market pressure is a top concern.

**Narrative spine:** risk + people + tempo, in that order, each sold on its own terms, closing on a product promise.

**Tone constraints:**
- No "AI". Use "tool berekent", "voorstel", "scenario-analyse", "optimalisatie". See also: feedback memory `feedback_no_ai_framing`.
- No HR-as-decision-maker framing. HR does not decide operational matters at Action. See also: `project_action_decision_model`.
- In-tool computed values are fine when they come from the real grid. Closing/summary claims are strictly qualitative — only "significante OPEX-reductie" is allowed as an impact statement. See also: `feedback_no_unsupportable_claims`.

## Architecture overview

Three things are added; one thing is removed; several things are modified.

**Added:**
1. **Grid-data foundation** at `frontend/src/lib/grid/` — fixture dataset, SKU-attribute model, meters-module, rule-checker, voorstel-generator. All client-side TypeScript, with an interface boundary that allows the Python engine in `slotting/engine/` to be plugged in later without UI changes.
2. **Presentation Mode** — a new UI mode toggled from the topbar. Wraps the existing views in a chapter-navigation shell with minimal chrome, progress indicator, exit control. Sandbox remains reachable when the mode is off.
3. **New presentation-only scenes** that don't exist in the sandbox: Marco intro + spaghetti zoom-out, risk-layer tabs over the map, people domino, scenario carousel with one hero + three warm tabs, final closing screen.

**Removed:**
- **Neural Network View** (`frontend/src/app/neural/` and its components, navigation entries, related assets). Removed entirely per user decision — not renamed, not repurposed.

**Modified:**
- Existing warehouse-2d / warehouse-3d / reslot-toaster / Command Center / new-SKU-batch-wizard components read their numbers from the grid-data layer instead of hardcoded mocks.
- All user-facing copy in the existing UI is swept for "AI / ML / neural / intelligent" framing and rewritten.

## Grid-data model (foundation)

Lives at `frontend/src/lib/grid/`. Pure TypeScript, client-side, no server round-trip for the demo.

**Shape of a slot:**

- `position`: { zone, rij, kolom, hoogte_niveau }
- `sku`: reference to an SKU record
- `ergonomie_zone`: derived from `hoogte_niveau` (reik / buk / klim)

**Shape of an SKU record:**

- `id`, `naam`
- `pick_frequency_per_shift`: number
- `gewicht_kg`: number
- `afmeting`: { l, b, h }
- `categorie`: string
- `gevarenklasse`: enum (none / flam / chem / food-incompat / etc.)

**Modules exposed:**

1. **Meters-module.** Given current slot layout and SKU pick-frequencies, compute meters per pick (averaged and per-SKU), meters per shift per DC, and uren-equivalent using a fixed walking-speed constant (~1.2 m/s, documented in code). Used by: Hoofdstuk 1 euro-teller; Hoofdstuk 3 domino; the existing reslot-toaster's before/after metrics.
2. **Rule-checker.** Walks all slots against three rule-sets and emits a list of violations per layer:
   - `compliance`: gevaarlijke stoffen naast food, brandcompartiment-schending, zwaar-boven-licht.
   - `ergonomie`: hoog-frequente picks in pijn-zones, zware SKU's in reik-zones waar ze niet horen.
   - `continuiteit`: fragiliteit-analyse — welke slots creëren single-point-of-failure routes.
   Used by: Hoofdstuk 2 layer tabs (each tab shows violations for that layer, with count).
3. **Voorstel-generator.** Given a scenario (a delta to the SKU set), produces a new proposed layout + the wall-clock time it took to compute. Used by: Hoofdstuk 4 scenario carousel; the existing reslot-toaster.

**Fixture dataset:**

- One fictional DC, ~2.000 slots, plausible distribution of categorieën, gewichten, pick-frequenties.
- Deliberate seeded violations (a handful of each rule-type) so Hoofdstuk 2 has real content.
- Loaded at app start from a static JSON file. Not committed as real Action data — documented as demo fixture in the file header.

**Python engine boundary.**

The voorstel-generator exposes an interface that matches the shape of what `slotting/engine/` would return. Client-side TS provides the demo implementation. A later PR can swap the implementation for an API call to the Python engine without touching UI code.

## Presentation Mode — the five chapters

Presentation Mode is entered via a toggle in the topbar and shows: a minimal chrome, chapter progress indicator, forward/backward navigation, and an exit control. Sandbox mode is the default; Presentation Mode is opt-in.

Total duration: ~4:45, within the 5-minute target for a directie pitch.

### Hoofdstuk 1 — Het probleem (~45s)

**Scene:** opens on *Marco* — a single picker with name, avatar, his route traced over the current warehouse map, his time and meters for the rondje he just completed. After ~8-10 seconds, camera pulls out to show ~40 concurrent pickers; their routes fill the map as light trails, forming a spaghetti cloud. A euro-counter runs from Marco's single rondje up to the shift-total for the DC.

**Closing line:** *"Marco is niet traag. Het magazijn is traag."*

**Data source:** all numbers (meters, time, euro-total) are computed by the meters-module from the fixture grid. The euro-counter uses a documented cost-per-meter constant.

**Status:** new scene; leverages existing warehouse-map rendering.

### Hoofdstuk 2 — Risico (~60s)

**Scene:** three tab-layers along the top: **Veiligheid/compliance**, **Ergonomie/arbo**, **Continuïteit**. Presenter clicks through them manually (no auto-play). Each tab re-colors the warehouse map with that layer's overlay and shows a counter *"X overtredingen nu actief"*, where X is the real count from the rule-checker against the fixture grid.

**Data source:** rule-checker output, one module-call per layer.

**Status:** new scene; reuses existing warehouse-map component; requires the three rule-sets to be implemented in the rule-checker.

### Hoofdstuk 3 — Mensen (~60s)

**Scene:** three domino blocks, left to right, each triggering the next with a visible animation:

1. **Meters per pick** — from the meters-module (current vs. voorgestelde layout).
2. **Meters per shift per DC** — block 1 × pick-volume.
3. **Uren-equivalent per shift per DC** — block 2 ÷ loopsnelheid constant.

**Closing line (neutraal, no role attribution):** *"Deze uren komen vrij. Wat jullie ermee doen is jullie beslissing."*

**No fourth block. No retention/verloop/nachtshift framing.** The chain stops at the last defensible arithmetic node.

**Data source:** meters-module.

**Status:** new scene.

### Hoofdstuk 4 — Tempo (~90s)

**Scene:** one scenario is played out in full — **"Leverancier valt weg — 40 SKU's vervangen door alternatieven"**. The warehouse map morphs visibly into the new proposed layout. Framing of the result is *"Voorstel"* — never "AI", never "the AI proposes". The on-screen label for the result block is simply "Voorstel" with a timer showing how long the computation took.

**Three warm tabs** above the main scene show the other scenarios: *Nieuwe seizoenscollectie*, *Phase-out*, *Lijn-uitbreiding*. Each tab shows its name and its time-to-voorstel. Clicking a warm tab switches the main scene to that scenario — usable mid-demo if a directie question requires it, but not played by default.

**Data source:** voorstel-generator, one call per scenario. Scenario definitions (SKU deltas) are fixture data.

**Status:** new scene. The existing new-SKU-batch-wizard stays in the sandbox unchanged; Hoofdstuk 4 is a separate presentation-only component that calls the voorstel-generator directly.

### Hoofdstuk 5 — Conclusie (~30s)

**Scene:** a single static screen. No numbers. No CTA. No WMS logos. No pulsing indicator.

```
SIGNIFICANTE OPEX-REDUCTIE

Jullie magazijn is nooit meer
gisteren optimaal.

Altijd optimaal. Automatisch.
Werkt zelfstandig. Werkt met elke WMS.
```

The screen holds. The presenter is expected to let the line land in silence before moving to conversation.

**Status:** new static screen, no data source needed.

## AI-framing cleanup

A sweep of the existing user-facing surfaces to remove "AI / ML / neural / intelligent" language. The goal is that a directie viewer never sees the word "AI" while using the tool.

**Scope of the sweep:**

- Reslot-toaster — copy in tabs, labels, tooltips.
- Command Center — metric labels, alert copy, any references to "intelligence" or "ML".
- New-SKU-batch-wizard — step titles and body copy.
- Topbar / sidebar — navigation labels, any badges or taglines.
- Loading states, empty states, and error messages.

**Replacement vocabulary:**

| Old | New |
|---|---|
| "AI stelt voor" | "Voorstel" |
| "AI-gedreven" | (remove) or "geoptimaliseerd" |
| "machine learning" | (remove) |
| "neural" | (remove) |
| "slim algoritme" | "optimalisatie" |
| "intelligentie" | (remove) or specific metric name |

**Removed entirely:** Neural Network View at `frontend/src/app/neural/` — route, components, navigation entries, any assets unique to it. Not renamed. Not repurposed.

**Out of scope:** docstrings in `slotting/engine/` (Python, not user-facing). Flagged for a later pass if they risk leaking into API responses.

## Build sequence

Five brokken, in this order. Each is intended to ship as a separable PR.

**Brok 1 — Grid-data foundation.**
New `frontend/src/lib/grid/` layer: fixture dataset, SKU-attribute model, meters-module, rule-checker, voorstel-generator, Python-engine interface boundary. Existing components not yet wired. Unit tests for the three modules. Ends with: testable, correct computations.

**Brok 2 — AI cleanup + Neural View removal.**
Delete the Neural View route and components. Sweep user-facing copy per the replacement table above. No visual rework. Done early so all subsequent work lands in the cleaned world.

**Brok 3 — Wire existing components to the grid.**
Warehouse-map, reslot-toaster, Command Center, and current dashboards pull numbers from the grid-data layer instead of mocks. No new UI. Ends with: the existing sandbox shows computed numbers, and any bug fixed here is fixed for Presentation Mode too.

**Brok 4 — Presentation Mode shell.**
Topbar toggle, route guard, chapter navigation (forward/back + progress bar), chrome-stripping for presentation context, exit control. Chapters are empty placeholder components. Ends with: you can click through 5 empty slides with clear structure.

**Brok 5 — Fill the chapters, one PR each, in order 1 → 5.**
Hoofdstuk 1 (Marco + zoom-out + counter), 2 (risk-layer tabs), 3 (domino), 4 (scenario + warm tabs), 5 (closing screen). Each reviewable independently.

**Why this order:** foundation first so everything shares one source of truth; cleanup early to avoid touching copy twice; existing-UI wiring before new UI to prove the foundation on known ground; shell before chapters so chapter work stays focused on content.

## Success criteria

- All in-demo numbers are traceable to a grid-module call (no hardcoded display values in presentation components).
- Zero occurrences of "AI", "ML", "neural", "intelligent" in user-facing copy — verified by grep.
- Neural Network View removed; `frontend/src/app/neural/` does not exist; no navigation entry points to it.
- Presentation Mode runs end-to-end from topbar toggle to closing screen in ~4:45 without manual intervention beyond chapter navigation clicks.
- Sandbox mode still works; no regression in existing components after they're wired to the grid.
- Fixture dataset header clearly labels the data as demo fixture, not real Action data.

## Open items

- **Scenario content beyond fixture** — the fixture dataset and scenario definitions need plausible category/weight distributions. A later pass may refine the fixture based on any real-world slotting heuristics the user wants reflected.
- **Python engine swap** — the interface boundary is designed for a future PR; the PR itself is out of scope for this spec.
- **Sandbox topbar layout** — adding a "Presentation Mode" toggle may or may not require rearranging the topbar; this is a small UX call during Brok 4 rather than a spec-level decision.
