"""Generate realistic warehouse layouts matching Action's profile."""

from dataclasses import dataclass

from slotting.models.warehouse import (
    Warehouse, Aisle, Rack, Location, Zone, ZoneType, SizeClass,
)


@dataclass
class WarehouseConfig:
    num_aisles: int = 15
    racks_per_aisle: int = 20
    levels_per_rack: int = 5
    aisle_length_m: float = 40.0
    aisle_spacing_m: float = 4.5
    aisle_width_m: float = 3.0
    forward_pick_aisles: int = 4


def generate_warehouse(
    config: WarehouseConfig | None = None,
    warehouse_id: str = "WH-NL-01",
    seed: int | None = None,
) -> Warehouse:
    if config is None:
        config = WarehouseConfig()

    aisles = []
    for aisle_idx in range(config.num_aisles):
        aisle_id = f"A{aisle_idx + 1:02d}"
        x_pos = aisle_idx * config.aisle_spacing_m

        aisle_racks = []
        for side in ["left", "right"]:
            for rack_pos in range(1, config.racks_per_aisle + 1):
                rack_id = f"{aisle_id}-{side[0].upper()}{rack_pos:02d}"
                locations = []
                for level in range(1, config.levels_per_rack + 1):
                    size = _size_for_level(level, config.levels_per_rack)
                    loc = Location(
                        id=f"{rack_id}-L{level}",
                        aisle_id=aisle_id, rack_id=rack_id,
                        position=rack_pos, level=level,
                        size=size, max_weight_kg=_weight_for_level(level),
                    )
                    locations.append(loc)
                rack = Rack(
                    id=rack_id, aisle_id=aisle_id, position=rack_pos,
                    side=side, levels=config.levels_per_rack, locations=locations,
                )
                aisle_racks.append(rack)

        aisle = Aisle(
            id=aisle_id, x_position=x_pos,
            length_m=config.aisle_length_m, width_m=config.aisle_width_m,
            racks=aisle_racks,
        )
        aisles.append(aisle)

    zones = [
        Zone(id="forward-pick", zone_type=ZoneType.FORWARD_PICK,
             aisle_ids=[a.id for a in aisles[:config.forward_pick_aisles]]),
        Zone(id="bulk-storage", zone_type=ZoneType.BULK_STORAGE,
             aisle_ids=[a.id for a in aisles[config.forward_pick_aisles:]]),
    ]

    return Warehouse(
        id=warehouse_id, name=f"Action DC {warehouse_id}",
        aisles=aisles, zones=zones,
        depot_position=(0.0, 0.0),
        cross_aisle_positions=[0.0, config.aisle_length_m],
    )


def _size_for_level(level: int, max_levels: int) -> SizeClass:
    if level <= 2:
        return SizeClass.SMALL
    elif level <= max_levels - 1:
        return SizeClass.MEDIUM
    else:
        return SizeClass.LARGE


def _weight_for_level(level: int) -> float:
    if level <= 2:
        return 30.0
    elif level <= 4:
        return 20.0
    else:
        return 10.0
