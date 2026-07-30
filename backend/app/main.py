import re
from flask import Flask, request, jsonify
from flask_cors import CORS

from app.config import settings
from app.db import Base, engine, get_db
from app import crud, models
from app.crud import APIException

# Initialize database tables on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Table creation skipped or already completed: {e}")


app = Flask("Inventory & Order Management System API")

# Set CORS
CORS(app, resources={r"/*": {
    "origins": settings.CORS_ORIGINS,
    "supports_credentials": True,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    "allow_headers": ["*"]
}})


# --- Error Handlers & Health Check ---
from werkzeug.exceptions import HTTPException

@app.route("/", methods=["GET", "HEAD"])
def read_root():
    return jsonify({"status": "healthy", "message": "Inventory & Order Management API is running"}), 200

@app.errorhandler(APIException)
def handle_api_exception(e):
    return jsonify({"detail": e.detail}), e.status_code

@app.errorhandler(Exception)
def handle_general_exception(e):
    if isinstance(e, HTTPException):
        return jsonify({"detail": e.description}), e.code
    import traceback
    traceback.print_exc()
    return jsonify({"detail": str(e)}), 500


# --- Serialization Helpers (replacing Pydantic Out models) ---
def product_to_dict(p):
    if p is None:
        return None
    return {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "description": p.description or "",
        "price": float(p.price) if p.price is not None else 0.0,
        "quantity": int(p.quantity) if p.quantity is not None else 0
    }

def customer_to_dict(c):
    if c is None:
        return None
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone or ""
    }

def order_to_dict(o):
    if o is None:
        return None
    return {
        "id": o.id,
        "customer_id": o.customer_id,
        "total_amount": float(o.total_amount) if o.total_amount is not None else 0.0,
        "created_at": o.created_at.strftime("%a, %d %b %Y %H:%M:%S GMT") if o.created_at else None,
        "customer": customer_to_dict(o.customer),
        "items": [{
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_order": float(item.price_at_order) if item.price_at_order is not None else 0.0,
            "product": product_to_dict(item.product)
        } for item in o.items]
    }


# --- Validation Helpers (replacing Pydantic Create/Update models) ---
def validate_email(email):
    return bool(re.match(r"^[^@]+@[^@]+\.[^@]+$", email))

def validate_phone(phone):
    if not phone:
        return True
    digits = "".join([c for c in phone if c.isdigit()])
    return len(digits) in (10, 12)

def get_request_json():
    try:
        return request.get_json(silent=True) or {}
    except Exception:
        raise APIException(status_code=400, detail="Invalid JSON format")

def validate_product_payload(data, is_update=False):
    errors = []
    
    if not is_update:
        sku = data.get("sku")
        if not sku or not isinstance(sku, str) or len(sku.strip()) < 1:
            errors.append("sku: Unique SKU code is required")
        
        name = data.get("name")
        if not name or not isinstance(name, str) or len(name.strip()) < 1:
            errors.append("name: Name is required")
            
        price = data.get("price")
        if price is None or not isinstance(price, (int, float)) or price < 0:
            errors.append("price: Price must be a non-negative number")
            
        quantity = data.get("quantity")
        if quantity is None or not isinstance(quantity, int) or quantity < 0:
            errors.append("quantity: Quantity must be a non-negative integer")
    else:
        if "sku" in data:
            sku = data["sku"]
            if not sku or not isinstance(sku, str) or len(sku.strip()) < 1:
                errors.append("sku: SKU code cannot be empty")
        if "name" in data:
            name = data["name"]
            if not name or not isinstance(name, str) or len(name.strip()) < 1:
                errors.append("name: Name cannot be empty")
        if "price" in data:
            price = data["price"]
            if price is None or not isinstance(price, (int, float)) or price < 0:
                errors.append("price: Price must be a non-negative number")
        if "quantity" in data:
            quantity = data["quantity"]
            if quantity is None or not isinstance(quantity, int) or quantity < 0:
                errors.append("quantity: Quantity must be a non-negative integer")

    if errors:
        raise APIException(status_code=422, detail="; ".join(errors))
    
    valid_keys = ["sku", "name", "description", "price", "quantity"]
    return {k: data[k] for k in valid_keys if k in data}

def validate_customer_payload(data, is_update=False):
    errors = []
    
    if not is_update:
        name = data.get("name")
        if not name or not isinstance(name, str) or len(name.strip()) < 1:
            errors.append("name: Name is required")
            
        email = data.get("email")
        if not email or not isinstance(email, str) or not validate_email(email):
            errors.append("email: A valid email address is required")
            
        phone = data.get("phone")
        if phone is not None and not validate_phone(phone):
            errors.append("phone: Phone number must be 10 or 12 digits")
    else:
        if "name" in data:
            name = data["name"]
            if not name or not isinstance(name, str) or len(name.strip()) < 1:
                errors.append("name: Name cannot be empty")
        if "email" in data:
            email = data["email"]
            if not email or not isinstance(email, str) or not validate_email(email):
                errors.append("email: A valid email address is required")
        if "phone" in data:
            phone = data["phone"]
            if phone is not None and not validate_phone(phone):
                errors.append("phone: Phone number must be 10 or 12 digits")
                
    if errors:
        raise APIException(status_code=422, detail="; ".join(errors))
        
    valid_keys = ["name", "email", "phone"]
    return {k: data[k] for k in valid_keys if k in data}

def validate_order_payload(data):
    errors = []
    
    customer_id = data.get("customer_id")
    if customer_id is None or not isinstance(customer_id, int):
        errors.append("customer_id: Valid customer_id is required")
        
    items = data.get("items")
    if not items or not isinstance(items, list):
        errors.append("items: Order must contain at least one item")
    else:
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                errors.append(f"items[{idx}]: Item must be a JSON object")
                continue
            
            product_id = item.get("product_id")
            if product_id is None or not isinstance(product_id, int):
                errors.append(f"items[{idx}].product_id: product_id must be an integer")
                
            quantity = item.get("quantity")
            if quantity is None or not isinstance(quantity, int) or quantity <= 0:
                errors.append(f"items[{idx}].quantity: quantity must be an integer greater than 0")
                
    if errors:
        raise APIException(status_code=422, detail="; ".join(errors))
        
    return {
        "customer_id": customer_id,
        "items": [{"product_id": item["product_id"], "quantity": item["quantity"]} for item in items]
    }


# --- Dashboard API ---
@app.route("/dashboard", methods=["GET"])
def get_dashboard_stats():
    with get_db() as db:
        total_products = db.query(models.Product).count()
        total_customers = db.query(models.Customer).count()
        total_orders = db.query(models.Order).count()
        
        # Low stock definition: quantity < 10
        low_stock_products = db.query(models.Product).filter(models.Product.quantity < 10).all()
        
        return jsonify({
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "low_stock_products": [product_to_dict(p) for p in low_stock_products]
        })


# --- Products APIs ---
@app.route("/products", methods=["POST"])
def create_product():
    raw_data = get_request_json()
    validated_data = validate_product_payload(raw_data, is_update=False)
    with get_db() as db:
        db_product = crud.create_product(db, validated_data)
        return jsonify(product_to_dict(db_product)), 201

@app.route("/products", methods=["GET"])
def get_products():
    with get_db() as db:
        products = crud.get_products(db)
        return jsonify([product_to_dict(p) for p in products])

@app.route("/products/<int:id>", methods=["GET"])
def get_product(id: int):
    with get_db() as db:
        db_product = crud.get_product(db, id)
        if not db_product:
            raise APIException(
                status_code=404,
                detail="Product not found"
            )
        return jsonify(product_to_dict(db_product))

@app.route("/products/<int:id>", methods=["PUT"])
def update_product(id: int):
    raw_data = get_request_json()
    validated_data = validate_product_payload(raw_data, is_update=True)
    with get_db() as db:
        db_product = crud.update_product(db, id, validated_data)
        return jsonify(product_to_dict(db_product))

@app.route("/products/<int:id>", methods=["DELETE"])
def delete_product(id: int):
    with get_db() as db:
        db_product = crud.delete_product(db, id)
        return jsonify(product_to_dict(db_product))


# --- Customers APIs ---
@app.route("/customers", methods=["POST"])
def create_customer():
    raw_data = get_request_json()
    validated_data = validate_customer_payload(raw_data, is_update=False)
    with get_db() as db:
        db_customer = crud.create_customer(db, validated_data)
        return jsonify(customer_to_dict(db_customer)), 201

@app.route("/customers", methods=["GET"])
def get_customers():
    with get_db() as db:
        customers = crud.get_customers(db)
        return jsonify([customer_to_dict(c) for c in customers])

@app.route("/customers/<int:id>", methods=["GET"])
def get_customer(id: int):
    with get_db() as db:
        db_customer = crud.get_customer(db, id)
        if not db_customer:
            raise APIException(
                status_code=404,
                detail="Customer not found"
            )
        return jsonify(customer_to_dict(db_customer))

@app.route("/customers/<int:id>", methods=["DELETE"])
def delete_customer(id: int):
    with get_db() as db:
        db_customer = crud.delete_customer(db, id)
        return jsonify(customer_to_dict(db_customer))


# --- Orders APIs ---
@app.route("/orders", methods=["POST"])
def create_order():
    raw_data = get_request_json()
    validated_data = validate_order_payload(raw_data)
    with get_db() as db:
        db_order = crud.create_order(db, validated_data)
        return jsonify(order_to_dict(db_order)), 201

@app.route("/orders", methods=["GET"])
def get_orders():
    with get_db() as db:
        orders = crud.get_orders(db)
        return jsonify([order_to_dict(o) for o in orders])

@app.route("/orders/<int:id>", methods=["GET"])
def get_order(id: int):
    with get_db() as db:
        db_order = crud.get_order(db, id)
        if not db_order:
            raise APIException(
                status_code=404,
                detail="Order not found"
            )
        return jsonify(order_to_dict(db_order))

@app.route("/orders/<int:id>", methods=["DELETE"])
def delete_order(id: int):
    with get_db() as db:
        crud.delete_order(db, id)
        return jsonify({"message": "Order deleted successfully"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
