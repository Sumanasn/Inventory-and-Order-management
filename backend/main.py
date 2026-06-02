from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import engine, Base, get_db

# Create the database tables automatically on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory and Order Management System")

# ==========================================
# PRODUCT ENDPOINTS (Ref: Section 3.1)
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
# CUSTOMER ENDPOINTS (Ref: Section 3.2)
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
# ORDER ENDPOINTS (Ref: Section 3.3)
# ==========================================
@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Verify the customer actually exists
    customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer reference not found")
    
    total_amount = 0.0
    order_items_to_create = []
    products_to_update = []

    # 2. Process items and validate inventory levels in a single operation
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for product '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )
        
        # Calculate pricing logic safely
        total_amount += product.price * item.quantity
        
        # Deduct from stock safely
        product.quantity -= item.quantity
        products_to_update.append(product)
        
        # Stage the order line item data
        order_items_to_create.append(models.OrderItem(product_id=item.product_id, quantity=item.quantity))

    # 3. Create the parent order database row
    new_order = models.Order(customer_id=order_data.customer_id, total_amount=total_amount)
    db.add(new_order)
    db.flush() # Flushes order to database to populate new_order.id without committing yet

    # 4. Bind the order ID to items and save them
    for order_item in order_items_to_create:
        order_item.order_id = new_order.id
        db.add(order_item)

    # 5. Execute transaction atomically to save everything securely together
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
