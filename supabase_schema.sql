-- Supabase SQL: Create tables for FarmFlow
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm settings table
CREATE TABLE IF NOT EXISTS farm_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    crop_type TEXT DEFAULT 'corn',
    field_size FLOAT DEFAULT 10.0,
    tank_capacity FLOAT DEFAULT 50000.0,
    daily_water_need FLOAT DEFAULT 7.0,
    used_water FLOAT DEFAULT 0.0,
    soil_moisture FLOAT DEFAULT 65.0,
    sensor_online BOOLEAN DEFAULT TRUE,
    pump_active BOOLEAN DEFAULT FALSE,
    soil_type TEXT DEFAULT 'loam',
    irrigation_source TEXT DEFAULT 'tank',
    flow_rate FLOAT DEFAULT 5000.0,
    pump_run_time FLOAT DEFAULT 0.0,
    esp_ip TEXT DEFAULT '192.168.4.1',
    rain_expected BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    water_used FLOAT DEFAULT 0.0,
    pump_run_time FLOAT DEFAULT 0.0,
    soil_moisture FLOAT,
    action TEXT
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow our serverless functions to access data
-- (Using service role key bypasses RLS, so this is for future frontend direct access)
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Farm settings access" ON farm_settings FOR ALL USING (true);
CREATE POLICY "Usage logs access" ON usage_logs FOR ALL USING (true);
