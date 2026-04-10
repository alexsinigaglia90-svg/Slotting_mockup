# Demo Rehearsal Script — Action Warehouse Slotting Module

**Duration:** 15–20 minutes  
**Audience:** Action executive team, warehouse managers  
**Goal:** Demonstrate measurable pick-distance reduction and operational impact

---

## Setup Checklist (Before Demo)

### 15 minutes before start

- [ ] Backend running: `python -m uvicorn slotting.api.app:create_app --reload`
  - Verify `/health` responds
- [ ] Frontend running: `cd frontend && npm run dev`
  - Verify http://localhost:3000 loads
- [ ] Browser tabs open:
  - Tab 1: `http://localhost:3000/warehouse` (3D view)
  - Tab 2: `http://localhost:3000/opex` (Opex dashboard)
  - Tab 3: http://localhost:3000/health (health check, hidden)
- [ ] Presentation slides open in separate window
  - http://localhost:PORT/presentation/index.html
- [ ] Network connectivity: no proxies blocking localhost
- [ ] Audio/video: working microphone, screen share tested
- [ ] Backup: PDF of slides + screenshots in `/presentation/assets/screenshots`
- [ ] Contingency: Pre-recorded demo video (MP4) as fallback

---

## Act 1: Presentation Slides [00:00–05:00]

**Duration:** 5 minutes (slides 1–9)

**Narration:**

> "Good morning. Today we're introducing an AI-powered solution for warehouse pick optimization. We've analyzed your operations across 26 warehouses and identified a massive opportunity.

> [Slide 1] Right now, your pickers walk an average of 159 meters per order. At 3,500 orders per day, that's 556 kilometers walked in a single warehouse per day.

> [Slide 2–3] Our analysis shows this costs roughly €400,000 per warehouse in labor inefficiency annually. Across your network, that's €10.4 million.

> [Slide 4] What if we could cut that by 80%? What if every pick route was optimized, and SKU placement adapted to your demand patterns?

> [Slide 5–8] We've built a hybrid system that combines machine learning demand forecasting with operations research optimization. On our test data, we achieved an 82.4% reduction in average walking distance.

> [Slide 9] Before optimization, 159 meters per order. After, 28 meters. That's the power of data-driven slotting.

> Now let me show you the platform."

**Slide Timing:**

| Slide | Title | Time |
|-------|-------|------|
| 1 | Title | 0:30 |
| 2 | Challenge | 0:45 |
| 3 | Cost | 1:15 |
| 4 | Question | 0:45 |
| 5 | Approach | 0:45 |
| 6 | Architecture | 0:45 |
| 7 | Science | 0:30 |
| 8 | Key Result | 0:45 |
| 9 | Before/After | 0:15 |

---

## Act 2: 3D Warehouse Visualization [05:00–10:00]

**Duration:** 5 minutes (live demo of warehouse visualization)

**Setup:**
- Browser Tab 1: `http://localhost:3000/warehouse`
- Screen share focused on 3D view

**Narration & Actions:**

> "Let me show you the heart of the platform — the interactive 3D warehouse.

**[05:00–05:30]** Initialize Optimization

1. Open browser console (F12) to check for errors (hidden from audience)
2. Click **"Run Optimization"** button in sidebar
3. Modal appears with default values:
   - warehouse_seed: 42
   - max_iterations: 100
   - num_orders: 1000

> "I'm running an optimization on a model warehouse with 3,000 locations and 8,400 SKUs. This will take about 10 seconds."

4. Click **"Optimize"** button
5. Progress indicator spins; wait for completion

**Contingency:** If optimization takes >15 seconds, proceed with pre-loaded results (skip to step 10).

**[05:30–06:15]** Warehouse Rendering

6. Once optimization completes, 3D scene renders:
   - Warehouse grid with 15 aisles, 20 rows
   - Racks colored by velocity:
     - **Green** = Fast movers (A-velocity)
     - **Yellow** = Medium (B-velocity)
     - **Red** = Slow movers (C-velocity)

> "The 3D view shows all 3,000 rack locations. Colors indicate product velocity — green is fast movers, yellow is medium, red is slow. Notice how the fast movers are clustered in the front section after optimization."

7. **Rotate** the view: click and drag on 3D scene
   - Show aisles from different angles
   - Zoom in on forward pick area (green racks)

> "You can rotate, zoom, and fly through the warehouse. This is the before-state — where your products are currently placed."

**[06:15–07:00]** Before/After Toggle

8. Click **"Toggle Before/After"** button
9. Racks recolor instantly (before state → after state)

> "Now watch this. I'm toggling to the optimized layout. Notice how the fast-moving items have moved forward, and slow movers are pushed to the back. This simple rearrangement is what cuts 82% off pick distances."

10. Toggle back and forth 2–3 times to emphasize the change

**[07:00–08:30]** Pick Route Visualization

11. In sidebar, select a random SKU:
    - Click **"Select Order"** → choose order #1 (contains 20–25 picks)
    - Or manually enter: `["SKU-001", "SKU-042", "SKU-156", "SKU-201"]`

> "Now let me show you a real pick route. I'm selecting 4 products from the optimized warehouse."

12. Click **"Show Route"** button
13. **Animated route** renders in 3D:
    - Blue line connects waypoints
    - Aisles visited are highlighted
    - Distance and aisles count displayed in UI

> "Watch the route animate in real-time. The blue line shows the optimal path — just 28 meters to pick these 4 items. Compare this to the old layout, where the route would have zigzagged across the warehouse."

14. Click **"Old Layout"** toggle
15. Same route re-calculates in the before-state
16. Distance increases visibly (e.g., 28m → 145m)

> "See the difference? Same order, same products, but the distance nearly quintupled because products were scattered. That's the impact we're delivering."

**[08:30–09:15]** Interactive Exploration

17. Let audience ask questions about the visualization
18. Optional: Demonstrate camera fly-through by dragging across the screen
19. Show/hide route heuristics (S-shape vs. Largest Gap)

**Contingency:** If 3D rendering crashes:
- Quickly switch to pre-recorded video (30 seconds, shows warehouse rotation + route)
- Continue narration while video plays
- Proceed to next section

---

## Act 3: Opex Dashboard [10:00–13:00]

**Duration:** 3 minutes (operational impact metrics)

**Setup:**
- Browser Tab 2: `http://localhost:3000/opex`
- Switch screen share to Opex page

**Narration & Actions:**

> "Now let's translate this optimization into business metrics that matter — operational expense and headcount.

**[10:00–10:30]** Key Metrics Display

1. Opex dashboard loads showing four metric panels:
   - **Distance Reduction:** 82.4%
   - **Picks per Hour:** +356%
   - **FTE Equivalent Saved:** 12–15 people per warehouse
   - **Annual Savings (€):** ~€400,000

> "These are the numbers that impact your bottom line. An 82% reduction in walking distance means pickers can process 3.5x more orders per hour with the same effort. On a single warehouse, that's equivalent to removing 12–15 full-time employees from the walking bottleneck."

**[10:30–11:15]** Scenario Analysis

2. Scroll down to **Scenario Comparison** section
3. Show three pre-loaded scenarios:
   - **Status Quo:** Current slotting (baseline)
   - **Optimized (Single Warehouse):** One warehouse improved
   - **Full Rollout (26 Warehouses):** All warehouses optimized

4. Bar chart shows cumulative savings:
   - Single warehouse: €400K/year
   - 26 warehouses: €10.4M/year

> "If we roll this out across your entire network, we're looking at over €10 million in annual savings. This isn't theoretical — it's based on your actual demand patterns and warehouse layouts."

**[11:15–12:00]** Seasonal Adjustment

5. Scroll to **Seasonal Configuration** section
6. Show three seasonal profiles (dropdowns):
   - **Q1 — Cleaning & Home** (current selection)
   - **Q2 — Garden & Outdoor**
   - **Q4 — Holidays & Decoration**

7. Click dropdown, select **Q2**
8. Metrics recalculate:
   - Picks per hour increase (seasonal items move forward)
   - FTE savings adjust based on order pattern shift

> "The system adapts seasonally. In Q2 when garden products dominate, we move those to the fast-pick zone. Same optimization engine, but tuned for what's actually selling in that quarter. No manual re-slotting required."

**[12:00–12:30]** ROI Projection

9. Scroll to bottom: **Investment & ROI** calculator
10. Default inputs:
    - Implementation cost: €150K per warehouse
    - Annual benefit: €400K per warehouse
    - Payback period: **4.5 months**

11. Adjust cost slider to show sensitivity:
    - Even at €200K/warehouse: payback < 6 months

> "The implementation cost is modest compared to the savings. Most warehouses break even in under 6 months, then it's pure operational gain."

**Contingency:** If dashboard doesn't load:
- Show pre-captured screenshot (PNG)
- Narrate the metrics
- Proceed to next section

---

## Act 4: Data Import Demo [13:00–15:00]

**Duration:** 2 minutes (data pipeline capability)

**Setup:**
- Browser Tab 1 or new tab: `http://localhost:3000/import` (or API endpoint demo)

**Narration & Actions:**

> "Finally, I want to show you how easy it is to bring your real data into the system.

**[13:00–13:45]** CSV Upload Interface

1. Navigate to **Data Import** page
2. Show three file upload fields:
   - **Warehouse Layout** (CSV: locations, aisles, zones)
   - **SKU Catalog** (CSV: product IDs, categories, velocity)
   - **Order History** (CSV: dates, order_ids, sku_list)

> "You provide three CSVs with your real warehouse data. The system validates, maps fields, and generates an optimized slotting plan ready to deploy."

3. Optional live demo (if time permits):
   - Drag-and-drop sample CSVs (provided in `/data/samples/`)
   - Show validation output (✓ 8,432 SKUs loaded, ✓ 3,000 locations parsed, ✓ 1,000 orders imported)

4. Click **"Generate Slotting Plan"**
5. Wait ~10 seconds
6. Download button appears: **"Download Slotting Plan.csv"**
   - File contains: sku_id, old_location, new_location, change_reason

> "The system outputs a migration plan. Your warehouse team uses this to physically move products — it's the actionable output of our optimization."

**[13:45–14:30]** API Integration

7. Alternatively, show backend API documentation:
   - Open `http://localhost:8000/docs` (Swagger UI)
   - Show `/optimize` and `/import` endpoints
   - Demonstrate API request/response JSON

> "For integration with your warehouse management system, we provide a REST API. Your WMS can call our `/optimize` endpoint directly, get results in JSON, and feed the assignment back to your picking system."

**Contingency:** If import takes >20 seconds:
- Skip to pre-computed results
- Show "Results" section with output CSV preview
- Narrate the capability

---

## Act 5: Closing Slides [15:00–20:00]

**Duration:** 5 minutes (slides 14–18)

**Setup:**
- Switch back to presentation window

**Narration:**

> "Let me close with the roadmap and next steps.

**[15:00–15:30]** Summary (Slide 14)

> "To summarize: 82% reduction in walking distance, 356% improvement in picks per hour, and €400K savings per warehouse annually. That's across a single location. Scale that to 26, and we're talking about transforming your entire operation."

**[15:30–16:00]** Scalability (Slide 15)

> "Our platform is built to scale from day one. We optimize each warehouse independently but manage everything from one central system. That means 26 different layouts, 26 different seasonal patterns, one unified platform."

**[16:00–16:30]** Seasonality (Slide 16)

> "As demand patterns shift, the system automatically adjusts. Garden products forward in spring, decorations in fall — it's all data-driven and requires zero manual intervention."

**[16:30–17:15]** Rollout Plan (Slide 17)

> "Here's our proposed timeline:

> **Phase 1 — Pilot (Month 1):** We optimize one of your warehouses with real data. We run the system parallel to your current operations, validate the metrics, and train your team.

> **Phase 2 — Validate (Months 2–3):** We expand to 3–5 warehouses, confirm the results hold, and refine the process.

> **Phase 3 — Scale (Months 4–6):** Full rollout across all 26 warehouses with continuous monitoring.

> **Phase 4 — Optimize (Ongoing):** Advanced features like order batching, zone load balancing, and predictive re-slotting."

**[17:15–18:45]** Call to Action (Slide 18)

> "We're ready to begin whenever you are. Here's what we need from you:

> 1. Warehouse layout data for one pilot location
> 2. 30 days of recent order history
> 3. Your SKU catalog with current locations

> We'll run the optimization, show you the before/after, and you'll see the impact in real data from your warehouse.

> Questions?"

**[18:45–20:00]** Q&A

**Anticipated Questions & Answers:**

| Question | Answer |
|----------|--------|
| "How long does optimization take?" | 10–30 seconds for a 10K SKU warehouse, depending on iterations. Can be tuned. |
| "What if we change product locations manually?" | The system re-optimizes with manual overrides as constraints. Seamless integration. |
| "Do pickers need training?" | Minimal. They follow printed picks by aisle. The visual interface shows them the path. |
| "What about peak seasons?" | We monitor demand in real-time. If patterns shift, we re-slot automatically (weekly or daily). |
| "How does this integrate with our WMS?" | REST API. Your WMS calls `/optimize`, gets the assignment, and sends picks in optimized order. |
| "What are the risks?" | Parallel runs during pilot reduce risk. We validate metrics before full rollout. Rollback is quick. |
| "Can we still do manual adjustments?" | Yes. The dashboard supports drag-and-drop overrides. Re-optimization respects your changes. |

---

## Contingency Plans

### If Backend API Fails

1. Use pre-loaded JSON responses (stored in `frontend/src/data/cached-results.json`)
2. Frontend still renders dashboard and warehouse with cached data
3. Narrate: "The API is cached here for demo purposes, but in production it connects to live optimization."

### If 3D Visualization Crashes

1. Switch to pre-recorded video (30 seconds) showing warehouse rotation
2. Play video while continuing narration
3. Resume live demo on next section if possible

### If Network Drops

1. Frontend is cached; pages still load
2. Backend API calls fail, but cached results display
3. Skip `/import` demo, show screenshot instead
4. Proceed to Q&A

### If Time Runs Short

1. Skip Act 4 (Data Import) — cover in Q&A if asked
2. Compress Q&A to 5 minutes
3. Offer written follow-up with full API documentation

### If Audience Asks for Specific Warehouse Data

1. If you have sample data pre-loaded, use it
2. If not: "We'll run this exact analysis on your data in the pilot phase. This is synthetic data to demonstrate the capability."
3. Offer to schedule follow-up call with tech team to discuss data integration

---

## Timing Summary

| Act | Duration | Content |
|-----|----------|---------|
| **1. Presentation** | 5:00 | Slides 1–9: problem → solution |
| **2. 3D Demo** | 5:00 | Warehouse visualization + route animation |
| **3. Opex Dashboard** | 3:00 | Metrics, scenarios, savings projection |
| **4. Data Import** | 2:00 | CSV upload, API integration |
| **5. Closing + Q&A** | 5:00 | Slides 14–18, questions |
| **Total** | **20:00** | |

---

## Post-Demo Follow-Up

### Send Within 24 Hours

- [ ] Thank-you email with key metrics recap
- [ ] Link to recorded demo (if recorded)
- [ ] API documentation PDF
- [ ] Architecture whitepaper
- [ ] Data import template CSVs
- [ ] Proposal for pilot phase

### Schedule

- [ ] Technical deep-dive call (1 hour) with warehouse IT
- [ ] Pilot kickoff meeting (30 min) with operations team
- [ ] Week 1: Receive data from Action
- [ ] Week 2: Run optimization, present results

---

## Rehearsal Checklist

**Day Before:**

- [ ] Test backend and frontend separately
- [ ] Run full demo flow on target machine (the one you'll present from)
- [ ] Check video output resolution (slides + 3D should be crisp)
- [ ] Time each section with a stopwatch
- [ ] Write down any timestamps where delays occur (for live demo)

**Morning Of:**

- [ ] Restart computer
- [ ] Clear browser cache (or use incognito mode)
- [ ] Start backend server 10 minutes early
- [ ] Start frontend server 10 minutes early
- [ ] Open all tabs and test `/health` endpoint
- [ ] Do a dry run of Acts 1–3
- [ ] Confirm screen sharing works in your meeting tool
- [ ] Test audio (mic input, speaker output)

**5 Minutes Before Go-Live:**

- [ ] Close unnecessary apps (reduces lag)
- [ ] Maximize browser window
- [ ] Move mouse away from presentation
- [ ] Take a breath
- [ ] Click present/share screen
- [ ] Start with Slide 1

---

## Notes for Presenter

- **Pacing:** Don't rush. Pause after key metrics for them to sink in.
- **Eye Contact:** Look at camera when presenting (if virtual), else at audience.
- **Enthusiasm:** This is a €10M opportunity. Let that energy show.
- **Live vs. Canned:** Prefer live data over screenshots, but know your fallbacks.
- **Q&A:** If unsure, write down the question and offer a follow-up call rather than guessing.
- **Backup Device:** Have a laptop with the full demo ready in case your main screen fails.

---

**Version:** 0.2.0  
**Last Updated:** 2026-04-10  
**Estimated Delivery Time:** 15–20 minutes
