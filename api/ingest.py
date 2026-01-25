from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    """
    ESP8266 Device Ingestion Endpoint
    
    This endpoint receives sensor data from IoT devices.
    No authentication required - devices identify themselves by device_id.
    """
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            device_id = data.get("device_id")
            soil_moisture = data.get("soil_moisture")
            
            # Validate payload
            if not device_id:
                self._send_json({"error": "device_id is required"}, 400)
                return
            
            if soil_moisture is None:
                self._send_json({"error": "soil_moisture is required"}, 400)
                return
            
            # Connect to Supabase
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Verify device exists
            device_result = supabase.table("devices").select("id").eq("id", device_id).execute()
            
            if not device_result.data:
                self._send_json({"error": "Device not found"}, 401)
                return
            
            # Insert sensor reading
            from datetime import datetime
            reading = {
                "device_id": device_id,
                "soil_moisture": int(soil_moisture),
                "created_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("sensor_readings").insert(reading).execute()
            
            print(f"Ingested: device={device_id}, moisture={soil_moisture}")
            self._send_json({"status": "ok"}, 200)
            
        except Exception as e:
            print(f"Ingest error: {str(e)}")
            self._send_json({"error": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
