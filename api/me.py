from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        try:
            auth_header = self.headers.get('Authorization', '')
            print(f"Auth header received: {auth_header[:50]}..." if len(auth_header) > 50 else f"Auth header: {auth_header}")
            
            if not auth_header.startswith('Bearer '):
                self._send_json({"detail": "Missing authorization"}, 401)
                return
            
            token = auth_header.replace('Bearer ', '')
            print(f"Token length: {len(token)}")
            
            import jwt
            jwt_secret = os.getenv("JWT_SECRET_KEY", "farmflow-secret")
            print(f"JWT secret (first 10 chars): {jwt_secret[:10]}...")
            try:
                payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
                user_id = payload.get("sub")
                print(f"Decoded user_id: {user_id}")
            except jwt.ExpiredSignatureError:
                print("ERROR: Token expired")
                self._send_json({"detail": "Token expired"}, 401)
                return
            except jwt.InvalidTokenError as e:
                print(f"ERROR: Invalid token - {str(e)}")
                self._send_json({"detail": f"Invalid token: {str(e)}"}, 401)
                return
            except Exception as e:
                print(f"ERROR: General exception - {str(e)}")
                self._send_json({"detail": f"Token error: {str(e)}"}, 401)
                return
            
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            result = supabase.table("users").select("id, email, name, created_at").eq("id", user_id).execute()
            
            if not result.data:
                self._send_json({"detail": "User not found"}, 404)
                return
            
            self._send_json(result.data[0], 200)
                
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
