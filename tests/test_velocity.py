"""Tests for dynamic velocity classifier."""

from datetime import date
from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import SizeClass
from slotting.models.order import Order, OrderLine
from slotting.engine.velocity import VelocityClassifier


def _make_skus() -> list[SKU]:
    return [
        SKU(id="SKU-001", name="Fast Mover", category=Category.HOUSEHOLD,
            size=SizeClass.SMALL, weight_kg=0.5, is_fragile=False,
            is_perishable=False, velocity_class=VelocityClass.D, avg_daily_picks=1.0),
        SKU(id="SKU-002", name="Slow Mover", category=Category.DECORATION,
            size=SizeClass.LARGE, weight_kg=3.0, is_fragile=False,
            is_perishable=False, velocity_class=VelocityClass.A, avg_daily_picks=50.0),
        SKU(id="SKU-003", name="Medium", category=Category.TOYS,
            size=SizeClass.MEDIUM, weight_kg=1.0, is_fragile=False,
            is_perishable=False, velocity_class=VelocityClass.C, avg_daily_picks=5.0),
    ]


def _make_orders(fast_sku: str, slow_sku: str, medium_sku: str) -> list[Order]:
    orders = []
    for i in range(100):
        lines = [OrderLine(sku_id=fast_sku, quantity=1)]
        if i % 10 == 0:
            lines.append(OrderLine(sku_id=slow_sku, quantity=1))
        if i % 3 == 0:
            lines.append(OrderLine(sku_id=medium_sku, quantity=1))
        orders.append(Order(id=f"ORD-{i:04d}", date=date(2026, 4, 1), store_id="S-001", lines=lines))
    return orders


class TestVelocityClassifier:
    def test_classify_returns_all_skus(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        result = VelocityClassifier(skus, orders).classify()
        assert set(result.keys()) == {"SKU-001", "SKU-002", "SKU-003"}

    def test_fast_mover_gets_high_velocity(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        result = VelocityClassifier(skus, orders).classify()
        assert result["SKU-001"] == VelocityClass.A

    def test_slow_mover_gets_low_velocity(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        result = VelocityClassifier(skus, orders).classify()
        assert result["SKU-002"] in (VelocityClass.C, VelocityClass.D)

    def test_seasonal_adjustment(self):
        skus = [SKU(id="SKU-SEASON", name="Garden Item", category=Category.GARDEN_SEASONAL,
                    size=SizeClass.MEDIUM, weight_kg=1.0, is_fragile=False,
                    is_perishable=False, velocity_class=VelocityClass.C,
                    avg_daily_picks=5.0, seasonal_peak_months=[4, 5, 6], peak_multiplier=3.0)]
        orders = [Order(id=f"ORD-{i:04d}", date=date(2026, 4, 1), store_id="S-001",
                        lines=[OrderLine(sku_id="SKU-SEASON", quantity=1)]) for i in range(20)]
        result = VelocityClassifier(skus, orders, current_month=4).classify()
        assert result["SKU-SEASON"] in (VelocityClass.A, VelocityClass.B)

    def test_custom_thresholds(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        result = VelocityClassifier(skus, orders, thresholds={"A": 0.1, "B": 0.3, "C": 0.3, "D": 0.3}).classify()
        assert isinstance(result, dict)
