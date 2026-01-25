from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

class handler(BaseHTTPRequestHandler):
    """
    Device Management Endpoint
    
    GET  /api/devices - List user's devices
    POST /api/devices - Register a new device
    DELETE /api/devices?id=xxx - Remove a device
    """
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
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
        """List all devices for the authenticated user"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            result = supabase.table("devices") \
                .select("*") \
                .eq("user_id", int(user_id)) \
                .order("created_at", desc=True) \
                .execute()
            
            self._send_json({"devices": result.data or []}, 200)
            
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def do_POST(self):
        """Register a new device for the authenticated user"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            device_name = data.get("name", "Soil Sensor")
            
            from supabase import create_client
            import uuid
            import secrets
            
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Generate UUID for the device
            device_id = str(uuid.uuid4())
            # Generate a secure secret for device authentication
            device_secret = secrets.token_urlsafe(16)
            
            device = {
                "id": device_id,
                "user_id": int(user_id),
                "name": device_name,
                "secret": device_secret  # SECURITY: Device secret for authentication
            }
            
            result = supabase.table("devices").insert(device).execute()
            
            if result.data:
                self._send_json({
                    "device": result.data[0],
                    "secret": device_secret,  # Return secret to user (shown only once!)
                    "message": "Device registered! Copy device_id AND secret to your Arduino code. Secret is shown only once!"
                }, 201)
            else:
                self._send_json({"detail": "Failed to create device"}, 500)
            
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def do_DELETE(self):
        """Delete a device"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            # Parse device_id from query string
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            device_id = params.get("id", [None])[0]
            
            if not device_id:
                self._send_json({"detail": "Device ID required"}, 400)
                return
            
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Verify device belongs to user before deleting
            result = supabase.table("devices") \
                .delete() \
                .eq("id", device_id) \
                .eq("user_id", int(user_id)) \
                .execute()
            
            self._send_json({"status": "deleted"}, 200)
            
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
