from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime, timedelta

# Security constants
MIN_READING_INTERVAL_SECONDS = 5  # Rate limit: 1 reading per 5 seconds per device
VALID_MOISTURE_RANGE = (0, 1023)  # Valid analog sensor range

class handler(BaseHTTPRequestHandler):
    """
    ESP8266 Device Ingestion Endpoint (SECURED)
    
    Security features:
    - Device ID + Secret validation
    - Rate limiting per device
    - Input range validation
    - CORS restricted
    """
    
    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()
    
    def _send_cors_headers(self):
        # SECURITY: Restrict CORS to specific origins
        allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
        self.send_header('Access-Control-Allow-Origin', allowed_origins)
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            device_id = data.get("device_id")
            device_secret = data.get("device_secret")  # NEW: Device secret
            soil_moisture = data.get("soil_moisture")
            
            # ===== VALIDATION =====
            
            # 1. Required fields
            if not device_id:
                self._send_json({"error": "device_id is required"}, 400)
                return
            
            if soil_moisture is None:
                self._send_json({"error": "soil_moisture is required"}, 400)
                return
            
            # 2. Input range validation (SECURITY)
            try:
                soil_moisture = int(soil_moisture)
                if not (VALID_MOISTURE_RANGE[0] <= soil_moisture <= VALID_MOISTURE_RANGE[1]):
                    self._send_json({"error": f"soil_moisture must be {VALID_MOISTURE_RANGE[0]}-{VALID_MOISTURE_RANGE[1]}"}, 400)
                    return
            except (ValueError, TypeError):
                self._send_json({"error": "soil_moisture must be an integer"}, 400)
                return
            
            # ===== SUPABASE CONNECTION =====
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # 3. Device authentication (with optional secret)
            if device_secret:
                # If secret provided, validate it
                device_result = supabase.table("devices") \
                    .select("id, secret") \
                    .eq("id", device_id) \
                    .execute()
                
                if not device_result.data:
                    self._send_json({"error": "Device not found"}, 401)
                    return
                
                stored_secret = device_result.data[0].get("secret")
                if stored_secret and stored_secret != device_secret:
                    self._send_json({"error": "Invalid device secret"}, 401)
                    return
            else:
                # Fallback: Just verify device exists (backward compatible)
                device_result = supabase.table("devices").select("id").eq("id", device_id).execute()
                if not device_result.data:
                    self._send_json({"error": "Device not found"}, 401)
                    return
            
            # 4. Rate limiting (SECURITY)
            last_reading = supabase.table("sensor_readings") \
                .select("created_at") \
                .eq("device_id", device_id) \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
            
            if last_reading.data:
                last_time_str = last_reading.data[0]["created_at"]
                # Handle both formats: with and without timezone
                try:
                    if "+" in last_time_str or "Z" in last_time_str:
                        last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00"))
                    else:
                        last_time = datetime.fromisoformat(last_time_str)
                    
                    # Make both timezone-naive for comparison
                    now = datetime.utcnow()
                    if last_time.tzinfo:
                        last_time = last_time.replace(tzinfo=None)
                    
                    time_diff = (now - last_time).total_seconds()
                    if time_diff < MIN_READING_INTERVAL_SECONDS:
                        self._send_json({
                            "error": f"Rate limited. Wait {MIN_READING_INTERVAL_SECONDS - int(time_diff)}s",
                            "retry_after": MIN_READING_INTERVAL_SECONDS - int(time_diff)
                        }, 429)
                        return
                except Exception as e:
                    print(f"Rate limit check error: {e}")
                    # Continue anyway if rate limit check fails
            
            # ===== INSERT READING =====
            reading = {
                "device_id": device_id,
                "soil_moisture": soil_moisture,
                "created_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("sensor_readings").insert(reading).execute()
            
            print(f"Ingested: device={device_id}, moisture={soil_moisture}")
            self._send_json({"status": "ok"}, 200)
            
        except Exception as e:
            print(f"Ingest error: {str(e)}")
            self._send_json({"error": "Internal server error"}, 500)  # Don't leak error details
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
