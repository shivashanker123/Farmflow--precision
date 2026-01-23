"""
Vercel Serverless Function: User Login
POST /api/login
"""

from flask import Flask, request, jsonify
import os
import hashlib
from datetime import datetime, timedelta

app = Flask(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "farmflow-secret")

def get_supabase():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        salt, stored_hash = hashed.split(":")
        new_hash = hashlib.pbkdf2_hmac('sha256', plain.encode(), salt.encode(), 100000)
        return new_hash.hex() == stored_hash
    except:
        return False

def create_jwt(user_id: int) -> str:
    import jwt
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

@app.route('/api/login', methods=['POST', 'OPTIONS'])
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
        
        if not email or not password:
            return jsonify({"detail": "Missing email or password"}), 400
        
        supabase = get_supabase()
        result = supabase.table("users").select("*").eq("email", email).execute()
        
        if not result.data:
            return jsonify({"detail": "Invalid email or password"}), 401
        
        user = result.data[0]
        
        if not verify_password(password, user["hashed_password"]):
            return jsonify({"detail": "Invalid email or password"}), 401
        
        token = create_jwt(user["id"])
        
        response = jsonify({
            "access_token": token,
            "token_type": "bearer"
        })
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 200
            
    except Exception as e:
        return jsonify({"detail": str(e)}), 500
