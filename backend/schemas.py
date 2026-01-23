"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ============ User Schemas ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ============ Farm Schemas ============

class FarmSettingsBase(BaseModel):
    crop_type: str = "corn"
    field_size: float = 10.0
    tank_capacity: float = 50000.0
    daily_water_need: float = 7.0
    used_water: float = 0.0
    soil_moisture: float = 65.0
    sensor_online: bool = True
    pump_active: bool = False
    soil_type: str = "loam"
    irrigation_source: str = "tank"
    flow_rate: float = 5000.0
    pump_run_time: float = 0.0
    esp_ip: str = "192.168.4.1"
    rain_expected: bool = False


class FarmSettingsCreate(FarmSettingsBase):
    pass


class FarmSettingsUpdate(BaseModel):
    crop_type: Optional[str] = None
    field_size: Optional[float] = None
    tank_capacity: Optional[float] = None
    daily_water_need: Optional[float] = None
    used_water: Optional[float] = None
    soil_moisture: Optional[float] = None
    sensor_online: Optional[bool] = None
    pump_active: Optional[bool] = None
    soil_type: Optional[str] = None
    irrigation_source: Optional[str] = None
    flow_rate: Optional[float] = None
    pump_run_time: Optional[float] = None
    esp_ip: Optional[str] = None
    rain_expected: Optional[bool] = None


class FarmSettingsResponse(FarmSettingsBase):
    id: int
    user_id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Usage Log Schemas ============

class UsageLogCreate(BaseModel):
    water_used: float = 0.0
    pump_run_time: float = 0.0
    soil_moisture: Optional[float] = None
    action: Optional[str] = None


class UsageLogResponse(BaseModel):
    id: int
    user_id: int
    timestamp: datetime
    water_used: float
    pump_run_time: float
    soil_moisture: Optional[float]
    action: Optional[str]

    class Config:
        from_attributes = True
