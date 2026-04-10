"""Dynamic velocity classifier — ABC+ classification based on actual order data."""

from collections import Counter

from slotting.models.order import Order
from slotting.models.sku import SKU, VelocityClass


class VelocityClassifier:
    """Classify SKUs into velocity classes based on order history and seasonal factors."""

    DEFAULT_THRESHOLDS = {"A": 0.20, "B": 0.30, "C": 0.30, "D": 0.20}

    def __init__(self, skus: list[SKU], orders: list[Order],
                 current_month: int | None = None,
                 thresholds: dict[str, float] | None = None) -> None:
        self._skus = {s.id: s for s in skus}
        self._orders = orders
        self._current_month = current_month
        self._thresholds = thresholds or self.DEFAULT_THRESHOLDS

    def classify(self) -> dict[str, VelocityClass]:
        pick_counts: Counter[str] = Counter()
        for order in self._orders:
            for line in order.lines:
                pick_counts[line.sku_id] += line.quantity

        scores: dict[str, float] = {}
        for sku_id, sku in self._skus.items():
            base_count = float(pick_counts.get(sku_id, 0))
            if self._current_month is not None and self._current_month in sku.seasonal_peak_months:
                base_count *= sku.peak_multiplier
            scores[sku_id] = base_count

        sorted_skus = sorted(scores.keys(), key=lambda s: scores[s], reverse=True)
        total = len(sorted_skus)
        if total == 0:
            return {}

        a_cutoff = max(1, round(total * self._thresholds["A"]))
        b_cutoff = a_cutoff + max(0, round(total * self._thresholds["B"]))
        c_cutoff = b_cutoff + max(0, round(total * self._thresholds["C"]))

        result: dict[str, VelocityClass] = {}
        for i, sku_id in enumerate(sorted_skus):
            if i < a_cutoff:
                result[sku_id] = VelocityClass.A
            elif i < b_cutoff:
                result[sku_id] = VelocityClass.B
            elif i < c_cutoff:
                result[sku_id] = VelocityClass.C
            else:
                result[sku_id] = VelocityClass.D
        return result
