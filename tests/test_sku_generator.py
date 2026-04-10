from slotting.generators.sku_generator import generate_skus, SKUConfig
from slotting.models.sku import Category, VelocityClass


def test_default_sku_count():
    skus = generate_skus(seed=42)
    assert 8000 <= len(skus) <= 12000


def test_custom_count():
    config = SKUConfig(total_skus=100)
    skus = generate_skus(config=config, seed=42)
    assert len(skus) == 100


def test_pareto_distribution():
    config = SKUConfig(total_skus=1000)
    skus = generate_skus(config=config, seed=42)
    a_count = sum(1 for s in skus if s.velocity_class == VelocityClass.A)
    assert 150 <= a_count <= 250


def test_all_categories_represented():
    skus = generate_skus(seed=42)
    categories = {s.category for s in skus}
    for cat in Category:
        assert cat in categories


def test_seasonal_skus_exist():
    skus = generate_skus(seed=42)
    seasonal = [s for s in skus if s.is_seasonal]
    assert len(seasonal) > 0


def test_reproducible():
    skus1 = generate_skus(seed=99)
    skus2 = generate_skus(seed=99)
    assert len(skus1) == len(skus2)
    assert skus1[0].id == skus2[0].id
    assert skus1[0].name == skus2[0].name


def test_unique_ids():
    config = SKUConfig(total_skus=500)
    skus = generate_skus(config=config, seed=42)
    ids = [s.id for s in skus]
    assert len(ids) == len(set(ids))
