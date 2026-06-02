import requests

BASE_URL = "http://localhost:8080"

def test_system_integration():
    print("🚀 Starting Full-Stack Integration Test...\n")

    # 1. Create a Test Customer
    print("👥 Step 1: Creating Customer...")
    customer_payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "+1234567890"
    }
    customer_res = requests.post(f"{BASE_URL}/customers", json=customer_payload)
    if customer_res.status_code == 201:
        customer_id = customer_res.json()["id"]
        print(f"✅ Customer Created Successfully! ID: {customer_id}")
    else:
        print(f"❌ Failed to create customer: {customer_res.text}")
        return

    # 2. Create Two Test Products
    print("\n📦 Step 2: Creating Products...")
    p1_payload = {"name": "Wireless Mouse", "sku": "MS-WRLS-01", "price": 25.99, "quantity": 50}
    p2_payload = {"name": "Mechanical Keyboard", "sku": "KB-MECH-02", "price": 89.99, "quantity": 10}
    
    p1_res = requests.post(f"{BASE_URL}/products", json=p1_payload)
    p2_res = requests.post(f"{BASE_URL}/products", json=p2_payload)
    
    p1_id = p1_res.json()["id"]
    p2_id = p2_res.json()["id"]
    print(f"✅ Product 1 Created! ID: {p1_id} (Stock: 50)")
    print(f"✅ Product 2 Created! ID: {p2_id} (Stock: 10)")

    # 3. Place a successful order (Reduces stock)
    print("\n🛒 Step 3: Placing a Valid Order...")
    order_payload = {
        "customer_id": customer_id,
        "items": [
            {"product_id": p1_id, "quantity": 2},  # Should leave 48
            {"product_id": p2_id, "quantity": 1}   # Should leave 9
        ]
    }
    order_res = requests.post(f"{BASE_URL}/orders", json=order_payload)
    if order_res.status_code == 201:
        order_data = order_res.json()
        print(f"✅ Order Placed! ID: {order_data['id']} | Calculated Total: ${order_data['total_amount']}")
    else:
        print(f"❌ Order failed: {order_res.text}")

    # 4. Attempt to break stock restrictions (Should be rejected with a 400 Error)
    print("\n🛑 Step 4: Testing Stock Guardrails (Attempting to over-order Keyboard)...")
    bad_order_payload = {
        "customer_id": customer_id,
        "items": [
            {"product_id": p2_id, "quantity": 15}  # Only 9 available right now!
        ]
    }
    bad_order_res = requests.post(f"{BASE_URL}/orders", json=bad_order_payload)
    if bad_order_res.status_code == 400:
        print(f"✅ Guardrail Working! Order rejected exactly as expected: {bad_order_res.json()['detail']}")
    else:
        print(f"❌ Bug Found! System allowed over-ordering items: Status code {bad_order_res.status_code}")

if __name__ == "__main__":
    test_system_integration()
