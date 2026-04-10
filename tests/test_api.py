"""Tests for the FastAPI API layer."""

import pytest
from fastapi.testclient import TestClient

from slotting.api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


class TestHealthEndpoint:
    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "version" in data


class TestOptimizeEndpoint:
    def test_optimize_default(self, client):
        resp = client.post("/optimize", json={
            "num_orders": 100, "max_iterations": 5,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "score_before" in data
        assert "score_after" in data
        assert "improvement_pct" in data
        assert data["num_skus_assigned"] > 0

    def test_optimize_with_seeds(self, client):
        resp = client.post("/optimize", json={
            "warehouse_seed": 1, "sku_seed": 1, "order_seed": 1,
            "num_orders": 50, "max_iterations": 3,
        })
        assert resp.status_code == 200

    def test_optimize_reproducible(self, client):
        payload = {"warehouse_seed": 42, "sku_seed": 42, "order_seed": 42,
                    "num_orders": 50, "max_iterations": 5}
        resp1 = client.post("/optimize", json=payload)
        resp2 = client.post("/optimize", json=payload)
        assert resp1.json()["improvement_pct"] == resp2.json()["improvement_pct"]


class TestPickRouteEndpoint:
    def test_pick_route(self, client):
        client.post("/optimize", json={"num_orders": 50, "max_iterations": 3})
        resp = client.post("/pick-route", json={
            "sku_ids": ["SKU-000000", "SKU-000001"], "heuristic": "largest_gap",
        })
        assert resp.status_code in (200, 404)
