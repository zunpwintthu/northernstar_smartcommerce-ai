def category(c):
    return {"id": c.id, "name": c.name, "slug": c.slug, "description": c.description, "image_url": c.image_url}

def product(p):
    return {"id": p.id, "category_id": p.category_id, "category": p.category.name if p.category else None, "name": p.name, "slug": p.slug, "sku": p.sku, "description": p.description, "short_description": p.short_description, "selling_price": float(p.selling_price), "discount_price": float(p.discount_price) if p.discount_price is not None else None, "price": float(p.price), "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold, "image_url": p.image_url, "is_featured": p.is_featured}

def order(o):
    return {"id": o.id, "order_reference": o.order_reference, "customer_name": o.customer_name, "customer_phone": o.customer_phone, "customer_email": o.customer_email, "delivery_address": o.delivery_address, "city": o.city, "subtotal": float(o.subtotal), "delivery_fee": float(o.delivery_fee), "total_amount": float(o.total_amount), "payment_status": o.payment_status, "order_status": o.order_status, "payment_method": o.payment_method.name, "payment_instructions": o.payment_method.instructions, "delivery_method": o.delivery_method.name, "created_at": o.created_at.isoformat(), "items": [{"product_id": i.product_id, "name": i.product_name, "sku": i.sku, "quantity": i.quantity, "unit_price": float(i.unit_price), "total_price": float(i.total_price)} for i in o.items]}

