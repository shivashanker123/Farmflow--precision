"""
SQLAlchemy models for FarmFlow.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class SoilType(str, enum.Enum):
    sandy = "sandy"
    clay = "clay"
    loam = "loam"
    black = "black"


class IrrigationSource(str, enum.Enum):
    tank = "tank"
    borewell = "borewell"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    farm_settings = relationship("FarmSettings", back_populates="user", uselist=False)
    usage_logs = relationship("UsageLog", back_populates="user")


class FarmSettings(Base):
    __tablename__ = "farm_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Farm configuration
    crop_type = Column(String, default="corn")
    field_size = Column(Float, default=10.0)  # acres
    tank_capacity = Column(Float, default=50000.0)  # liters
    daily_water_need = Column(Float, default=7.0)  # mm/day
    
    # Current state
    used_water = Column(Float, default=0.0)  # liters
    soil_moisture = Column(Float, default=65.0)  # percentage
    sensor_online = Column(Boolean, default=True)
    pump_active = Column(Boolean, default=False)
    
    # Additional config
    soil_type = Column(String, default="loam")
    irrigation_source = Column(String, default="tank")
    flow_rate = Column(Float, default=5000.0)  # liters/hour
    pump_run_time = Column(Float, default=0.0)  # hours
    esp_ip = Column(String, default="192.168.4.1")
    rain_expected = Column(Boolean, default=False)
    
    # ===== NEW: Smart Irrigation Fields =====
    
    # Crop Lifecycle
    crop_duration = Column(Integer, default=90)  # Days from sowing to harvest
    crop_start_date = Column(DateTime(timezone=True))  # When crop was planted
    today_water_used = Column(Float, default=0.0)  # Daily usage (resets daily)
    
    # Sensor Health
    last_sensor_reading = Column(DateTime(timezone=True))  # For health check
    sensor_health = Column(String, default="healthy")  # healthy/stale/failed
    manual_override_active = Column(Boolean, default=False)  # Farmer override
    
    # Rainfall Tracking
    rainfall_today = Column(Float, default=0.0)  # mm recorded today
    last_rainfall_date = Column(DateTime(timezone=True))  # Last rain date
    rainfall_credited = Column(Float, default=0.0)  # mm credited to budget
    
    # Impact Tracking
    total_water_saved = Column(Float, default=0.0)  # Cumulative savings
    skipped_irrigation_count = Column(Integer, default=0)  # Skip decisions
    deficit_irrigation_count = Column(Integer, default=0)  # Partial irrigations
    full_irrigation_count = Column(Integer, default=0)  # Full irrigations
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="farm_settings")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    water_used = Column(Float, default=0.0)  # liters
    pump_run_time = Column(Float, default=0.0)  # hours
    soil_moisture = Column(Float)  # percentage at time of log
    action = Column(String)  # e.g., "irrigation", "pump_on", "pump_off"

    # Relationships
    user = relationship("User", back_populates="usage_logs")
