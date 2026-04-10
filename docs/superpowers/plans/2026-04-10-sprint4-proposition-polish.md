# Sprint 4: Propositie & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the complete Action Warehouse Slotting Module for delivery — a data import pipeline for real Action data, a self-contained HTML presentation that tells the proposition story, product documentation, and a demo rehearsal script. This sprint adds no new features; it wraps everything into a professional, deliverable package ready for the Action pitch.

**Architecture:** New `slotting/io/importer.py` module with CSV reader, validation, and mapping into existing domain models. New `POST /import` API endpoint. A standalone `presentation/index.html` using reveal.js (CDN). Documentation in `docs/`. The vault HOME gets its final Sprint 4 update.

**Tech Stack:** Python 3.12+, pytest, pandas (CSV/Excel parsing), FastAPI, reveal.js 5.x (CDN), Markdown

---

## File Structure

```
slotting/
├── io/
│   ├── importer.py               # CSV/Excel reader, validator, column mapper
│   └── export.py                 # (existing) JSON/CSV export
├── api/
│   ├── routes.py                 # (extend) Add POST /import endpoint
│   └── schemas.py                # (extend) ImportRequest/ImportResponse schemas

tests/
├── test_importer.py              # Unit tests for importer (TDD)
├── test_import_api.py            # API integration tests for /import
├── fixtures/
│   ├── valid_import.csv          # Happy-path test fixture
│   ├── missing_columns.csv       # Missing required columns
│   ├── bad_types.csv             # Invalid data types
│   └── extra_columns.csv         # Extra columns (should be ignored)

presentation/
├── index.html                    # Self-contained reveal.js presentation (~18 slides)
└── assets/
    └── screenshots/              # Frontend screenshots for slides (PNG)

docs/
├── architecture.md               # System architecture overview
├── api-reference.md              # API endpoint reference
├── deployment.md                 # Deployment and configuration guide
└── demo-rehearsal.md             # Step-by-step demo script for Action pitch

vault/
└── HOME.md                       # (update) Final Sprint 4 deliverables section
```

---

## Task 1: Data Import Pipeline — CSV Reader, Validator, Mapper (TDD)

**Files:**
- Create: `slotting/io/importer.py`
- Create: `tests/test_importer.py`
- Create: `tests/fixtures/valid_import.csv`
- Create: `tests/fixtures/missing_columns.csv`
- Create: `tests/fixtures/bad_types.csv`
- Create: `tests/fixtures/extra_columns.csv`

Build a data import module that reads CSV files with real Action warehouse data and maps them into the existing domain models (`SKU`, `Location`). Use TDD: write the tests first, then implement.

- [ ] **Step 1: Create test fixtures**

Create four CSV test fixtures in `tests/fixtures/`:

`valid_import.csv` — 10 rows with all required columns:
```
sku_id,name,category,size,weight,location_id,aisle,position,level
SKU-001,Schoonmaakdoekjes,household,M,0.3,LOC-A01-R01-P01-L1,A01,1,1
...
```
Use Action-realistic product names (Dutch). Cover different categories, sizes, levels.

`missing_columns.csv` — missing `weight` and `level` columns.

`bad_types.csv` — valid columns but invalid data: negative weight, level=99, category not in enum, non-numeric weight.

`extra_columns.csv` — all required columns plus `supplier`, `barcode`, `price` (should be ignored gracefully).

- [ ] **Step 2: Write unit tests (TDD — tests first)**

Write `tests/test_importer.py` with these test cases:

```python
# Test the importer module — write these BEFORE implementation

class TestCSVReader:
    def test_read_valid_csv_returns_rows(self):
        """read_csv('valid_import.csv') returns list of dicts, one per row."""

    def test_read_csv_with_extra_columns_ignores_them(self):
        """Extra columns are dropped, required columns preserved."""

class TestValidator:
    def test_validate_valid_rows_returns_no_errors(self):
        """All rows in valid_import.csv pass validation."""

    def test_validate_missing_columns_raises(self):
        """Missing required columns raises ImportValidationError with column names."""

    def test_validate_bad_weight_returns_row_error(self):
        """Negative weight flagged as validation error with row number."""

    def test_validate_bad_category_returns_row_error(self):
        """Unknown category flagged with valid options listed."""

    def test_validate_bad_level_returns_row_error(self):
        """Level outside 1-6 range flagged."""

    def test_validate_returns_all_errors_not_just_first(self):
        """Validator collects all errors, does not stop at first."""

class TestMapper:
    def test_map_rows_to_skus(self):
        """Valid rows map to list[SKU] with correct field types."""

    def test_map_rows_to_locations(self):
        """Valid rows map to list[Location] with correct aisle_id, position, level."""

    def test_map_category_string_to_enum(self):
        """String 'household' maps to Category.HOUSEHOLD."""

    def test_map_size_string_to_enum(self):
        """String 'M' maps to SizeClass.MEDIUM."""

class TestImportPipeline:
    def test_import_csv_end_to_end(self):
        """import_csv(path) returns ImportResult with skus, locations, error_count=0."""

    def test_import_csv_with_errors_returns_partial_and_errors(self):
        """Bad rows are skipped, good rows imported, errors listed in result."""
```

Target: 14 tests.

- [ ] **Step 3: Implement importer module**

Create `slotting/io/importer.py` with:

```python
@dataclass
class ImportError:
    row: int
    column: str
    message: str

@dataclass
class ImportResult:
    skus: list[SKU]
    locations: list[Location]
    errors: list[ImportError]
    rows_imported: int
    rows_skipped: int

class ImportValidationError(Exception):
    """Raised when required columns are missing."""
    def __init__(self, missing_columns: list[str]): ...

def read_csv(path: Path) -> list[dict]:
    """Read CSV, return list of row dicts. Strips whitespace from headers."""

def validate_rows(rows: list[dict]) -> list[ImportError]:
    """Validate each row. Returns all errors (not just first)."""
    # Required columns: sku_id, name, category, size, weight, location_id, aisle, position, level
    # Validations: weight > 0, level in 1-6, category in Category enum, size in S/M/L

def map_to_models(rows: list[dict], errors: list[ImportError]) -> tuple[list[SKU], list[Location]]:
    """Map valid rows to SKU and Location domain objects. Skip rows with errors."""

def import_csv(path: Path) -> ImportResult:
    """Full pipeline: read -> validate -> map -> return result."""
```

Use `csv.DictReader` (stdlib) for CSV parsing. Do NOT add pandas as a dependency for this — keep it lightweight. Map `category` strings to `Category` enum (case-insensitive). Map `size` strings to `SizeClass` enum. Default `velocity_class` to `C` and `avg_daily_picks` to `0.0` for imported SKUs (these come from order history analysis, not the import file).

- [ ] **Step 4: Run tests, verify all 14 pass**

```bash
cd /c/Users/asini/Documents/GitHub/Slotting_mockup && python -m pytest tests/test_importer.py -v
```

**Acceptance criteria:**
- `import_csv(valid_file)` returns `ImportResult` with 10 SKUs, 10 locations, 0 errors
- Missing columns raise `ImportValidationError` listing the missing column names
- Bad data rows are skipped; errors include row number, column, and human-readable message
- Extra columns are silently ignored
- All 14 tests pass

---

## Task 2: API Endpoint for Data Import

**Files:**
- Modify: `slotting/api/schemas.py`
- Modify: `slotting/api/routes.py`
- Create: `tests/test_import_api.py`

Add a `POST /import` endpoint that accepts CSV file upload and returns import results.

- [ ] **Step 1: Add Pydantic schemas**

Add to `slotting/api/schemas.py`:

```python
class ImportErrorResponse(BaseModel):
    row: int
    column: str
    message: str

class ImportResponse(BaseModel):
    rows_imported: int
    rows_skipped: int
    errors: list[ImportErrorResponse]
    num_skus: int
    num_locations: int
    status: str  # "success" | "partial" | "failed"
```

- [ ] **Step 2: Add import route**

Add to `slotting/api/routes.py`:

```python
from fastapi import UploadFile, File
import tempfile

@router.post("/import", response_model=ImportResponse)
async def import_data(file: UploadFile = File(...)):
    """Import warehouse data from CSV file."""
    # Save upload to temp file
    # Call import_csv()
    # Store imported SKUs/locations in _state for use by /optimize
    # Return ImportResponse with status based on error count
```

Handle errors: return 400 if file is not CSV, return 422 if all rows fail validation. Set `status` to `"success"` (0 errors), `"partial"` (some errors), or `"failed"` (all errors).

- [ ] **Step 3: Write API integration tests**

Create `tests/test_import_api.py`:

```python
class TestImportAPI:
    def test_import_valid_csv_returns_200(self, client):
        """Upload valid CSV, get 200 with rows_imported > 0."""

    def test_import_invalid_csv_returns_partial(self, client):
        """Upload CSV with some bad rows, get 200 with status='partial'."""

    def test_import_empty_csv_returns_400(self, client):
        """Upload empty file, get 400."""

    def test_import_populates_state_for_optimize(self, client):
        """After import, /optimize can use imported data."""
```

- [ ] **Step 4: Update version to 1.0.0**

Update version string in `slotting/api/schemas.py` `HealthResponse` from `"0.2.0"` to `"1.0.0"`. Update version in `slotting/api/app.py` as well.

- [ ] **Step 5: Run all tests**

```bash
cd /c/Users/asini/Documents/GitHub/Slotting_mockup && python -m pytest tests/ -v
```

**Acceptance criteria:**
- `POST /import` with valid CSV returns 200, `status: "success"`, correct counts
- `POST /import` with mixed data returns 200, `status: "partial"`, errors listed
- Imported data is usable by subsequent `/optimize` calls
- All existing 87 tests still pass, plus 4 new API tests
- Version is 1.0.0 in /health response

---

## Task 3: HTML Presentation — Reveal.js Proposition Deck

**Files:**
- Create: `presentation/index.html`
- Create: `presentation/assets/screenshots/` (directory)

Build a self-contained HTML presentation using reveal.js (CDN-loaded) that tells the Action proposition story. The file must open directly in a browser with no server required.

- [ ] **Step 1: Create presentation directory and HTML skeleton**

Create `presentation/index.html` with reveal.js loaded from CDN:
```html
<!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <title>Action Warehouse Slotting — AI-Driven Pick Optimization</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/black.css">
    <!-- Custom styles inline for self-containment -->
</head>
```

Add custom CSS inline for Action-aligned styling: clean dark theme, Action brand colors as accents (#E3000F red, #FFFFFF white), large readable fonts, professional slide layouts.

- [ ] **Step 2: Write slide content (~18 slides)**

Structure the narrative arc:

**Act 1 — Problem (4 slides):**
1. Title slide: "AI-Driven Warehouse Slotting for Action" + subtitle
2. The challenge: 26 warehouses, manual slotting, suboptimal pick routes
3. The cost: walking distance waste, FTE inefficiency, EUR impact (use realistic estimates)
4. Current state visualization: screenshot of chaotic before-state from the 3D view

**Act 2 — Solution (5 slides):**
5. Our approach: ML demand forecasting + OR optimization + visual analytics
6. Architecture overview: data layer -> intelligence layer -> API -> frontend (clean diagram in CSS/SVG)
7. Science behind it: affinity clustering, velocity classification, route heuristics
8. The engine result: "82.4% reduction in average walking distance"
9. Screenshot of the 3D warehouse with optimized slotting

**Act 3 — Demo (4 slides):**
10. Live demo intro: "Let us show you" (transition slide)
11. 3D warehouse visualization: before/after split (screenshot)
12. Pick route comparison: animated route overlay (screenshot + description)
13. Opex dashboard: KPI cards, FTE calculator, ROI projection (screenshot)

**Act 4 — Results & Next Steps (5 slides):**
14. Measured results: distance reduction, picks/hour improvement, projected annual savings
15. Scalability: 26 warehouses, configurable layouts, seasonal adjustment
16. Data integration: CSV import pipeline ready for real Action data
17. Roadmap: real data pilot -> single warehouse -> roll-out
18. Call to action: "Ready for a pilot with real data?" + contact

- [ ] **Step 3: Add inline visualizations**

For slides without screenshots, create inline CSS/HTML visualizations:
- Before/after distance comparison bar chart (pure CSS bars)
- Architecture diagram (CSS flexbox/grid with boxes and arrows)
- KPI summary cards (styled divs)
- Timeline/roadmap (CSS timeline)

These must render without JavaScript dependencies beyond reveal.js itself.

- [ ] **Step 4: Add speaker notes**

Add `<aside class="notes">` to each slide with talking points for the presenter:
- Key messages to hit on each slide
- Transition phrases between slides
- Where to pause for questions
- Demo cues ("now switch to the live demo")

- [ ] **Step 5: Test presentation**

Open `presentation/index.html` in a browser. Verify:
- All slides render correctly with no broken assets
- Navigation works (arrows, space, overview mode with Esc)
- Speaker notes visible in speaker view (press S)
- Looks professional on 1920x1080 display

**Acceptance criteria:**
- Single HTML file, opens in any modern browser with no server
- 16-20 slides covering problem -> solution -> demo -> results -> next steps
- Action-aligned visual styling (dark theme, red accent)
- Speaker notes on every slide
- Inline CSS visualizations for data points (no external images required, screenshots optional)
- Reveal.js loaded from CDN (jsdelivr)

---

## Task 4: Product Documentation

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/api-reference.md`
- Create: `docs/deployment.md`

Write three documentation files covering the complete system.

- [ ] **Step 1: Architecture overview**

Write `docs/architecture.md` covering:

- System overview diagram (ASCII art or Mermaid — render in markdown)
- Layer descriptions: Data Layer, Intelligence Layer, API Layer, Presentation Layer
- Technology choices and rationale (Python, FastAPI, Next.js, R3F)
- Data flow: from raw data through ML/OR engine to frontend visualization
- Key design decisions: why graph-based warehouse model, why hybrid ML+OR, why synthetic-first approach
- Module dependency map: which modules consume which

Target: ~200-300 lines. Readable by a senior developer in 10 minutes.

- [ ] **Step 2: API reference**

Write `docs/api-reference.md` covering all endpoints:

```
## GET /health
Response: { status: "ok", version: "1.0.0" }

## POST /optimize
Request body: OptimizeRequest schema (document all fields with types, defaults, descriptions)
Response body: OptimizeResponse schema
Example curl command
Example response

## POST /pick-route
Request/response schemas
Example

## POST /import
Request: multipart/form-data with CSV file
Response: ImportResponse schema
CSV column specification (required columns, types, valid values)
Error handling behavior
Example curl with file upload
```

Include the full Pydantic schema definitions (copy from `schemas.py`). Add curl examples for every endpoint.

- [ ] **Step 3: Deployment guide**

Write `docs/deployment.md` covering:

- Prerequisites: Python 3.12+, Node.js 18+, npm
- Backend setup: `pip install -e .`, `uvicorn slotting.api.app:create_app --factory`
- Frontend setup: `cd frontend && npm install && npm run dev`
- Environment variables: `NEXT_PUBLIC_API_URL`
- Running tests: `pytest tests/ -v` (backend), frontend test commands
- Production considerations: CORS configuration, uvicorn workers, static export
- Configuration options: warehouse seeds, optimization parameters

Target: ~100-150 lines. A developer should be able to get the system running in 15 minutes.

**Acceptance criteria:**
- Architecture doc covers all 4 layers with data flow description
- API reference documents all 4 endpoints with request/response schemas and curl examples
- Deployment guide is sufficient to run the system from scratch
- No broken references to files or modules

---

## Task 5: Demo Rehearsal Script

**Files:**
- Create: `docs/demo-rehearsal.md`

Write a step-by-step demo script that guides a presenter through showing the system to Action.

- [ ] **Step 1: Write rehearsal script**

Structure as a timed script (~15-20 minutes total):

```markdown
# Demo Rehearsal Script — Action Warehouse Slotting

## Setup (before demo)
- Start backend: `uvicorn slotting.api.app:create_app --factory`
- Start frontend: `cd frontend && npm run dev`
- Open browser tabs: localhost:3000, presentation/index.html
- Verify /health returns ok

## Act 1: The Presentation (5 min)
- Open presentation/index.html
- Walk through slides 1-9 (problem + solution)
- Key message: "82.4% distance reduction proven in simulation"
- Pause at slide 10 for transition to live demo

## Act 2: Live Demo — Warehouse View (5 min)
- Switch to localhost:3000
- Step 2a: Show the 3D warehouse view — point out color coding (red = fast movers)
- Step 2b: Toggle to 2D view — show heatmap, identify problem areas
- Step 2c: Click "Run Optimization" — wait for result
- Step 2d: Show before/after comparison — narrate the distance reduction
- Step 2e: Show animated pick route — "same order, half the walking"
- Talking point: "This works with your real warehouse layout"

## Act 3: Live Demo — Opex Dashboard (3 min)
- Navigate to /opex
- Step 3a: Walk through KPI cards — distance/order, picks/hour
- Step 3b: FTE Calculator — input Action's actual numbers if known
- Step 3c: ROI projection — "pays for itself in X months"

## Act 4: Data Import Demo (2 min)
- Step 4a: Show sample CSV format (have file ready)
- Step 4b: Upload via API or mention frontend integration
- Step 4c: "We're ready to work with your real data"

## Act 5: Back to Presentation (3 min)
- Return to slides 14-18
- Results summary, roadmap, call to action
- "When can we schedule a pilot with one warehouse?"

## Contingency
- If API is slow: have pre-recorded screenshots ready
- If optimization takes long: reduce to 50 iterations
- If asked about real data: explain CSV import pipeline
- If asked about scale: "26 warehouses, configurable per location"
```

- [ ] **Step 2: Add timing markers and transition cues**

Add `[HH:MM]` timestamps for pacing. Mark explicit transition moments. Include fallback screenshots references for offline demo mode.

**Acceptance criteria:**
- Script covers a 15-20 minute demo flow
- Every step has a specific action and talking point
- Contingency section for common failure modes
- Setup checklist ensures nothing is forgotten

---

## Task 6: Vault HOME Update + Final Verification

**Files:**
- Modify: `vault/HOME.md`
- Run: full test suite

Finalize the knowledge base and run a complete verification pass.

- [ ] **Step 1: Update vault HOME.md**

Add Sprint 4 Deliverables section to `vault/HOME.md`:

```markdown
## Sprint 4 Deliverables

### Data Import Pipeline
- `slotting/io/importer.py` — CSV reader, validator, column mapper for real Action data
- `slotting/api/routes.py` — POST /import endpoint for file upload
- Handles: validation errors, partial imports, column mapping

### Proposition Presentation
- `presentation/index.html` — Self-contained reveal.js deck (~18 slides)
- Narrative: problem -> solution -> demo -> results -> next steps
- Speaker notes for presenter guidance

### Product Documentation
- `docs/architecture.md` — System architecture overview (4 layers, data flow)
- `docs/api-reference.md` — All API endpoints with schemas and examples
- `docs/deployment.md` — Setup and deployment guide

### Demo Rehearsal
- `docs/demo-rehearsal.md` — Step-by-step 15-20 min demo script with contingencies

### Key Result
**v1.0.0** — Complete deliverable package: working demo + presentation + documentation + data import pipeline ready for real Action data.
```

Update the Beslissingen section to note the v1.0.0 milestone.

- [ ] **Step 2: Run full test suite**

```bash
cd /c/Users/asini/Documents/GitHub/Slotting_mockup && python -m pytest tests/ -v --tb=short
```

Verify all tests pass (87 existing + ~18 new = ~105 total).

- [ ] **Step 3: Verify presentation renders**

Open `presentation/index.html` and confirm all slides load. Check no console errors.

- [ ] **Step 4: Verify documentation accuracy**

Spot-check that:
- API reference matches actual `schemas.py` definitions
- Deployment guide commands actually work
- Architecture doc references correct file paths

- [ ] **Step 5: Git tag v1.0.0**

```bash
cd /c/Users/asini/Documents/GitHub/Slotting_mockup && git add -A && git commit -m "Sprint 4: Propositie & Polish — data import, presentation, docs, v1.0.0" && git tag v1.0.0
```

**Acceptance criteria:**
- Vault HOME.md has complete Sprint 4 section
- All tests pass (~105 total)
- Presentation opens in browser without errors
- Documentation is accurate and references real files/endpoints
- Repository tagged v1.0.0

---

## Success Criteria — Sprint 4 Complete

| Criterion | Metric |
|-----------|--------|
| Data import works | `import_csv(path)` handles valid, invalid, and partial CSV files |
| API coverage | 4 endpoints: /health, /optimize, /pick-route, /import |
| Test coverage | ~105 tests, all passing |
| Presentation | Self-contained HTML, 16-20 slides, opens in browser |
| Documentation | Architecture + API ref + deployment guide + demo script |
| Demo ready | Rehearsal script covers 15-20 min flow with contingencies |
| Version | v1.0.0 tagged, health endpoint returns 1.0.0 |
| Vault complete | HOME.md documents all 4 sprints |

## Task Dependency Graph

```
Task 1 (Importer TDD) ──> Task 2 (Import API) ──┐
                                                  ├──> Task 6 (Vault + Verification + Tag)
Task 3 (Presentation) ───────────────────────────┤
Task 4 (Documentation) ──────────────────────────┤
Task 5 (Demo Script) ────────────────────────────┘
```

Tasks 1 and 2 are sequential (API depends on importer). Tasks 3, 4, 5 are independent and can run in parallel after Task 1. Task 6 must be last.
