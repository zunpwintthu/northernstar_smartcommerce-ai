"""Beginner-friendly deterministic routing; Ollama can be layered onto formatted tool results."""
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from ..models import Order, Product
from ..serializers import product

def classify_intent(message: str) -> str:
    text = message.lower()
    if any(x in text for x in ("low stock", "restock")): return "low_stock_reporting"
    if any(x in text for x in ("sales", "revenue")): return "sales_reporting"
    if any(x in text for x in ("order", "track")): return "order_tracking"
    if any(x in text for x in ("payment", "pay")): return "payment_instructions"
    if any(x in text for x in ("find", "show", "product", "recommend", "under", "below")): return "product_search"
    return "unsupported_request"

def run_assistant(message: str, role: str, db: Session):
    intent = classify_intent(message)
    tool = None; data = []
    if intent == "product_search":
        tool = "search_products"; words = [w for w in message.lower().split() if len(w) > 3]
        stmt = select(Product).where(Product.is_active)
        if words: stmt = stmt.where(or_(*[Product.name.ilike(f"%{w}%") for w in words]))
        data = [product(p) for p in db.scalars(stmt.limit(8)).all()]
        answer = f"I found {len(data)} matching products." if data else "I couldn't find a matching product."
    elif intent == "low_stock_reporting" and role in {"staff", "admin", "super_admin"}:
        tool = "get_low_stock_products"; data = [product(p) for p in db.scalars(select(Product).where(Product.stock_quantity <= Product.low_stock_threshold)).all()]; answer = f"There are {len(data)} products at or below their low-stock threshold."
    elif intent == "sales_reporting" and role in {"admin", "super_admin"}:
        tool = "get_monthly_sales"; value = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.payment_status == "payment_confirmed")); data = {"confirmed_revenue": float(value)}; answer = f"Confirmed sales revenue is {float(value):,.0f} MMK."
    elif intent in {"low_stock_reporting", "sales_reporting"}: answer = "That business report is restricted to authorized staff."
    else: answer = "I can help search products and answer authorized stock or sales questions."
    return {"intent": intent, "tool_used": tool, "answer": answer, "data": data, "grounded": tool is not None}

