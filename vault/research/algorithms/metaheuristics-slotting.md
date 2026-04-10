---
tags: [research, algorithms, metaheuristics, optimization, sprint-2]
sources:
  - "Kirkpatrick, Gelatt & Vecchi (1983) - Optimization by Simulated Annealing"
  - "Glover (1986) - Future Paths for Integer Programming and Links to AI (Tabu Search)"
  - "Holland (1975) - Adaptation in Natural and Artificial Systems (Genetic Algorithms)"
  - "Gu, Goetschalckx & McGinnis (2010) - Research on warehouse design and performance"
sprint: 2
created: 2026-04-10
---

# Metaheuristics for the Slotting Problem

## Overview
The warehouse slotting problem (assigning N SKUs to M locations) is a variant of the Quadratic Assignment Problem (QAP) — NP-hard. Exact solvers are infeasible beyond ~50 items. Metaheuristics provide near-optimal solutions in reasonable time.

## Methods Compared

### Simulated Annealing (SA)
- **Mechanism:** Random perturbation (swap two SKU assignments), accept if better or with probability exp(-ΔE/T) where T decreases over time
- **Strengths:** Simple to implement, good escape from local optima, few parameters
- **Convergence:** Typically 1000-10000 iterations for warehouse-scale problems
- **Quality:** Within 2-5% of optimal for well-tuned cooling schedule
- **Best for:** Medium problems (100-1000 SKUs), when implementation simplicity matters

### Genetic Algorithm (GA)
- **Mechanism:** Population of solutions, crossover (partially mapped), mutation (swap), selection (tournament)
- **Strengths:** Explores solution space broadly, good for multi-objective optimization
- **Convergence:** 50-200 generations × population size
- **Quality:** Within 3-8% of optimal, depends heavily on crossover design
- **Best for:** Large problems (1000+ SKUs), when multiple objectives (distance + weight + zone balance)

### Tabu Search
- **Mechanism:** Local search with memory (tabu list prevents revisiting recent solutions)
- **Strengths:** Strong intensification, good for finding exact local optima
- **Convergence:** Fast — typically fewer iterations than SA
- **Quality:** Within 1-3% of optimal, best among single-solution methods
- **Best for:** When solution quality matters more than exploration breadth

## Comparison Table

| Criterion | SA | GA | Tabu |
|-----------|-----|-----|------|
| Implementation complexity | Low | High | Medium |
| Solution quality | Good | Good | Best |
| Convergence speed | Medium | Slow | Fast |
| Parameter sensitivity | Medium (cooling) | High (crossover/mutation) | Low (tabu tenure) |
| Parallelizable | No | Yes (population) | No |
| Memory usage | O(1) | O(population × N) | O(tabu_size × N) |

## Recommendation for Action Demo

**Sprint 2: Random swap local search** (simplified SA without temperature) — proves the concept, fast implementation, good enough improvement for demo.

**Sprint 2+: Full simulated annealing** — if demo shows promise, add proper cooling schedule for production quality.

**Production: Tabu search** — best quality/speed tradeoff for the 8K-12K SKU scale.

## Implementation Notes
- Swap neighborhood: exchange assignments of two random SKU-location pairs
- Evaluation: use PickRouteSolver on sample of orders (100-200) for fast scoring
- Termination: max iterations OR no improvement for N iterations
