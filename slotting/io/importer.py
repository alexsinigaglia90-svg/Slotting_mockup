"""Data import pipeline — CSV reader, validator, and mapper for real warehouse data."""

import csv
from dataclasses import dataclass, field
from pathlib import Path

from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import Location, SizeClass

REQUIRED_COLUMNS = {
    "sku_id", "name", "category", "size", "weight",
    "location_id", "aisle", "position", "level",
}

_CATEGORY_MAP = {c.value: c for c in Category}
_SIZE_MAP = {"S": SizeClass.SMALL, "M": SizeClass.MEDIUM, "L": SizeClass.LARGE}


@dataclass
class ImportRowError:
    row: int
    column: str
    message: str


@dataclass
class ImportResult:
    skus: list[SKU] = field(default_factory=list)
    locations: list[Location] = field(default_factory=list)
    errors: list[ImportRowError] = field(default_factory=list)
    rows_imported: int = 0
    rows_skipped: int = 0


class ImportValidationError(Exception):
    def __init__(self, missing_columns: list[str]):
        self.missing_columns = missing_columns
        super().__init__(f"Missing required columns: {', '.join(missing_columns)}")


def read_csv(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            filtered = {k.strip(): v.strip() for k, v in row.items() if k.strip() in REQUIRED_COLUMNS}
            rows.append(filtered)
        return rows


def validate_columns(rows: list[dict[str, str]]) -> None:
    if not rows:
        raise ImportValidationError(list(REQUIRED_COLUMNS))
    present = set(rows[0].keys())
    missing = REQUIRED_COLUMNS - present
    if missing:
        raise ImportValidationError(sorted(missing))


def validate_rows(rows: list[dict[str, str]]) -> list[ImportRowError]:
    errors: list[ImportRowError] = []
    for i, row in enumerate(rows, start=1):
        # Weight
        try:
            w = float(row.get("weight", ""))
            if w < 0:
                errors.append(ImportRowError(i, "weight", f"Weight must be >= 0, got {w}"))
        except ValueError:
            errors.append(ImportRowError(i, "weight", f"Invalid weight: {row.get('weight', '')}"))

        # Category
        cat = row.get("category", "").lower()
        if cat not in _CATEGORY_MAP:
            errors.append(ImportRowError(i, "category", f"Unknown category '{cat}'. Valid: {list(_CATEGORY_MAP.keys())}"))

        # Size
        size = row.get("size", "").upper()
        if size not in _SIZE_MAP:
            errors.append(ImportRowError(i, "size", f"Unknown size '{size}'. Valid: S, M, L"))

        # Level
        try:
            level = int(row.get("level", ""))
            if not 1 <= level <= 6:
                errors.append(ImportRowError(i, "level", f"Level must be 1-6, got {level}"))
        except ValueError:
            errors.append(ImportRowError(i, "level", f"Invalid level: {row.get('level', '')}"))

    return errors


def map_to_models(
    rows: list[dict[str, str]], errors: list[ImportRowError]
) -> tuple[list[SKU], list[Location]]:
    error_rows = {e.row for e in errors}
    skus: list[SKU] = []
    locations: list[Location] = []

    for i, row in enumerate(rows, start=1):
        if i in error_rows:
            continue
        sku = SKU(
            id=row["sku_id"],
            name=row["name"],
            category=_CATEGORY_MAP[row["category"].lower()],
            size=_SIZE_MAP[row["size"].upper()],
            weight_kg=float(row["weight"]),
            is_fragile=False,
            is_perishable=row.get("category", "").lower() == "food_snacks",
            velocity_class=VelocityClass.C,
            avg_daily_picks=0.0,
        )
        loc = Location(
            id=row["location_id"],
            aisle_id=row["aisle"],
            rack_id=f"{row['aisle']}-{row['position']}",
            position=int(row["position"]),
            level=int(row["level"]),
            size=_SIZE_MAP[row["size"].upper()],
            max_weight_kg=30.0,
        )
        skus.append(sku)
        locations.append(loc)

    return skus, locations


def import_csv(path: Path) -> ImportResult:
    rows = read_csv(path)
    validate_columns(rows)
    errors = validate_rows(rows)
    skus, locations = map_to_models(rows, errors)
    error_rows = {e.row for e in errors}
    rows_skipped = len(error_rows)
    return ImportResult(
        skus=skus,
        locations=locations,
        errors=errors,
        rows_imported=len(rows) - rows_skipped,
        rows_skipped=rows_skipped,
    )
