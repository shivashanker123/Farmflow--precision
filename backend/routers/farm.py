"""
Farm data routes.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api/farm", tags=["farm"])


@router.get("", response_model=schemas.FarmSettingsResponse)
def get_farm_settings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get farm settings for the current user."""
    farm_settings = db.query(models.FarmSettings).filter(
        models.FarmSettings.user_id == current_user.id
    ).first()
    
    if not farm_settings:
        # Create default settings if none exist
        farm_settings = models.FarmSettings(user_id=current_user.id)
        db.add(farm_settings)
        db.commit()
        db.refresh(farm_settings)
    
    return farm_settings


@router.put("", response_model=schemas.FarmSettingsResponse)
def update_farm_settings(
    settings: schemas.FarmSettingsUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update farm settings for the current user."""
    farm_settings = db.query(models.FarmSettings).filter(
        models.FarmSettings.user_id == current_user.id
    ).first()
    
    if not farm_settings:
        farm_settings = models.FarmSettings(user_id=current_user.id)
        db.add(farm_settings)
    
    # Update only provided fields
    update_data = settings.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farm_settings, field, value)
    
    db.commit()
    db.refresh(farm_settings)
    return farm_settings


@router.post("/log", response_model=schemas.UsageLogResponse, status_code=status.HTTP_201_CREATED)
def create_usage_log(
    log: schemas.UsageLogCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Log water usage or pump activity."""
    db_log = models.UsageLog(
        user_id=current_user.id,
        water_used=log.water_used,
        pump_run_time=log.pump_run_time,
        soil_moisture=log.soil_moisture,
        action=log.action
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/logs", response_model=List[schemas.UsageLogResponse])
def get_usage_logs(
    limit: int = 50,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage logs for the current user."""
    logs = db.query(models.UsageLog).filter(
        models.UsageLog.user_id == current_user.id
    ).order_by(models.UsageLog.timestamp.desc()).limit(limit).all()
    
    return logs
