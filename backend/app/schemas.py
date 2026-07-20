from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class CategoryIn(BaseModel):
    name: str
    slug: str
    description: str = ""

class ProductIn(BaseModel):
    category_id: int
    name: str
    slug: str
    sku: str
    description: str = ""
    short_description: str = ""
    cost_price: Decimal = Decimal("0")
    selling_price: Decimal = Field(gt=0)
    discount_price: Decimal | None = None
    stock_quantity: int = Field(ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    image_url: str | None = None
    is_featured: bool = False

class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)

class CheckoutIn(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: EmailStr
    delivery_address: str
    city: str
    delivery_notes: str = ""
    payment_method_id: int
    delivery_method_id: int

class StatusIn(BaseModel):
    status: str

class ChatIn(BaseModel):
    message: str = Field(min_length=2, max_length=1000)

class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)

