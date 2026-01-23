from http.server import BaseHTTPRequestHandler
import json
import os
import hashlib
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
            
            if not email or not password:
                self._send_json({"detail": "Missing email or password"}, 400)
                return
            
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Find user
            result = supabase.table("users").select("*").eq("email", email).execute()
            
            if not result.data:
                self._send_json({"detail": "Invalid email or password"}, 401)
                return
            
            user = result.data[0]
            
            # Verify password
            try:
                salt, stored_hash = user["hashed_password"].split(":")
                new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
                if new_hash.hex() != stored_hash:
                    self._send_json({"detail": "Invalid email or password"}, 401)
                    return
            except:
                self._send_json({"detail": "Invalid email or password"}, 401)
                return
            
            # Create JWT
            import jwt
            jwt_secret = os.getenv("JWT_SECRET_KEY", "farmflow-secret")
            token = jwt.encode({
                "sub": user["id"],
                "exp": datetime.utcnow() + timedelta(days=7)
            }, jwt_secret, algorithm="HS256")
            
            self._send_json({"access_token": token, "token_type": "bearer"}, 200)
                
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
