"""Tests for data import pipeline — CSV reader, validator, mapper."""

import pytest
from pathlib import Path

from slotting.io.importer import (
    read_csv, validate_columns, validate_rows, map_to_models,
    import_csv, ImportResult, ImportRowError, ImportValidationError,
)
from slotting.models.sku import Category, VelocityClass
from slotting.models.warehouse import SizeClass

FIXTURES = Path(__file__).parent / "fixtures"


class TestCSVReader:
    def test_read_valid_csv_returns_rows(self):
        rows = read_csv(FIXTURES / "valid_import.csv")
        assert len(rows) == 10
        assert rows[0]["sku_id"] == "SKU-I001"

    def test_read_csv_with_extra_columns_ignores_them(self):
        rows = read_csv(FIXTURES / "extra_columns.csv")
        assert len(rows) == 2
        assert "supplier" not in rows[0]
        assert "sku_id" in rows[0]


class TestValidator:
    def test_validate_columns_valid(self):
        rows = read_csv(FIXTURES / "valid_import.csv")
        validate_columns(rows)  # should not raise

    def test_validate_columns_missing_raises(self):
        rows = read_csv(FIXTURES / "missing_columns.csv")
        with pytest.raises(ImportValidationError) as exc_info:
            validate_columns(rows)
        assert "weight" in str(exc_info.value)
        assert "level" in str(exc_info.value)

    def test_validate_valid_rows_returns_no_errors(self):
        rows = read_csv(FIXTURES / "valid_import.csv")
        errors = validate_rows(rows)
        assert len(errors) == 0

    def test_validate_bad_weight_returns_row_error(self):
        rows = read_csv(FIXTURES / "bad_types.csv")
        errors = validate_rows(rows)
        weight_errors = [e for e in errors if e.column == "weight"]
        assert len(weight_errors) >= 1

    def test_validate_bad_category_returns_row_error(self):
        rows = read_csv(FIXTURES / "bad_types.csv")
        errors = validate_rows(rows)
        cat_errors = [e for e in errors if e.column == "category"]
        assert len(cat_errors) >= 1

    def test_validate_bad_level_returns_row_error(self):
        rows = read_csv(FIXTURES / "bad_types.csv")
        errors = validate_rows(rows)
        level_errors = [e for e in errors if e.column == "level"]
        assert len(level_errors) >= 1

    def test_validate_returns_all_errors_not_just_first(self):
        rows = read_csv(FIXTURES / "bad_types.csv")
        errors = validate_rows(rows)
        assert len(errors) >= 3  # weight, category, level, size errors


class TestMapper:
    def test_map_rows_to_skus(self):
        rows = read_csv(FIXTURES / "valid_import.csv")
        skus, locations = map_to_models(rows, [])
        assert len(skus) == 10
        assert skus[0].id == "SKU-I001"
        assert skus[0].category == Category.HOUSEHOLD

    def test_map_rows_to_locations(self):
        rows = read_csv(FIXTURES / "valid_import.csv")
        skus, locations = map_to_models(rows, [])
        assert len(locations) == 10
        assert locations[0].aisle_id == "A01"
        assert locations[0].level == 1

    def test_map_category_string_to_enum(self):
        rows = read_csv(FIXTURES / "valid_import.csv")
        skus, _ = map_to_models(rows, [])
        assert skus[1].category == Category.BEAUTY

    def test_map_size_string_to_enum(self):
        rows = read_csv(FIXTURES / "valid_import.csv")
        skus, _ = map_to_models(rows, [])
        assert skus[0].size == SizeClass.MEDIUM
        assert skus[1].size == SizeClass.SMALL


class TestImportPipeline:
    def test_import_csv_end_to_end(self):
        result = import_csv(FIXTURES / "valid_import.csv")
        assert isinstance(result, ImportResult)
        assert result.rows_imported == 10
        assert result.rows_skipped == 0
        assert len(result.errors) == 0
        assert len(result.skus) == 10
        assert len(result.locations) == 10

    def test_import_csv_with_errors_returns_partial(self):
        result = import_csv(FIXTURES / "bad_types.csv")
        assert result.rows_imported >= 1  # at least the good row
        assert result.rows_skipped >= 1
        assert len(result.errors) >= 1
