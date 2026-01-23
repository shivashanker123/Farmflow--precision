from http.server import BaseHTTPRequestHandler
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            email = data.get("email")
            password = data.get("password")
            name = data.get("name")
            
            if not email or not password or not name:
                self._send_json({"detail": "Missing required fields"}, 400)
                return
            
            # Get Supabase client
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Check if user exists
            existing = supabase.table("users").select("*").eq("email", email).execute()
            if existing.data:
                self._send_json({"detail": "Email already registered"}, 400)
                return
            
            # Hash password
            salt = secrets.token_hex(16)
            hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
            hashed_password = f"{salt}:{hashed.hex()}"
            
            # Create user
            result = supabase.table("users").insert({
                "email": email,
                "hashed_password": hashed_password,
                "name": name,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            
            user = result.data[0] if result.data else None
            
            if user:
                # Create default farm settings
                supabase.table("farm_settings").insert({"user_id": user["id"]}).execute()
                
                self._send_json({
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "created_at": user["created_at"]
                }, 201)
            else:
                self._send_json({"detail": "Failed to create user"}, 500)
                
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
