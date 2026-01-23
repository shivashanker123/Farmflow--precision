"""
Vercel Serverless Function: Farm Settings CRUD
GET/PUT /api/farm
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

def get_user_id():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.replace('Bearer ', '')
    return decode_jwt(token)

@app.route('/api/farm', methods=['GET', 'PUT', 'OPTIONS'])
def handler():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 200
    
    user_id = get_user_id()
    if not user_id:
        return jsonify({"detail": "Unauthorized"}), 401
    
    supabase = get_supabase()
    
    try:
        if request.method == 'GET':
            result = supabase.table("farm_settings").select("*").eq("user_id", user_id).execute()
            
            if result.data:
                response = jsonify(result.data[0])
            else:
                default = {"user_id": user_id, "crop_type": "corn", "field_size": 10}
                supabase.table("farm_settings").insert(default).execute()
                response = jsonify(default)
            
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response, 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            result = supabase.table("farm_settings").update(data).eq("user_id", user_id).execute()
            
            response = jsonify(result.data[0] if result.data else data)
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response, 200
            
    except Exception as e:
        return jsonify({"detail": str(e)}), 500
