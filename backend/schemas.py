from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


# PRODUCT SCHEMAS 

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    sku: str = Field(..., min_length=3, max_length=50, description="SKU/code")
    price: float = Field(..., gt=0, description="Price")
    quantity: int = Field(..., ge=0, description="Quantity in stock")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=3, max_length=50)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# CUSTOMER SCHEMAS 

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ORDER SCHEMAS

class OrderItemBase(BaseModel):
    product_id: int = Field(..., description="Product reference")
    quantity: int = Field(..., gt=0, description="Quantity ordered")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="Customer reference")
    items: List[OrderItemCreate] = Field(..., min_items=1, description="Product reference(s) & Quantity ordered")

class OrderResponse(BaseModel):
    id: int
    customer_id: int = Field(..., description="Customer reference")
    total_amount: float = Field(..., description="Total amount")
    created_at: datetime
    items: List[OrderItemResponse] = Field(..., description="Product reference(s)")

    class Config:
        from_attributes = True
