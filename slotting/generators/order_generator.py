"""Generate realistic store replenishment orders matching Action's operational patterns."""

from dataclasses import dataclass, field
from datetime import date, timedelta

import numpy as np

from slotting.models.order import Order, OrderLine
from slotting.models.sku import SKU, VelocityClass

# Velocity class pick probability weights.
_VELOCITY_WEIGHTS: dict[VelocityClass, float] = {
    VelocityClass.A: 4.0,
    VelocityClass.B: 2.0,
    VelocityClass.C: 1.0,
    VelocityClass.D: 0.3,
}

# Weekday multipliers: Mon=0 through Sun=6.
_WEEKDAY_MULTIPLIERS = [1.4, 1.3, 1.0, 1.0, 0.9, 0.7, 0.7]

_NUM_STORES = 300


@dataclass
class OrderGenConfig:
    orders_per_day: int = 3500
    num_days: int = 1
    start_date: date = field(default_factory=lambda: date(2026, 4, 1))
    min_lines: int = 15
    max_lines: int = 40
    day_variance: float = 0.15


def generate_orders(
    skus: list[SKU],
    config: OrderGenConfig | None = None,
    seed: int | None = None,
) -> list[Order]:
    if config is None:
        config = OrderGenConfig()

    rng = np.random.default_rng(seed)

    # Build per-SKU pick probability weights, applying seasonal adjustment for
    # the start month.
    current_month = config.start_date.month
    raw_weights = np.array(
        [
            _VELOCITY_WEIGHTS[s.velocity_class]
            * (s.peak_multiplier if current_month in s.seasonal_peak_months else 1.0)
            for s in skus
        ],
        dtype=float,
    )
    pick_probs = raw_weights / raw_weights.sum()

    sku_ids = [s.id for s in skus]
    num_skus = len(skus)

    orders: list[Order] = []
    order_counter = 1

    for day_offset in range(config.num_days):
        current_date = config.start_date + timedelta(days=day_offset)
        weekday = current_date.weekday()  # 0=Mon, 6=Sun
        day_multiplier = _WEEKDAY_MULTIPLIERS[weekday]

        base_count = config.orders_per_day * day_multiplier
        daily_count = int(rng.normal(base_count, base_count * config.day_variance))
        daily_count = max(1, daily_count)

        date_str = current_date.isoformat()

        for _ in range(daily_count):
            order_id = f"ORD-{date_str}-{order_counter:06d}"
            order_counter += 1

            store_num = int(rng.integers(1, _NUM_STORES + 1))
            store_id = f"STORE-NL-{store_num:03d}"

            num_lines = int(rng.integers(config.min_lines, config.max_lines + 1))
            # Clamp to available SKUs to avoid requesting more unique picks than exist.
            num_lines = min(num_lines, num_skus)

            chosen_indices = rng.choice(num_skus, size=num_lines, replace=False, p=pick_probs)
            lines = [
                OrderLine(
                    sku_id=sku_ids[idx],
                    quantity=int(rng.integers(1, 24)),
                )
                for idx in chosen_indices
            ]

            orders.append(Order(id=order_id, date=current_date, store_id=store_id, lines=lines))

    return orders
