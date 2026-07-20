from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Category, Product, PaymentMethod, DeliveryMethod, User
from ..schemas import CategoryIn, ProductIn
from ..security import require_roles
from ..serializers import category, product

router = APIRouter(prefix="/api", tags=["catalogue"])

@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    return [category(x) for x in db.scalars(select(Category).where(Category.is_active).order_by(Category.display_order)).all()]

@router.get("/categories/{slug}")
def category_detail(slug: str, db: Session = Depends(get_db)):
    item = db.scalar(select(Category).where(Category.slug == slug, Category.is_active))
    if not item: raise HTTPException(404, "Category not found")
    return {**category(item), "products": [product(p) for p in db.scalars(select(Product).where(Product.category_id == item.id, Product.is_active)).all()]}

@router.get("/products")
def products(q: str | None = None, category_slug: str | None = None, featured: bool | None = None, db: Session = Depends(get_db)):
    stmt = select(Product).where(Product.is_active)
    if q: stmt = stmt.where(or_(Product.name.ilike(f"%{q}%"), Product.description.ilike(f"%{q}%"), Product.sku.ilike(f"%{q}%")))
    if category_slug: stmt = stmt.join(Category).where(Category.slug == category_slug)
    if featured is not None: stmt = stmt.where(Product.is_featured == featured)
    return [product(x) for x in db.scalars(stmt.order_by(Product.id.desc())).all()]

@router.get("/products/search")
def search_products(q: str = Query(min_length=1), db: Session = Depends(get_db)):
    return products(q=q, db=db)

@router.get("/products/{slug}")
def product_detail(slug: str, db: Session = Depends(get_db)):
    item = db.scalar(select(Product).where(Product.slug == slug, Product.is_active))
    if not item: raise HTTPException(404, "Product not found")
    return product(item)

@router.get("/payment-methods")
def payment_methods(db: Session = Depends(get_db)):
    return [{"id": x.id, "name": x.name, "description": x.description, "instructions": x.instructions} for x in db.scalars(select(PaymentMethod).where(PaymentMethod.is_active)).all()]

@router.get("/delivery-methods")
def delivery_methods(db: Session = Depends(get_db)):
    return [{"id": x.id, "name": x.name, "description": x.description, "fee": float(x.fee), "estimated_days": x.estimated_days} for x in db.scalars(select(DeliveryMethod).where(DeliveryMethod.is_active)).all()]

@router.post("/admin/categories", status_code=201)
def create_category(data: CategoryIn, db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "super_admin"))):
    item = Category(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return category(item)

@router.post("/admin/products", status_code=201)
def create_product(data: ProductIn, db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "super_admin"))):
    if not db.get(Category, data.category_id): raise HTTPException(400, "Invalid category")
    item = Product(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return product(item)

@router.put("/admin/products/{product_id}")
def update_product(product_id: int, data: ProductIn, db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "super_admin"))):
    item = db.get(Product, product_id)
    if not item: raise HTTPException(404, "Product not found")
    for key, value in data.model_dump().items(): setattr(item, key, value)
    db.commit(); db.refresh(item); return product(item)

