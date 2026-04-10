# Action Warehouse Slotting Module — Design Specification

**Datum:** 2026-04-10
**Status:** Approved
**Klant:** Action (26 warehouses, discount retail)

---

## 1. Project Overzicht

### Doel
Een AI-gedreven slottingmodule voor warehouse pick-optimalisatie, gericht op **opex-optimalisatie en opex-reductie**. De module moet schaalbaar zijn naar alle 26 Action warehouses.

### Scope
Het volledige pick-optimalisatieverhaal:
- SKU-to-location assignment (slotting)
- Pick-route optimalisatie
- Order batchvorming
- Zone-indeling en balancering

### Warehouse Type
- **Primair:** Man-to-goods — orderpickers lopen met kar/pallet door het magazijn
- **Secundair:** Hybride setups (man-to-goods + geautomatiseerde zones)

### Tech Stack
- **Frontend:** React / Next.js / React Three Fiber (Three.js)
- **Backend:** Python (FastAPI)
- **Wetenschappelijke libraries:** scipy, networkx, OR-Tools
- **AI:** Hybride ML (forecasting, clustering) + OR (optimalisatie, routing)

### Demo Focus
AAA-grade visuele wow-factor die concrete opex-reductie zichtbaar maakt — before/after simulaties, geanimeerde pick-routes, euro-besparingen.

---

## 2. Aanpak — Iteratieve Spiraal

Research en bouw in afwisselende sprints die elkaar versterken. Elk sub-project krijgt een eigen spec → plan → implementatie cyclus.

### Sprint 1 — Fundament
- **Research:** Slotting taxonomie, warehouse-modelering, TSP-varianten, pick-path theorie
- **Build:** Obsidian vault structuur, Python data-model, synthetische data generator, warehouse grid-model
- **Deliverable:** Werkende data-laag met realistische Action-achtige data en gevulde kennisbasis

### Sprint 2 — Optimalisatie-Engine
- **Research:** ML demand forecasting, SKU-correlatie-analyse, zone-optimalisatie, order batching algoritmes
- **Build:** ML pipeline (demand prediction, affinity clustering), OR-solver (slotting optimizer, pick-route planner), API-laag
- **Deliverable:** Engine die een warehouse kan herslotten met meetbare verbetering

### Sprint 3 — AAA Frontend
- **Research:** Warehouse visualisatie best practices, opex-dashboard design
- **Build:** Next.js applicatie met interactieve warehouse map, before/after simulatie, opex dashboard met KPI's
- **Deliverable:** De wow-factor demo die Action overtuigt

### Sprint 4 — Propositie & Polish
- **Build:** HTML-presentatie vanuit Obsidian vault, productdocumentatie, data-import pipeline voor echte Action-data, eindpolijsting
- **Deliverable:** Compleet pakket — demo + presentatie + documentatie

---

## 3. Systeemarchitectuur

### Laag 1 — Data Layer (Python)

**Warehouse Model:**
- Grid-gebaseerde representatie van het magazijn — gangpaden, stellingen, locaties, zones
- Zones: picking zone, bulk zone, forward pick area
- Configureerbaar voor verschillende warehouse layouts

**SKU Master:**
- Productdata met afmetingen, gewicht, categorie, omloopsnelheid
- Attributen: breekbaarheid, houdbaarheidsdatum, minimale/maximale voorraad

**Order History Engine:**
- Synthetische ordergenerator die Action-patronen nabootst
- Hoge frequentie klein/goedkoop, seizoenspieken, correlaties tussen productcategorieën

**Data Import Interface:**
- Gestandaardiseerde import voor echte Action-data
- Formaten: CSV, Excel, API
- Validatie en mapping-laag

### Laag 2 — Intelligence Layer (Python)

**ML Motor:**
- Demand forecasting: tijdreeks per SKU — seizoen, trend, promotie-effecten
- SKU-affiniteitsanalyse: co-occurrence matrices, welke producten worden samen besteld
- Velocity clustering: dynamische ABC+ classificatie op basis van voorspelde vraag (niet historische)

**OR Motor:**
- Slotting optimizer: toewijzing SKU → locatie, geoptimaliseerd voor minimale pick-afstand gewogen naar verwachte orderfrequentie
- Pick-route solver: TSP-variant per order/batch — heuristieken (S-shape, largest gap) en exact solving voor kleine orders
- Batch optimizer: orders groeperen om pick-efficiëntie te maximaliseren
- Zone balancer: werklastverdeling over zones, rekening houdend met hybride setups

### Laag 3 — API Layer (Python/FastAPI)
- REST API die de Intelligence Layer ontsluit
- Endpoints: run optimization, get current slotting, simulate scenario, compare before/after
- WebSocket voor real-time voortgang bij optimalisatie-runs

### Laag 4 — Presentation Layer (Next.js/React)
- **3D Warehouse View (React Three Fiber / Three.js):**
  - Isometrische 3D view als hero visual — stellingen met alle hoogte-niveaus zichtbaar
  - Vrije camera: draaien, zoomen, fly-through langs pick-routes
  - Kleurgecodeerde stellingen (velocity, zone, categorie)
  - Geanimeerde pick-route visualisatie in 3D
- **2D Top-Down View (toggle):**
  - Analytische modus voor heatmaps, zone-indelingen, route-overlays
  - Drag-and-drop voor handmatige overrides
  - Scenario vergelijking side-by-side
- **Dual-view filosofie:** 3D voor de wow en presentatie, 2D voor analyse en interactie
- Simulatie Engine: before/after visualisatie met geanimeerde pick-routes (beide views)
- Opex Dashboard: KPI's, trendgrafieken, FTE impact calculator, ROI projectie
- Scenario Vergelijker: meerdere optimalisatie-scenario's draaien en vergelijken

### Dataflow

```
Order History → ML Motor → Demand Forecast + SKU Affiniteiten
                              ↓
Warehouse Layout + SKU Data → OR Motor → Optimale Slotting + Pick Routes
                              ↓
                         API Layer
                              ↓
              Frontend: Warehouse Map + Dashboards + Simulaties
```

---

## 4. Synthetische Data — Action Profiel

### Warehouse Dimensies
- Layout: rechthoekig grid, ~15-20 gangpaden, 4-6 niveaus hoogte per stelling
- Zones: forward pick area (snellopers), bulk storage (reserve), seizoensartikel-zone
- Locaties: ~5.000-10.000 picklocaties per warehouse (schaalbaar)
- Depot punt: centraal of aan de voorzijde — startpunt voor pick-routes

### SKU Profiel
- ~8.000-12.000 actieve SKU's per warehouse
- Categorieën: huishoudelijk, beauty, speelgoed, food/snacks, tuin/seizoen, kleding accessoires, kantoor, dier, decoratie
- Verdeling: sterke Pareto — ~20% SKU's verantwoordelijk voor ~80% picks
- Seizoensgebonden: tuin/BBQ piekt lente/zomer, decoratie/speelgoed piekt Q4
- Kenmerken per SKU: afmeting (S/M/L), gewicht, breekbaarheid, houdbaarheidsdatum, min/max voorraad

### Orderpatronen
- Orders per dag: ~2.000-5.000 (winkelbevoorrading, geen e-commerce)
- Lines per order: 15-40 orderregels (winkelorders zijn relatief groot)
- Correlaties: seizoensgebonden clusters, categorie-affiniteiten
- Pieken: maandag/dinsdag (na weekendverkoop), seizoenswisselingen, feestdagen

### Data Generator
- Genereer consistent warehouse + SKU + orderhistorie datasets
- Configureerbaar: warehouse grootte, SKU mix, seizoen, piekfactoren
- Seed-gebaseerd voor reproduceerbaarheid
- Export naar formaat dat ook echte Action-data kan aannemen

---

## 5. Wetenschappelijke Basis — Research Agenda

### Sprint 1 — Fundamenten

| Onderwerp | Zoekrichting | Output |
|-----------|-------------|--------|
| Slotting Problem taxonomie | Classificatie van slotting-varianten (dedicated vs. shared storage, class-based vs. full turnover) | Overzichtsnote met voor/nadelen per variant |
| Warehouse layout modellering | Modellering gangpaden, cross-aisles, depot-punten als graaf | Algoritme-note + referentie-implementatie |
| Traveling Salesman Problem | TSP en varianten (Steiner TSP, TSP met precedence constraints) | Paper-samenvattingen + complexiteitsanalyse |
| Pick-route heuristieken | S-shape, return, midpoint, largest gap, combined | Benchmark-vergelijking met bronnen |
| Afstandsmetrieken | Rectilinear (Manhattan) vs. Chebyshev vs. graaf-gebaseerd | Implementatie-note |

### Sprint 2 — Intelligence

| Onderwerp | Zoekrichting | Output |
|-----------|-------------|--------|
| Demand forecasting | Tijdreeksmodellen (Prophet, LSTM, XGBoost) voor SKU-level | Model-vergelijking |
| SKU-affiniteitsanalyse | Association rule mining (Apriori, FP-Growth), co-occurrence | Algoritme-note + toepasbaarheid |
| Correlated slotting | Plaatsing gecorreleerde items dichtbij elkaar | Key findings + strategie |
| Order batching | Seed-based, time-window, proximity-based strategieën | Vergelijking met impact |
| Metaheuristieken | Genetic algorithms, simulated annealing, tabu search | Benchmark-resultaten |

### Sprint 3 — Visualisatie & UX

| Onderwerp | Zoekrichting | Output |
|-----------|-------------|--------|
| Warehouse visualisatie | Best practices 3D warehouse rendering (Three.js/R3F), 2D analytische views, heatmaps, route-animatie | Design patterns note |
| Opex KPI's | KPI's die warehouse managers overtuigen | KPI-framework note |

### Bronnen
- Google Scholar voor peer-reviewed papers
- OR-Tools / scipy documentatie
- Open-source warehouse simulators als benchmark

### Standaard Note Format
Elke paper/bron krijgt: **samenvatting, key findings, relevantie voor project, implementatie-implicaties**.

---

## 6. Demo Experience — De Wow-Factor

### Startscherm
- Warehouse Selector: kies een gesimuleerd warehouse (of later: echt Action warehouse)
- Status overview: huidige slotting score, laatste optimalisatie-run, verbeterpotentieel

### Flow 1 — "Analyseer mijn warehouse"
1. 3D warehouse view laadt als hero visual — stellingen met kleurgecodeerde SKU's op alle niveaus (rood=snelloper, blauw=langzaamloper)
2. Fly-through camera laat automatisch de probleemgebieden zien
3. Toggle naar 2D voor heatmap overlay met hotspots (overbelaste gangpaden, inefficiënte plaatsingen)
4. Automatische detectie van problemen: "SKU X is een A-product maar staat achteraan in gangpad 14, niveau 5"

### Flow 2 — "Optimaliseer"
1. Klik "Run Optimization" — progressbar toont de engine aan het werk
2. Resultaat: nieuw slotting-voorstel op de warehouse map (side-by-side of toggle old/new)
3. **De killer visual:** geanimeerde 3D pick-route vergelijking — een virtuele picker loopt dezelfde order met oude vs. nieuwe slotting. De route wordt visueel korter, de tijdsbalk krimpt. Camera volgt de picker door de gangpaden.
4. Samenvatting: "Gemiddelde loopafstand -32%, picks/uur +28%, geschatte jaarlijkse besparing: EUR X"

### Flow 3 — "What-if scenario's"
1. "Wat als we 2 gangpaden toevoegen?" → heroptimaliseer en vergelijk
2. "Wat als seizoenswisseling naar zomer?" → laad zomervoorspelling, herslot, toon impact
3. "Wat als we zone X automatiseren?" → hybride modus, toon verschuiving in workload

### Opex Dashboard
- **Real-time KPI's:** Loopafstand/order, picks/uur, orders/shift, kosten/order
- **Trend grafieken:** Verbetering over tijd na herslotting
- **FTE Impact Calculator:** "Bij X orders/dag bespaart deze slotting Y FTE → EUR Z/jaar"
- **ROI Projectie:** Terugverdientijd van de slottingmodule zelf

### Overtuigingskracht
- Concreet: echte (of echt-lijkende) productnamen, gangpadnummers, eurobedragen
- Beweging: 3D fly-throughs, geanimeerde picker-routes, real-time herberekening
- Aha-moment: 3D split-screen — links de oude route (lang, chaotisch), rechts de nieuwe (kort, efficiënt), dezelfde order, halve looptijd
- Hoogte-dimensie: snellopers op grijphoogte zichtbaar, langzaamlopers boven — direct herkenbaar voor warehouse managers

---

## 7. Obsidian Vault

### Doel
- AI-kennisbasis voor consistentie over sessies heen
- Bron voor HTML-presentatie en productdocumentatie
- Levende research-documentatie die meegroeit met het project

### Locatie
`vault/` in de project root

### Structuur
```
vault/
├── HOME.md                    # Startpagina met overzicht
├── research/
│   ├── papers/                # Wetenschappelijke papers en samenvattingen
│   ├── algorithms/            # Algoritme-documentatie en vergelijkingen
│   └── benchmarks/            # Benchmark resultaten
├── architecture/              # Systeemarchitectuur en technische ontwerpen
├── data-model/                # Datamodel, synthetische data specificaties
├── propositions/              # Propositiedocumenten richting Action
└── presentations/             # HTML presentatie bronmateriaal
```

---

## 8. Kennisbasis & Consistentie

### Obsidian als AI-geheugen
De vault functioneert als extern geheugen zodat:
- Research-bevindingen persistent zijn over conversaties heen
- Algoritme-keuzes gedocumenteerd en traceerbaar zijn
- Contradictie tussen eerdere en latere beslissingen wordt voorkomen
- Presentatie en documentatie direct uit de bron gegenereerd kunnen worden

### Data Pipeline Gereedheid
Het systeem wordt ontworpen met een abstractielaag voor data-input voor data-input:
- Synthetische data generator voor de demo-fase
- Gestandaardiseerde import-interface voor echte Action-data
- Validatie- en mapping-laag om dataformatverschillen op te vangen
