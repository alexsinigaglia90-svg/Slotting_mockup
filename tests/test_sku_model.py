from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import SizeClass


def test_sku_creation():
    sku = SKU(
        id="SKU-00001", name="Afwasmiddel 500ml", category=Category.HOUSEHOLD,
        size=SizeClass.SMALL, weight_kg=0.6, is_fragile=False, is_perishable=False,
        velocity_class=VelocityClass.A, avg_daily_picks=45.0,
    )
    assert sku.id == "SKU-00001"
    assert sku.category == Category.HOUSEHOLD
    assert sku.velocity_class == VelocityClass.A


def test_sku_seasonal():
    sku = SKU(
        id="SKU-10001", name="BBQ Houtskool 3kg", category=Category.GARDEN_SEASONAL,
        size=SizeClass.LARGE, weight_kg=3.2, is_fragile=False, is_perishable=False,
        velocity_class=VelocityClass.B, avg_daily_picks=12.0,
        seasonal_peak_months=[4, 5, 6, 7, 8], peak_multiplier=3.5,
    )
    assert sku.is_seasonal
    assert 6 in sku.seasonal_peak_months
    assert sku.peak_multiplier == 3.5


def test_sku_not_seasonal():
    sku = SKU(
        id="SKU-00002", name="Toiletpapier 8-pack", category=Category.HOUSEHOLD,
        size=SizeClass.MEDIUM, weight_kg=1.2, is_fragile=False, is_perishable=False,
        velocity_class=VelocityClass.A, avg_daily_picks=80.0,
    )
    assert not sku.is_seasonal


def test_all_categories_exist():
    expected = ["HOUSEHOLD", "BEAUTY", "TOYS", "FOOD_SNACKS", "GARDEN_SEASONAL",
                "CLOTHING_ACCESSORIES", "OFFICE", "PET", "DECORATION"]
    for name in expected:
        assert hasattr(Category, name)


def test_velocity_classes():
    assert VelocityClass.A.value == "A"
    assert VelocityClass.B.value == "B"
    assert VelocityClass.C.value == "C"
    assert VelocityClass.D.value == "D"
