from datetime import date
from slotting.models.order import Order, OrderLine


def test_order_line_creation():
    line = OrderLine(sku_id="SKU-00001", quantity=6, location_id="A01-01-1")
    assert line.sku_id == "SKU-00001"
    assert line.quantity == 6


def test_order_creation():
    lines = [
        OrderLine(sku_id="SKU-00001", quantity=6),
        OrderLine(sku_id="SKU-00042", quantity=2),
        OrderLine(sku_id="SKU-00099", quantity=12),
    ]
    order = Order(id="ORD-2026-04-10-0001", date=date(2026, 4, 10), store_id="STORE-NL-042", lines=lines)
    assert order.id == "ORD-2026-04-10-0001"
    assert order.num_lines == 3
    assert order.total_units == 20


def test_order_sku_ids():
    lines = [OrderLine(sku_id="SKU-00001", quantity=6), OrderLine(sku_id="SKU-00042", quantity=2)]
    order = Order(id="ORD-001", date=date(2026, 4, 10), store_id="STORE-001", lines=lines)
    assert order.sku_ids == {"SKU-00001", "SKU-00042"}


def test_empty_order():
    order = Order(id="ORD-EMPTY", date=date(2026, 4, 10), store_id="STORE-001", lines=[])
    assert order.num_lines == 0
    assert order.total_units == 0
    assert order.sku_ids == set()
