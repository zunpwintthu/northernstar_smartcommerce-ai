import csv, io
from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Order, OrderItem, Product, User
from ..security import require_roles
from ..serializers import product

router = APIRouter(prefix="/api/admin", tags=["administration"])
admin = require_roles("admin", "super_admin")

def summary_data(db):
    confirmed = select(Order).where(Order.payment_status == "payment_confirmed")
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.payment_status == "payment_confirmed"))
    return {"gross_revenue": float(revenue), "total_orders": db.scalar(select(func.count(Order.id))), "pending_payments": db.scalar(select(func.count(Order.id)).where(Order.payment_status == "pending_payment")), "low_stock_count": db.scalar(select(func.count(Product.id)).where(Product.stock_quantity <= Product.low_stock_threshold)), "out_of_stock_count": db.scalar(select(func.count(Product.id)).where(Product.stock_quantity == 0))}

@router.get("/reports/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(admin)): return summary_data(db)

@router.get("/reports/product-sales")
def product_sales(db: Session = Depends(get_db), _: User = Depends(admin)):
    rows = db.execute(select(OrderItem.product_name, func.sum(OrderItem.quantity), func.sum(OrderItem.total_price)).join(Order).where(Order.payment_status == "payment_confirmed").group_by(OrderItem.product_name).order_by(func.sum(OrderItem.quantity).desc())).all()
    return [{"product": r[0], "units": r[1], "revenue": float(r[2])} for r in rows]

@router.get("/reports/export/csv")
def export_csv(db: Session = Depends(get_db), _: User = Depends(admin)):
    output = io.StringIO(); writer = csv.writer(output); writer.writerow(["Order", "Customer", "Total", "Payment", "Status"])
    for o in db.scalars(select(Order).order_by(Order.created_at.desc())): writer.writerow([o.order_reference, o.customer_name, o.total_amount, o.payment_status, o.order_status])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sales.csv"})

@router.get("/alerts/low-stock")
def low_stock(db: Session = Depends(get_db), _: User = Depends(require_roles("staff", "admin", "super_admin"))):
    return [product(x) for x in db.scalars(select(Product).where(Product.stock_quantity <= Product.low_stock_threshold)).all()]

