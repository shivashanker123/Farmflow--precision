"""
Vercel Serverless Function: User Login
POST /api/login
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import hashlib
from datetime import datetime, timedelta

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "farmflow-secret")

def get_supabase() -> Client:
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

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            email = data.get("email")
            password = data.get("password")
            
            if not email or not password:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Missing email or password"}).encode())
                return
            
            supabase = get_supabase()
            
            # Find user
            result = supabase.table("users").select("*").eq("email", email).execute()
            
            if not result.data:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Invalid email or password"}).encode())
                return
            
            user = result.data[0]
            
            if not verify_password(password, user["hashed_password"]):
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Invalid email or password"}).encode())
                return
            
            token = create_jwt(user["id"])
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "access_token": token,
                "token_type": "bearer"
            }).encode())
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
