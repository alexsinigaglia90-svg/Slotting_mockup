# SlotPilot Demo Roadmap — Naar een volwaardige clickable demo

## Wat we hebben

| Component | Status | Kwaliteit |
|-----------|--------|-----------|
| Warehouse Map (2D grid, zoom, pan) | ✅ Klaar | Goed |
| Live pick simulatie (flash, counter) | ✅ Klaar | Goed |
| Suboptimale detectie + alert | ✅ Klaar | Goed |
| Herslotting voorstel (tabs, charts, gauges) | ✅ Klaar | Goed |
| Hold-to-Slot bevestiging + confetti | ✅ Klaar | Goed |
| Nieuwe SKU batch wizard (4 stappen) | ✅ Klaar | Goed |
| Command Center (draggable) | ✅ Klaar | Goed |
| Detail toaster (tabs, funnel, gauges) | ✅ Klaar | Goed |
| Neural Graph (echte data, correlaties) | ✅ Klaar | Basis |
| Collapsible sidebar | ✅ Klaar | Goed |
| CICT branding + logo | ✅ Klaar | Goed |
| ML/OR metrics in alle teksten | ✅ Klaar | Goed |

## Wat ontbreekt voor een volwaardige demo

### Fase 1 — Core Flow Completering

**1.1 Dashboard/Overzicht pagina**
- KPI overview: picks vandaag, gemiddelde route-score, cluster coherentie, zone-balans
- Trend charts: picks/dag over 30 dagen, route-efficiëntie trend, seizoenspatronen
- Quick actions: "Start optimalisatie", "Bekijk problemen", "Import data"
- Warehouse health score (grote gauge centraal)
- Laatste herslottingen log

**1.2 Opex Impact pagina**
- FTE calculator met sliders (orders/dag, uurloon, shift-uren)
- Before/after picks/uur vergelijking
- ROI projectie chart (36 maanden)
- Jaarlijkse besparing per warehouse + x26 warehouses totaal
- Export naar PDF/Excel knop (mock)

**1.3 Verplaatsingen pagina**
- Historisch log van alle uitgevoerde herslottingen
- Per verplaatsing: datum, SKU, van→naar, reden, impact
- Filter op datum, cluster, status (uitgevoerd/gepland/geannuleerd)
- Totale impact overzicht

### Fase 2 — Intelligentie Verdieping

**2.1 Seizoens-simulatie**
- Toggle in topbar: "Simuleer seizoen" → dropdown (Lente, Zomer, Herfst, Winter)
- Bij seizoenswisseling: grid verandert van kleur, nieuwe SKU velocities worden berekend
- Automatische herslotting suggestie op basis van seizoenspatroon
- Visueel: producten "verhuizen" op de map (animated)

**2.2 Order-stroom visualisatie**
- Live simulatie van binnenkomende orders
- Per order: welke gangpaden bezocht, hoeveel loopmeters
- Heatmap die zich opbouwt over tijd — welke gangpaden worden overbezocht
- Route-visualisatie: lijn over de map die het pickpad toont

**2.3 Cluster management**
- Sidebar panel dat alle affinity clusters toont
- Per cluster: welke SKUs, hoe sterk de co-occurrence, waar op de map
- Drag & drop SKUs tussen clusters (handmatige override)
- ML suggestie: "Dit product hoort eigenlijk bij cluster X" met confidence score

**2.4 "Wat als" scenario's**
- "Wat als we gangpad A15 sluiten?"
- "Wat als we 500 nieuwe SKUs toevoegen?"
- "Wat als het volume 30% stijgt?"
- Elk scenario: herberekening, before/after vergelijking, impact

### Fase 3 — Polish & Presentatie

**3.1 Onboarding flow**
- Eerste keer openen: animated intro die de tool introduceert
- "Welcome to SlotPilot" met 3-staps uitleg
- Interactieve tutorial: "Klik hier om je eerste locatie te bekijken"

**3.2 Warehouse configurator**
- Instellen: aantal gangpaden, racks per gangpad, niveaus
- Depot positie kiezen
- Zone-indeling definiëren (forward pick, bulk, seizoen)
- Grid past zich real-time aan

**3.3 Data import demo**
- CSV upload interface (al gebouwd in backend)
- Visueel: producten "laden in" op de map na upload
- Validatie feedback: groene checks, rode warnings
- "12.847 producten geladen in 2.3 seconden"

**3.4 Multi-warehouse view**
- Overview pagina met 26 warehouse thumbnails
- Per warehouse: health score, laatste optimalisatie, status
- Klik → ga naar die warehouse map
- Vergelijk twee warehouses naast elkaar

**3.5 Presentatie modus**
- Full-screen modus zonder sidebar
- Grotere tekst, hogere contrast
- Auto-play: de demo loopt zichzelf door met timer
- "Presenteer aan klant" knop

### Fase 4 — Neural Graph Verdieping

**4.1 Interactieve correlatie-explorer**
- Klik op een node → alle verbindingen highlighten
- Slider: "Toon alleen correlaties boven X%"
- Filter per cluster, category, velocity class
- Zoekbalk: vind een specifiek product

**4.2 ML Reasoning panel**
- Naast de graph: panel dat uitlegt waarom bepaalde correlaties bestaan
- "Afwasmiddel en WC-Reiniger hebben 87% co-occurrence omdat ze in 4.200 van 5.000 orders samen voorkomen"
- Confidence intervals, p-waarden (mock maar realistisch)

**4.3 Temporal view**
- Tijdlijn slider: bekijk hoe correlaties veranderen over weken/maanden
- Seizoensgebonden verschuivingen worden zichtbaar
- Nieuwe correlaties die ontstaan lichten groen op, verdwijnende worden rood

## Prioritering voor demo

### Must-have (deze week)
1. Dashboard/Overzicht pagina
2. Opex Impact pagina met FTE calculator
3. Seizoens-simulatie toggle
4. Order-stroom heatmap op de map

### Should-have (volgende week)
5. Verplaatsingen log pagina
6. Neural graph interactieve explorer
7. Onboarding flow
8. Presentatie modus

### Nice-to-have (als er tijd is)
9. Multi-warehouse view
10. Warehouse configurator
11. Temporal neural view
12. Wat-als scenario's
