"""Order domain models — orders and order lines for store replenishment."""

from dataclasses import dataclass, field
from datetime import date


@dataclass(frozen=True)
class OrderLine:
    sku_id: str
    quantity: int
    location_id: str | None = None


@dataclass
class Order:
    id: str
    date: date
    store_id: str
    lines: list[OrderLine] = field(default_factory=list)

    @property
    def num_lines(self) -> int:
        return len(self.lines)

    @property
    def total_units(self) -> int:
        return sum(line.quantity for line in self.lines)

    @property
    def sku_ids(self) -> set[str]:
        return {line.sku_id for line in self.lines}
