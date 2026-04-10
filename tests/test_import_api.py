"""Tests for the import API endpoint."""

import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from slotting.api.app import create_app

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
def client():
    return TestClient(create_app())


class TestImportAPI:
    def test_import_valid_csv_returns_200(self, client):
        with open(FIXTURES / "valid_import.csv", "rb") as f:
            resp = client.post("/import", files={"file": ("data.csv", f, "text/csv")})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["rows_imported"] == 10
        assert data["num_skus"] == 10

    def test_import_bad_csv_returns_partial(self, client):
        with open(FIXTURES / "bad_types.csv", "rb") as f:
            resp = client.post("/import", files={"file": ("data.csv", f, "text/csv")})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "partial"
        assert data["rows_skipped"] >= 1
        assert len(data["errors"]) >= 1

    def test_import_missing_columns_returns_422(self, client):
        with open(FIXTURES / "missing_columns.csv", "rb") as f:
            resp = client.post("/import", files={"file": ("data.csv", f, "text/csv")})
        assert resp.status_code == 422

    def test_health_returns_version_1(self, client):
        resp = client.get("/health")
        assert resp.json()["version"] == "1.0.0"
