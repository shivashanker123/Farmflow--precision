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

-- Chat messages table for AI conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IoT Devices table (owned by users)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Soil Sensor',
    secret TEXT DEFAULT gen_random_uuid()::text,  -- SECURITY: Device authentication secret
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sensor readings table (from ESP8266 devices)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    soil_moisture INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_readings_device ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_readings_time ON sensor_readings(created_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow our serverless functions to access data
-- (Using service role key bypasses RLS, so this is for future frontend direct access)
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Farm settings access" ON farm_settings FOR ALL USING (true);
CREATE POLICY "Usage logs access" ON usage_logs FOR ALL USING (true);
CREATE POLICY "Devices access" ON devices FOR ALL USING (true);
CREATE POLICY "Sensor readings access" ON sensor_readings FOR ALL USING (true);

