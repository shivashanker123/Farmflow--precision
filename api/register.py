"""
Vercel Serverless Function: User Registration
POST /api/register
"""

from flask import Flask, request, jsonify
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta

app = Flask(__name__)

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "farmflow-secret")

def get_supabase():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"

def create_jwt(user_id: int) -> str:
    import jwt
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def handler():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        data = request.get_json()
        
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")
        
        if not email or not password or not name:
            return jsonify({"detail": "Missing required fields"}), 400
        
        supabase = get_supabase()
        
        # Check if user exists
        existing = supabase.table("users").select("*").eq("email", email).execute()
        if existing.data:
            return jsonify({"detail": "Email already registered"}), 400
        
        # Create user
        hashed = hash_password(password)
        result = supabase.table("users").insert({
            "email": email,
            "hashed_password": hashed,
            "name": name,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        user = result.data[0] if result.data else None
        
        if user:
            # Create default farm settings
            supabase.table("farm_settings").insert({
                "user_id": user["id"]
            }).execute()
            
            response = jsonify({
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "created_at": user["created_at"]
            })
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response, 201
        else:
            return jsonify({"detail": "Failed to create user"}), 500
            
    except Exception as e:
        return jsonify({"detail": str(e)}), 500
