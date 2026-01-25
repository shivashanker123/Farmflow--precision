from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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
        """Fetch usage logs for the authenticated user"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Fetch last 100 logs ordered by timestamp
            result = supabase.table("usage_logs") \
                .select("*") \
                .eq("user_id", int(user_id)) \
                .order("timestamp", desc=True) \
                .limit(100) \
                .execute()
            
            logs = result.data or []
            
            # Calculate aggregates
            total_water = sum(log.get("water_used", 0) or 0 for log in logs)
            total_pump_time = sum(log.get("pump_run_time", 0) or 0 for log in logs)
            moisture_readings = [log.get("soil_moisture") for log in logs if log.get("soil_moisture") is not None]
            avg_moisture = sum(moisture_readings) / len(moisture_readings) if moisture_readings else 0
            
            self._send_json({
                "logs": logs,
                "summary": {
                    "total_water_used": round(total_water, 2),
                    "total_pump_hours": round(total_pump_time, 2),
                    "avg_soil_moisture": round(avg_moisture, 1),
                    "total_events": len(logs)
                }
            }, 200)
            
        except Exception as e:
            print(f"Logs error: {str(e)}")
            self._send_json({"detail": str(e)}, 500)
    
    def do_POST(self):
        """Create a new usage log entry"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            from supabase import create_client
            from datetime import datetime
            
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Create log entry
            log_entry = {
                "user_id": int(user_id),
                "water_used": data.get("water_used", 0),
                "pump_run_time": data.get("pump_run_time", 0),
                "soil_moisture": data.get("soil_moisture"),
                "action": data.get("action", "manual_entry"),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("usage_logs").insert(log_entry).execute()
            self._send_json(result.data[0] if result.data else log_entry, 201)
            
        except Exception as e:
            print(f"Log create error: {str(e)}")
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
