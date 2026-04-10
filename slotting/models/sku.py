"""SKU domain models — products, categories, velocity classification."""

from dataclasses import dataclass, field
from enum import Enum

from slotting.models.warehouse import SizeClass


class Category(Enum):
    HOUSEHOLD = "household"
    BEAUTY = "beauty"
    TOYS = "toys"
    FOOD_SNACKS = "food_snacks"
    GARDEN_SEASONAL = "garden_seasonal"
    CLOTHING_ACCESSORIES = "clothing_accessories"
    OFFICE = "office"
    PET = "pet"
    DECORATION = "decoration"


class VelocityClass(Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


@dataclass(frozen=True)
class SKU:
    id: str
    name: str
    category: Category
    size: SizeClass
    weight_kg: float
    is_fragile: bool
    is_perishable: bool
    velocity_class: VelocityClass
    avg_daily_picks: float
    seasonal_peak_months: list[int] = field(default_factory=list)
    peak_multiplier: float = 1.0

    @property
    def is_seasonal(self) -> bool:
        return len(self.seasonal_peak_months) > 0
