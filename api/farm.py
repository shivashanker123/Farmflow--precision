from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def _get_user_id(self):
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header.replace('Bearer ', '')
        import jwt
        jwt_secret = os.getenv("JWT_SECRET_KEY", "farmflow-secret")
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            return payload.get("sub")
        except:
            return None
    
    def do_GET(self):
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            result = supabase.table("farm_settings").select("*").eq("user_id", int(user_id)).execute()
            
            if result.data:
                self._send_json(result.data[0], 200)
            else:
                default = {"user_id": int(user_id), "crop_type": "corn", "field_size": 10}
                supabase.table("farm_settings").insert(default).execute()
                self._send_json(default, 200)
                
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def do_PUT(self):
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            print(f"PUT /api/farm - user_id: {user_id}")
            print(f"PUT /api/farm - data: {data}")
            
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            result = supabase.table("farm_settings").update(data).eq("user_id", int(user_id)).execute()
            print(f"PUT /api/farm - result: {result.data}")
            self._send_json(result.data[0] if result.data else data, 200)
                
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
