from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

class handler(BaseHTTPRequestHandler):
    """
    Sensor Readings Endpoint
    
    GET /api/readings?device_id=xxx - Get readings for a specific device
    GET /api/readings - Get readings for all user's devices
    """
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
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
        """Get sensor readings for user's devices"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            # Parse device_id from query string (optional)
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            device_id = params.get("device_id", [None])[0]
            limit = int(params.get("limit", [100])[0])
            
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # First, get user's devices
            devices_result = supabase.table("devices") \
                .select("id") \
                .eq("user_id", int(user_id)) \
                .execute()
            
            user_device_ids = [d["id"] for d in (devices_result.data or [])]
            
            if not user_device_ids:
                self._send_json({"readings": [], "message": "No devices registered"}, 200)
                return
            
            # If specific device requested, verify ownership
            if device_id:
                if device_id not in user_device_ids:
                    self._send_json({"detail": "Device not found"}, 404)
                    return
                query_device_ids = [device_id]
            else:
                query_device_ids = user_device_ids
            
            # Fetch readings
            readings_result = supabase.table("sensor_readings") \
                .select("*, devices(name)") \
                .in_("device_id", query_device_ids) \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            
            readings = readings_result.data or []
            
            # Calculate summary stats
            if readings:
                moisture_values = [r["soil_moisture"] for r in readings]
                summary = {
                    "count": len(readings),
                    "avg_moisture": round(sum(moisture_values) / len(moisture_values), 1),
                    "min_moisture": min(moisture_values),
                    "max_moisture": max(moisture_values),
                    "latest_reading": readings[0] if readings else None
                }
            else:
                summary = {
                    "count": 0,
                    "avg_moisture": 0,
                    "min_moisture": 0,
                    "max_moisture": 0,
                    "latest_reading": None
                }
            
            self._send_json({
                "readings": readings,
                "summary": summary
            }, 200)
            
        except Exception as e:
            print(f"Readings error: {str(e)}")
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
