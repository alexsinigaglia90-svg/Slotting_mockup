"""Generate a realistic SKU catalog matching Action's discount retail profile."""

from dataclasses import dataclass, field

import numpy as np

from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import SizeClass


@dataclass
class SKUConfig:
    total_skus: int = 10_000
    a_pct: float = 0.20
    b_pct: float = 0.30
    c_pct: float = 0.30
    d_pct: float = 0.20


# Weighted distribution across Action's 9 product categories.
_CATEGORY_WEIGHTS: dict[Category, float] = {
    Category.HOUSEHOLD: 0.18,
    Category.BEAUTY: 0.12,
    Category.TOYS: 0.10,
    Category.FOOD_SNACKS: 0.12,
    Category.GARDEN_SEASONAL: 0.10,
    Category.CLOTHING_ACCESSORIES: 0.08,
    Category.OFFICE: 0.08,
    Category.PET: 0.07,
    Category.DECORATION: 0.15,
}

# Dutch product name templates per category: (template, unit_choices)
_NAME_TEMPLATES: dict[Category, list[tuple[str, list[int]]]] = {
    Category.HOUSEHOLD: [
        ("Afwasmiddel {}ml", [250, 500, 750, 1000]),
        ("Allesreiniger {}ml", [500, 750, 1000]),
        ("Vaatwastabletten {}st", [20, 30, 40, 60]),
        ("Schuurspons {}st", [3, 5, 10]),
        ("Vuilniszak {}L {}st", [20, 40]),
    ],
    Category.BEAUTY: [
        ("Shampoo {}ml", [200, 300, 400]),
        ("Conditioner {}ml", [200, 300]),
        ("Douchegel {}ml", [250, 500]),
        ("Deodorant {}ml", [150, 200]),
        ("Tandpasta {}ml", [75, 100, 150]),
    ],
    Category.TOYS: [
        ("Speelgoed Auto serie {}", [1, 2, 3, 4, 5]),
        ("Puzzel {}st", [50, 100, 200, 500]),
        ("Kleurboek {}pag", [24, 48, 96]),
        ("Knuffel {}cm", [20, 30, 40]),
        ("Bouwblokken {}st", [50, 100, 200]),
    ],
    Category.FOOD_SNACKS: [
        ("Chips {}g", [75, 150, 200]),
        ("Koekjes {}g", [150, 200, 300]),
        ("Snoep {}g", [100, 150, 200]),
        ("Noten {}g", [100, 150, 200]),
        ("Crackers {}g", [100, 200, 250]),
    ],
    Category.GARDEN_SEASONAL: [
        ("Bloempot {}cm", [10, 15, 20, 25]),
        ("Tuinslang {}m", [10, 15, 20]),
        ("Plantenbak {}L", [5, 10, 20]),
        ("Tuinhandschoenen mt {}", ["S", "M", "L"]),
        ("Zaailood {}g", [50, 100, 200]),
    ],
    Category.CLOTHING_ACCESSORIES: [
        ("T-shirt mt {}", ["XS", "S", "M", "L", "XL"]),
        ("Sok {}paar", [3, 5, 7]),
        ("Riem maat {}", [80, 85, 90, 95, 100]),
        ("Muts {}cm", [54, 56, 58]),
        ("Handtas {}L", [5, 10, 15]),
    ],
    Category.OFFICE: [
        ("Balpen {}st", [5, 10, 20]),
        ("Notitieblok {}vel", [50, 100]),
        ("Papier A4 {}vel", [100, 250, 500]),
        ("Map {}st", [5, 10]),
        ("Post-it {}st", [50, 100, 200]),
    ],
    Category.PET: [
        ("Hondenvoer {}g", [400, 800, 1200]),
        ("Kattenvoer {}g", [400, 800]),
        ("Vogelzaad {}kg", [1, 2, 5]),
        ("Kattenbak vulling {}L", [5, 10, 20]),
        ("Speeltje hond serie {}", [1, 2, 3]),
    ],
    Category.DECORATION: [
        ("Fotolijst {}x{}cm", [10, 13, 15, 20]),
        ("Kaars {}cm", [10, 15, 20]),
        ("Vaas {}cm", [15, 20, 30]),
        ("Schilderij {}x{}cm", [20, 30, 40]),
        ("Kussen {}cm", [40, 45, 50]),
    ],
}

# Seasonal config: (peak_months, multiplier)
_SEASONAL: dict[Category, tuple[list[int], float]] = {
    Category.GARDEN_SEASONAL: ([4, 5, 6, 7, 8], 3.5),
    Category.DECORATION: ([10, 11, 12], 2.5),
    Category.TOYS: ([10, 11, 12], 3.0),
}


def _build_name(rng: np.random.Generator, category: Category) -> str:
    templates = _NAME_TEMPLATES[category]
    idx = int(rng.integers(len(templates)))
    template, units = templates[idx]
    placeholders = template.count("{}")
    if placeholders == 1:
        unit = units[int(rng.integers(len(units)))]
        return template.format(unit)
    elif placeholders == 2:
        unit = units[int(rng.integers(len(units)))]
        return template.format(unit, unit)
    return template


def generate_skus(
    config: SKUConfig | None = None,
    seed: int | None = None,
) -> list[SKU]:
    if config is None:
        config = SKUConfig()

    rng = np.random.default_rng(seed)

    categories = list(_CATEGORY_WEIGHTS.keys())
    weights = np.array([_CATEGORY_WEIGHTS[c] for c in categories], dtype=float)
    weights /= weights.sum()

    counts: np.ndarray = rng.multinomial(config.total_skus, weights)

    # Velocity class thresholds derived from config percentages.
    a_thresh = config.a_pct
    ab_thresh = config.a_pct + config.b_pct
    abc_thresh = config.a_pct + config.b_pct + config.c_pct

    size_probs = np.array([0.50, 0.35, 0.15])
    sizes = [SizeClass.SMALL, SizeClass.MEDIUM, SizeClass.LARGE]

    skus: list[SKU] = []
    sku_idx = 0

    for cat_idx, category in enumerate(categories):
        n = int(counts[cat_idx])
        seasonal_months, peak_mult = _SEASONAL.get(category, ([], 1.0))
        is_food = category == Category.FOOD_SNACKS

        for _ in range(n):
            sku_id = f"SKU-{sku_idx:06d}"
            sku_idx += 1

            name = _build_name(rng, category)

            # Velocity class via Pareto-like percentile.
            percentile = float(rng.random())
            if percentile < a_thresh:
                velocity = VelocityClass.A
                avg_picks = float(rng.uniform(30, 100))
            elif percentile < ab_thresh:
                velocity = VelocityClass.B
                avg_picks = float(rng.uniform(10, 30))
            elif percentile < abc_thresh:
                velocity = VelocityClass.C
                avg_picks = float(rng.uniform(3, 10))
            else:
                velocity = VelocityClass.D
                avg_picks = float(rng.uniform(0.1, 3))

            # Size distribution.
            size_roll = float(rng.random())
            cumulative = 0.0
            size = SizeClass.SMALL
            for s, p in zip(sizes, size_probs):
                cumulative += p
                if size_roll < cumulative:
                    size = s
                    break

            weight_kg = float(rng.uniform(0.1, 5.0))
            is_fragile = float(rng.random()) < 0.08
            is_perishable = is_food

            sku = SKU(
                id=sku_id,
                name=name,
                category=category,
                size=size,
                weight_kg=weight_kg,
                is_fragile=is_fragile,
                is_perishable=is_perishable,
                velocity_class=velocity,
                avg_daily_picks=avg_picks,
                seasonal_peak_months=list(seasonal_months),
                peak_multiplier=peak_mult if seasonal_months else 1.0,
            )
            skus.append(sku)

    return skus
