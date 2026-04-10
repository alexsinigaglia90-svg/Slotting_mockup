---
tags: [research, ml, forecasting, demand, sprint-2]
sources:
  - "Makridakis, Spiliotis & Assimakopoulos (2018) - Statistical and ML forecasting methods"
  - "Taylor & Letham (2018) - Forecasting at Scale (Prophet)"
  - "Chen & Guestrin (2016) - XGBoost: A Scalable Tree Boosting System"
  - "Salinas et al. (2020) - DeepAR: Probabilistic Forecasting with Autoregressive RNNs"
sprint: 2
created: 2026-04-10
---

# Demand Forecasting Model Comparison

## Overview
Accurate demand forecasting at SKU level is critical for dynamic slotting — it determines velocity classification, which drives location assignment. Historical picks alone lag behind trends; predictive models enable proactive re-slotting.

## Models Compared

### XGBoost (Gradient Boosted Trees)
- **Approach:** Tabular features (day-of-week, month, promotions, category, historical lags)
- **Strengths:** Fast training, handles mixed feature types, robust to missing data, excellent for mid-frequency SKUs
- **Weaknesses:** No native time-series awareness, requires manual feature engineering for seasonality
- **Accuracy:** Typically 15-25% MAPE on retail SKU-level forecasting
- **Training time:** Minutes on 10K SKUs × 365 days

### Prophet (Meta)
- **Approach:** Additive decomposition (trend + seasonality + holidays + regressors)
- **Strengths:** Built-in handling of seasonality, holidays, changepoints; good for strong seasonal patterns
- **Weaknesses:** Slower per-SKU (fits individually), less accurate for intermittent demand, limited feature input
- **Accuracy:** 20-35% MAPE, better for aggregate than SKU-level
- **Training time:** Seconds per SKU, but N × seconds for full catalog

### LSTM / DeepAR
- **Approach:** Recurrent neural networks trained across all SKUs jointly
- **Strengths:** Captures cross-SKU patterns, handles cold-start, probabilistic output
- **Weaknesses:** Requires significant data (>2 years ideal), GPU training, black-box
- **Accuracy:** 12-20% MAPE with enough data
- **Training time:** Hours on GPU

## Recommendation for Action

**Primary: XGBoost** — fast, interpretable, handles Action's feature-rich data well (promotions, store type, category, seasonal flags). Train one model across all SKUs with SKU-level features.

**Fallback: Prophet** — for specific SKUs with very strong seasonal patterns (garden/BBQ, Christmas decorations) where decomposition helps.

**Not recommended for demo: LSTM/DeepAR** — requires more data than we'll have and adds training complexity without proportional benefit for the demo phase.

## Implementation Implications
- XGBoost features: `sku_category`, `month`, `day_of_week`, `is_promotion`, `historical_7d_avg`, `historical_30d_avg`, `seasonal_flag`
- Output: predicted daily picks per SKU → feeds VelocityClassifier
- For demo: use synthetic seasonal patterns as proxy for real forecast
