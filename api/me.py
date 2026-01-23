"""
Vercel Serverless Function: Get Current User
GET /api/me
"""

from flask import Flask, request, jsonify
import os

app = Flask(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "farmflow-secret")

def get_supabase():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def decode_jwt(token: str):
    import jwt
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")
    except:
        return None

@app.route('/api/me', methods=['GET', 'OPTIONS'])
def handler():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"detail": "Missing authorization"}), 401
        
        token = auth_header.replace('Bearer ', '')
        user_id = decode_jwt(token)
        
        if not user_id:
            return jsonify({"detail": "Invalid token"}), 401
        
        supabase = get_supabase()
        result = supabase.table("users").select("id, email, name, created_at").eq("id", user_id).execute()
        
        if not result.data:
            return jsonify({"detail": "User not found"}), 404
        
        response = jsonify(result.data[0])
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 200
            
    except Exception as e:
        return jsonify({"detail": str(e)}), 500
