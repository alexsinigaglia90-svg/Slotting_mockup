from datetime import date
from slotting.generators.order_generator import generate_orders, OrderGenConfig
from slotting.generators.sku_generator import generate_skus, SKUConfig


def _make_skus():
    return generate_skus(config=SKUConfig(total_skus=200), seed=42)


def test_default_order_count():
    skus = _make_skus()
    orders = generate_orders(skus=skus, seed=42)
    assert 2000 <= len(orders) <= 5000


def test_custom_config():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=50, num_days=3)
    orders = generate_orders(skus=skus, config=config, seed=42)
    assert 100 <= len(orders) <= 200


def test_order_lines_in_range():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=100, num_days=1)
    orders = generate_orders(skus=skus, config=config, seed=42)
    for order in orders:
        assert 1 <= order.num_lines <= 60


def test_orders_have_dates():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=50, num_days=5, start_date=date(2026, 4, 1))
    orders = generate_orders(skus=skus, config=config, seed=42)
    dates = {o.date for o in orders}
    assert date(2026, 4, 1) in dates


def test_higher_velocity_skus_picked_more():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=200, num_days=5)
    orders = generate_orders(skus=skus, config=config, seed=42)
    pick_counts: dict[str, int] = {}
    for order in orders:
        for line in order.lines:
            pick_counts[line.sku_id] = pick_counts.get(line.sku_id, 0) + 1
    a_skus = [s for s in skus if s.velocity_class.value == "A"]
    d_skus = [s for s in skus if s.velocity_class.value == "D"]
    if a_skus and d_skus:
        avg_a = sum(pick_counts.get(s.id, 0) for s in a_skus) / len(a_skus)
        avg_d = sum(pick_counts.get(s.id, 0) for s in d_skus) / len(d_skus)
        assert avg_a > avg_d


def test_reproducible():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=50, num_days=2)
    o1 = generate_orders(skus=skus, config=config, seed=77)
    o2 = generate_orders(skus=skus, config=config, seed=77)
    assert len(o1) == len(o2)
    assert o1[0].id == o2[0].id
