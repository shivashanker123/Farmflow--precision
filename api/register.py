"""
Vercel Serverless Function: User Registration
POST /api/register
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta

# For Vercel, we'll use Supabase client directly
from supabase import create_client, Client

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "farmflow-secret")

def get_supabase() -> Client:
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

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            email = data.get("email")
            password = data.get("password")
            name = data.get("name")
            
            if not email or not password or not name:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Missing required fields"}).encode())
                return
            
            supabase = get_supabase()
            
            # Check if user exists
            existing = supabase.table("users").select("*").eq("email", email).execute()
            if existing.data:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Email already registered"}).encode())
                return
            
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
                
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "created_at": user["created_at"]
                }).encode())
            else:
                raise Exception("Failed to create user")
                
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
