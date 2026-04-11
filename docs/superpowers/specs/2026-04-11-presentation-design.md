# SlotPilot Cinematic Presentation — Design Spec

**Datum:** 2026-04-11
**Type:** Scroll-driven cinematic HTML presentation
**Doelgroep:** Action operations management + C-level
**Doel:** Eerste kennismaking — "dit is wie wij zijn en wat wij kunnen"
**Toon:** Corporate, gepolijst, enterprise-grade
**Duur live:** 20-30 minuten presentatie, gevolgd door live demo
**Positionering:** CICT als platform + partner (D)

## Technisch
- Single HTML file: `presentation/index.html`
- Self-contained (inline CSS/JS, screenshots als base64 of relatieve paden)
- Scroll-driven: IntersectionObserver per sectie
- 12 full-screen secties (100vh elk)
- Screenshots van de tool in `presentation/assets/screenshots/`

## Visuele Stijl
- Afwisselend donker (#0a0b10) en wit (#ffffff) secties
- CICT geel (#E2D44A) accent
- SlotPilot purple (#8b6fff) tech accent
- Inter font (300/400/600/800)
- JetBrains Mono voor cijfers
- Scroll-triggered entrance animaties
- Parallax depth effecten
- Screenshots als floating cards met perspectief

## 12 Secties
1. Hero — CICT logo, SlotPilot titel
2. Het Probleem — loopafstand verspilling
3. De Kosten — EUR impact
4. Onze Aanpak — ML + OR
5. Het Platform — warehouse map screenshot
6. Live Intelligentie — command center
7. Herslotting in Actie — reslot voorstel
8. Het Brein — neural graph
9. De Resultaten — KPI tabel
10. Schaalbaarheid — 26 warehouses
11. Over CICT — bedrijfsprofiel
12. Next Step — CTA pilot

## Status
Approved — direct naar implementatie.
