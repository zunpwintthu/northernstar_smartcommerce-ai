from datetime import datetime
from decimal import Decimal
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..config import get_settings
from ..database import get_db
from ..models import Cart, CartItem, DeliveryMethod, InventoryTransaction, Order, OrderItem, PaymentMethod, Product, User
from ..schemas import CartItemIn, CheckoutIn, StatusIn
from ..security import current_user, require_roles
from ..serializers import order

router = APIRouter(prefix="/api", tags=["cart and orders"])

def get_cart(db, user):
    cart = db.scalar(select(Cart).where(Cart.user_id == user.id))
    if not cart: cart = Cart(user_id=user.id); db.add(cart); db.flush()
    return cart

def cart_json(cart):
    items = [{"id": i.id, "product": {"id": i.product.id, "name": i.product.name, "slug": i.product.slug, "price": float(i.product.price), "image_url": i.product.image_url, "stock_quantity": i.product.stock_quantity}, "quantity": i.quantity, "line_total": float(i.product.price * i.quantity)} for i in cart.items]
    return {"id": cart.id, "items": items, "subtotal": sum(i["line_total"] for i in items)}

@router.get("/cart")
def view_cart(db: Session = Depends(get_db), user: User = Depends(current_user)): return cart_json(get_cart(db, user))

@router.post("/cart/items", status_code=201)
def add_cart(data: CartItemIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    p = db.get(Product, data.product_id)
    if not p or not p.is_active: raise HTTPException(404, "Product not found")
    cart = get_cart(db, user); item = db.scalar(select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == p.id))
    total = data.quantity + (item.quantity if item else 0)
    if total > p.stock_quantity: raise HTTPException(400, "Requested quantity exceeds available stock")
    if item: item.quantity = total
    else: db.add(CartItem(cart_id=cart.id, product_id=p.id, quantity=data.quantity))
    db.commit(); db.refresh(cart); return cart_json(cart)

@router.put("/cart/items/{item_id}")
def update_cart(item_id: int, data: CartItemIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cart = get_cart(db, user); item = db.get(CartItem, item_id)
    if not item or item.cart_id != cart.id: raise HTTPException(404, "Cart item not found")
    if data.quantity > item.product.stock_quantity: raise HTTPException(400, "Requested quantity exceeds available stock")
    item.quantity = data.quantity; db.commit(); db.refresh(cart); return cart_json(cart)

@router.delete("/cart/items/{item_id}", status_code=204)
def remove_cart(item_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cart = get_cart(db, user); item = db.get(CartItem, item_id)
    if not item or item.cart_id != cart.id: raise HTTPException(404, "Cart item not found")
    db.delete(item); db.commit()

@router.post("/checkout", status_code=201)
def checkout(data: CheckoutIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cart = get_cart(db, user)
    if not cart.items: raise HTTPException(400, "Cart is empty")
    payment = db.get(PaymentMethod, data.payment_method_id); delivery = db.get(DeliveryMethod, data.delivery_method_id)
    if not payment or not payment.is_active or not delivery or not delivery.is_active: raise HTTPException(400, "Invalid payment or delivery method")
    for item in cart.items:
        if item.quantity > item.product.stock_quantity: raise HTTPException(409, f"Insufficient stock for {item.product.name}")
    subtotal = sum((i.product.price * i.quantity for i in cart.items), Decimal("0"))
    ref = f"ORD-{datetime.now():%Y}-{(db.scalar(select(func.count(Order.id))) or 0) + 1:06d}"
    try:
        new = Order(order_reference=ref, customer_id=user.id, subtotal=subtotal, delivery_fee=delivery.fee, total_amount=subtotal + delivery.fee, payment_method_id=payment.id, delivery_method_id=delivery.id, **data.model_dump(exclude={"payment_method_id", "delivery_method_id"}))
        db.add(new); db.flush()
        for item in list(cart.items):
            before = item.product.stock_quantity; item.product.stock_quantity -= item.quantity
            db.add(OrderItem(order_id=new.id, product_id=item.product_id, product_name=item.product.name, sku=item.product.sku, quantity=item.quantity, unit_price=item.product.price, total_price=item.product.price * item.quantity))
            db.add(InventoryTransaction(product_id=item.product_id, transaction_type="sale", quantity_change=-item.quantity, quantity_before=before, quantity_after=item.product.stock_quantity, reference_id=new.id))
            db.delete(item)
        db.commit(); db.refresh(new)
    except Exception: db.rollback(); raise
    message = f"New order received.\nOrder: {ref}\nCustomer: {new.customer_name}\nTotal: {new.total_amount} MMK\nPayment: {payment.name}\nDelivery: {delivery.name}"
    number = get_settings().admin_whatsapp_number
    return {**order(new), "whatsapp_url": f"https://wa.me/{number}?text={quote(message)}" if number else None}

@router.get("/orders/{reference}")
def track(reference: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    item = db.scalar(select(Order).where(Order.order_reference == reference))
    if not item or (item.customer_id != user.id and user.role == "customer"): raise HTTPException(404, "Order not found")
    return order(item)

@router.get("/customer/orders")
def history(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return [order(x) for x in db.scalars(select(Order).where(Order.customer_id == user.id).order_by(Order.id.desc())).all()]

@router.get("/admin/orders")
def admin_orders(db: Session = Depends(get_db), _: User = Depends(require_roles("staff", "admin", "super_admin"))):
    return [order(x) for x in db.scalars(select(Order).order_by(Order.id.desc())).all()]

@router.patch("/admin/orders/{order_id}/status")
def set_status(order_id: int, data: StatusIn, db: Session = Depends(get_db), _: User = Depends(require_roles("staff", "admin", "super_admin"))):
    allowed = {"new", "processing", "packing", "ready_for_delivery", "out_for_delivery", "delivered", "cancelled", "refunded"}
    if data.status not in allowed: raise HTTPException(400, "Invalid status")
    item = db.get(Order, order_id)
    if not item: raise HTTPException(404, "Order not found")
    item.order_status = data.status; db.commit(); db.refresh(item); return order(item)

@router.patch("/admin/orders/{order_id}/payment-status")
def set_payment(order_id: int, data: StatusIn, db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "super_admin"))):
    if data.status not in {"pending_payment", "payment_submitted", "payment_confirmed", "refunded"}: raise HTTPException(400, "Invalid payment status")
    item = db.get(Order, order_id)
    if not item: raise HTTPException(404, "Order not found")
    item.payment_status = data.status; db.commit(); db.refresh(item); return order(item)
