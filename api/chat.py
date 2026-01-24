from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
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
        """Get chat history for the user"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Get last 50 messages for context
            result = supabase.table("chat_messages") \
                .select("*") \
                .eq("user_id", int(user_id)) \
                .order("created_at", desc=False) \
                .limit(50) \
                .execute()
            
            self._send_json({"messages": result.data or []}, 200)
            
        except Exception as e:
            self._send_json({"detail": str(e)}, 500)
    
    def do_POST(self):
        """Send a message to AI and get response"""
        user_id = self._get_user_id()
        if not user_id:
            self._send_json({"detail": "Unauthorized"}, 401)
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            user_message = data.get("message", "").strip()
            if not user_message:
                self._send_json({"detail": "Message is required"}, 400)
                return
            
            from supabase import create_client
            supabase_url = os.getenv("SUPABASE_URL", "")
            supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
            supabase = create_client(supabase_url, supabase_key)
            
            # Get recent chat history for context
            history_result = supabase.table("chat_messages") \
                .select("role, content") \
                .eq("user_id", int(user_id)) \
                .order("created_at", desc=True) \
                .limit(10) \
                .execute()
            
            # Build messages for Groq (reverse to chronological order)
            messages = []
            
            # System prompt
            system_prompt = """You are a helpful AI farming assistant for FarmFlow, a precision agriculture platform.
You help farmers with irrigation, crop management, and agricultural advice.
Keep your responses conversational, concise (2-4 sentences), and helpful.
Focus on practical farming advice about water management, crop health, and irrigation timing."""
            
            messages.append({"role": "system", "content": system_prompt})
            
            # Add history (reversed to chronological)
            if history_result.data:
                for msg in reversed(history_result.data):
                    messages.append({"role": msg["role"], "content": msg["content"]})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Call Groq API
            from groq import Groq
            groq_key = os.getenv("GROQ_API_KEY", "")
            if not groq_key:
                self._send_json({"detail": "GROQ_API_KEY not configured"}, 500)
                return
            
            client = Groq(api_key=groq_key)
            
            chat_completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=300,
            )
            
            assistant_response = chat_completion.choices[0].message.content.strip()
            
            # Save both messages to database
            supabase.table("chat_messages").insert({
                "user_id": int(user_id),
                "role": "user",
                "content": user_message,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            
            supabase.table("chat_messages").insert({
                "user_id": int(user_id),
                "role": "assistant",
                "content": assistant_response,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            
            self._send_json({
                "response": assistant_response,
                "role": "assistant"
            }, 200)
            
        except Exception as e:
            print(f"Chat error: {str(e)}")
            self._send_json({"detail": str(e)}, 500)
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
