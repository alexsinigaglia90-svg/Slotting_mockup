"""Warehouse domain models — layout, aisles, racks, locations, zones."""

from dataclasses import dataclass, field
from enum import Enum


class SizeClass(Enum):
    SMALL = "S"
    MEDIUM = "M"
    LARGE = "L"


class ZoneType(Enum):
    FORWARD_PICK = "forward_pick"
    BULK_STORAGE = "bulk_storage"
    SEASONAL = "seasonal"


@dataclass(frozen=True)
class Location:
    id: str
    aisle_id: str
    rack_id: str
    position: int
    level: int
    size: SizeClass
    max_weight_kg: float
    sku_id: str | None = None

    @property
    def is_ground_level(self) -> bool:
        return self.level <= 2


@dataclass
class Rack:
    id: str
    aisle_id: str
    position: int
    side: str
    levels: int
    locations: list[Location] = field(default_factory=list)


@dataclass
class Aisle:
    id: str
    x_position: float
    length_m: float
    width_m: float
    racks: list[Rack] = field(default_factory=list)


@dataclass
class Zone:
    id: str
    zone_type: ZoneType
    aisle_ids: list[str] = field(default_factory=list)


@dataclass
class Warehouse:
    id: str
    name: str
    aisles: list[Aisle] = field(default_factory=list)
    zones: list[Zone] = field(default_factory=list)
    depot_position: tuple[float, float] = (0.0, 0.0)
    cross_aisle_positions: list[float] = field(default_factory=list)

    @property
    def total_locations(self) -> int:
        return sum(
            len(rack.locations)
            for aisle in self.aisles
            for rack in aisle.racks
        )
