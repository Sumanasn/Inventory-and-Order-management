from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import engine, Base, get_db

# Create the database tables automatically on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory and Order Management System")

# ==========================================
# PRODUCT ENDPOINTS 
# ==========================================
@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Check if a product with the same SKU already exists
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products", response_model=List[schemas.ProductResponse])
def get_all_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.get("/products/{id}", response_model=schemas.ProductResponse)
def get_product_by_id(id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.put("/products/{id}", response_model=schemas.ProductResponse)
def update_product(id: int, updated_product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product_query = db.query(models.Product).filter(models.Product.id == id)
    product = product_query.first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Exclude unset fields so we only modify what the user sent
    update_data = updated_product.model_dump(exclude_unset=True)
    
    # If updating SKU, check for uniqueness conflict
    if "sku" in update_data and update_data["sku"] != product.sku:
        sku_check = db.query(models.Product).filter(models.Product.sku == update_data["sku"]).first()
        if sku_check:
            raise HTTPException(status_code=400, detail="Product with this SKU already exists")

    product_query.update(update_data, synchronize_session=False)
    db.commit()
    db.refresh(product)
    return product

@app.delete("/products/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return None


# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================
@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    # Check if a customer with the same email already exists
    db_customer = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if db_customer:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    
    new_customer = models.Customer(**customer.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@app.get("/customers", response_model=List[schemas.CustomerResponse])
def get_all_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()

@app.get("/customers/{id}", response_model=schemas.CustomerResponse)
def get_customer_by_id(id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.delete("/customers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return None


# ==========================================
# ORDER ENDPOINTS
# ==========================================
@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Verify customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # 2. First pass: Validate stock availability AND compute total order price
    computed_total_amount = 0.0
    
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        
        # Guardrail check for stock availability
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for product '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )
        
        # Accumulate the calculation: (Item Price * Requested Quantity)
        computed_total_amount += product.price * item.quantity

    # 3. Create the master order record with its calculated total
    new_order = models.Order(
        customer_id=order.customer_id,
        total_amount=computed_total_amount  # Safe backend-calculated total
    )
    db.add(new_order)
    db.flush()  # Generates the new_order.id to link the child rows below

    # 4. Second pass: Deduct stock levels and save line items
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        
        # Safe structural stock reduction
        product.quantity -= item.quantity
        
        # Build individual line item history records
        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(order_item)
    
    # 5. Atomically save the complete transaction to PostgreSQL
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()

@app.get("/orders/{id}", response_model=schemas.OrderResponse)
def get_order_by_id(id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.delete("/orders/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(order)
    db.commit()
    return None
