import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base, SessionLocal, engine
from app.models import Category, DeliveryMethod, PaymentMethod, Product

Base.metadata.create_all(engine)
db = SessionLocal()
if not db.query(Category).count():
    clothing = Category(name="Clothing", slug="clothing", description="Everyday essentials", display_order=1)
    electronics = Category(name="Electronics", slug="electronics", description="Useful technology", display_order=2)
    db.add_all([clothing, electronics]); db.flush()
    db.add_all([
        Product(category_id=clothing.id, name="Indigo Everyday Shirt", slug="indigo-everyday-shirt", sku="SHIRT-IND-001", short_description="Breathable cotton, relaxed fit.", description="A versatile cotton shirt for warm days.", cost_price=18000, selling_price=35000, stock_quantity=12, low_stock_threshold=5, is_featured=True, image_url="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900"),
        Product(category_id=electronics.id, name="Pocket Bluetooth Speaker", slug="pocket-bluetooth-speaker", sku="SPEAKER-001", short_description="Small speaker, surprisingly full sound.", description="Portable wireless speaker with 10-hour battery.", cost_price=22000, selling_price=42000, discount_price=38000, stock_quantity=4, low_stock_threshold=5, is_featured=True, image_url="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900"),
    ])
if not db.query(PaymentMethod).count():
    db.add_all([PaymentMethod(name="Cash on delivery", instructions="Pay the courier when your order arrives."), PaymentMethod(name="Bank transfer", instructions="Transfer to SmartCommerce Bank, account 001-234-567, using your order reference."), PaymentMethod(name="Mobile wallet", instructions="Send payment to the configured store wallet and retain your reference."), PaymentMethod(name="Pay at shop", instructions="Visit our shop and quote your order reference.")])
if not db.query(DeliveryMethod).count():
    db.add_all([DeliveryMethod(name="Standard delivery", fee=3000, estimated_days="2-4 days"), DeliveryMethod(name="Store pickup", fee=0, estimated_days="Ready next business day")])
db.commit(); db.close(); print("Seed data ready")
