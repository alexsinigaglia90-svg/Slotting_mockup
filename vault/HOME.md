# Action Warehouse Slotting Module — Kennisbasis

## Project Overzicht
- **Klant:** Action (26 warehouses, discount retail)
- **Doel:** AI-gedreven slottingmodule voor opex-optimalisatie en opex-reductie
- **Scope:** SKU-to-location assignment, pick-route optimalisatie, batchvorming, zone-indeling
- **Warehouse type:** Primair man-to-goods, met ondersteuning voor hybride setups
- **Tech stack:** Next.js frontend + Python backend (scipy, networkx, OR-Tools, ML)
- **AI aanpak:** Hybride ML (forecasting, clustering) + OR (optimalisatie, routing)

## Vault Structuur

| Map | Inhoud |
|-----|--------|
| [[research/papers/]] | Wetenschappelijke papers en samenvattingen |
| [[research/algorithms/]] | Algoritme-documentatie en vergelijkingen |
| [[research/benchmarks/]] | Benchmark resultaten en vergelijkingsdata |
| [[architecture/]] | Systeemarchitectuur en technische ontwerpen |
| [[data-model/]] | Datamodel, synthetische data specificaties |
| [[propositions/]] | Propositiedocumenten richting Action |
| [[presentations/]] | HTML presentatie bronmateriaal |

## Sprint Planning
1. **Fundament** — Core research + datamodel + synthetische data generator
2. **Optimalisatie-Engine** — ML pipeline + OR-solver + API
3. **AAA Frontend** — Warehouse visualisatie + opex dashboards
4. **Propositie & Polish** — Presentatie + documentatie + data-import

## Beslissingen
- Iteratieve spiraal aanpak: research en bouw versterken elkaar per sprint
- Synthetische data eerst, ontwerp klaar voor echte Action-data later
- Obsidian vault dient als AI-kennisbasis, bron voor presentatie en productdocumentatie
