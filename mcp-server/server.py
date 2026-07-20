import os
from fastapi import FastAPI, Header, HTTPException, Query
from sqlalchemy import create_engine, func, or_, select
from sqlalchemy.orm import Session

# Reuse the canonical business model instead of duplicating schema definitions.
from app.models import AuditLog, Order, OrderItem, PaymentMethod, Product, DeliveryMethod

engine = create_engine(os.getenv("DATABASE_URL", "sqlite:///./smartcommerce.db"), pool_pre_ping=True)
app = FastAPI(title="SmartCommerce MCP Tools", version="0.1.0")

def authorize(role: str | None, allowed=("customer", "staff", "admin", "super_admin")):
    if role not in allowed: raise HTTPException(403, "Role is not authorized for this tool")

def result(tool, data, message): return {"success": True, "tool": tool, "data": data, "message": message}

def audit(db, role, tool): db.add(AuditLog(user_id=None, action=f"mcp:{tool}:{role}", entity_type="mcp_tool", entity_id=tool)); db.commit()

@app.get("/health")
def health(): return {"status": "healthy", "service": "smartcommerce-mcp"}

@app.get("/tools/search_products")
def search_products(q: str = Query(min_length=1, max_length=120), x_user_role: str | None = Header(None)):
    authorize(x_user_role)
    with Session(engine) as db:
        rows = db.scalars(select(Product).where(Product.is_active, or_(Product.name.ilike(f"%{q}%"), Product.description.ilike(f"%{q}%"))).limit(20)).all()
        data = [{"product_id": p.id, "name": p.name, "sku": p.sku, "price": float(p.price), "in_stock": p.stock_quantity > 0} for p in rows]; audit(db, x_user_role, "search_products")
    return result("search_products", data, f"Found {len(data)} products.")

@app.get("/tools/check_product_stock")
def check_stock(product_id: int, x_user_role: str | None = Header(None)):
    authorize(x_user_role)
    with Session(engine) as db:
        p = db.get(Product, product_id)
        if not p or not p.is_active: raise HTTPException(404, "Product not found")
        data = {"product_id": p.id, "name": p.name, "stock_quantity": p.stock_quantity, "available": p.stock_quantity > 0}; audit(db, x_user_role, "check_product_stock")
    return result("check_product_stock", data, "Stock retrieved.")

@app.get("/tools/get_order_by_reference")
def get_order(reference: str, x_user_role: str | None = Header(None)):
    authorize(x_user_role, ("staff", "admin", "super_admin"))
    with Session(engine) as db:
        o = db.scalar(select(Order).where(Order.order_reference == reference))
        if not o: raise HTTPException(404, "Order not found")
        data = {"order_reference": o.order_reference, "payment_status": o.payment_status, "order_status": o.order_status, "total_amount": float(o.total_amount)}; audit(db, x_user_role, "get_order_by_reference")
    return result("get_order_by_reference", data, "Order retrieved.")

@app.get("/tools/get_low_stock_products")
def low_stock(x_user_role: str | None = Header(None)):
    authorize(x_user_role, ("staff", "admin", "super_admin"))
    with Session(engine) as db:
        rows = db.scalars(select(Product).where(Product.stock_quantity <= Product.low_stock_threshold)).all(); data = [{"product_id": p.id, "name": p.name, "sku": p.sku, "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold} for p in rows]; audit(db, x_user_role, "get_low_stock_products")
    return result("get_low_stock_products", data, f"Found {len(data)} low-stock products.")

@app.get("/tools/get_monthly_sales")
def monthly_sales(x_user_role: str | None = Header(None)):
    authorize(x_user_role, ("admin", "super_admin"))
    with Session(engine) as db:
        revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.payment_status == "payment_confirmed")); data = {"confirmed_revenue": float(revenue)}; audit(db, x_user_role, "get_monthly_sales")
    return result("get_monthly_sales", data, "Confirmed sales calculated from orders.")

@app.get("/tools/get_payment_instructions")
def payment_instructions(x_user_role: str | None = Header(None)):
    authorize(x_user_role)
    with Session(engine) as db:
        data = [{"name": p.name, "instructions": p.instructions} for p in db.scalars(select(PaymentMethod).where(PaymentMethod.is_active)).all()]; audit(db, x_user_role, "get_payment_instructions")
    return result("get_payment_instructions", data, "Payment methods retrieved.")

@app.get("/tools/get_delivery_methods")
def delivery_methods(x_user_role: str | None = Header(None)):
    authorize(x_user_role)
    with Session(engine) as db:
        data = [{"name": x.name, "fee": float(x.fee), "estimated_days": x.estimated_days} for x in db.scalars(select(DeliveryMethod).where(DeliveryMethod.is_active)).all()]; audit(db, x_user_role, "get_delivery_methods")
    return result("get_delivery_methods", data, "Delivery methods retrieved.")

