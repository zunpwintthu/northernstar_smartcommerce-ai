from app.database import SessionLocal
from app.models import Category, DeliveryMethod, PaymentMethod, Product, User
from app.security import hash_password

def auth(token): return {"Authorization": f"Bearer {token}"}

def seed():
    db=SessionLocal(); c=Category(name="Clothing",slug="clothing"); db.add(c); db.flush(); db.add(Product(category_id=c.id,name="Blue Shirt",slug="blue-shirt",sku="BS-1",selling_price=40000,cost_price=20000,stock_quantity=10,low_stock_threshold=3)); db.add(PaymentMethod(name="Bank transfer",instructions="Use order reference")); db.add(DeliveryMethod(name="Standard",fee=3000)); db.commit(); db.close()

def test_health(client): assert client.get("/health").json()["status"] == "healthy"

def test_registration_and_login(client):
    r=client.post("/api/auth/register",json={"full_name":"A User","email":"a@example.com","password":"password8"}); assert r.status_code==201
    assert client.post("/api/auth/login",json={"email":"a@example.com","password":"password8"}).status_code==200

def test_checkout_deducts_stock(client,user_token):
    seed(); h=auth(user_token); p=client.get("/api/products").json()[0]
    assert client.post("/api/cart/items",headers=h,json={"product_id":p["id"],"quantity":3}).status_code==201
    pay=client.get("/api/payment-methods").json()[0]; delivery=client.get("/api/delivery-methods").json()[0]
    r=client.post("/api/checkout",headers=h,json={"customer_name":"Jane","customer_phone":"09123","customer_email":"jane@example.com","delivery_address":"12 Main Road","city":"Yangon","payment_method_id":pay["id"],"delivery_method_id":delivery["id"]})
    assert r.status_code==201; assert r.json()["payment_status"]=="pending_payment"
    assert client.get("/api/products").json()[0]["stock_quantity"]==7

def test_admin_permissions(client,user_token):
    assert client.get("/api/admin/reports/summary",headers=auth(user_token)).status_code==403

