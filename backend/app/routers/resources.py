from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/hospital/resources", tags=["Resources Management"])

@router.get("", response_model=List[schemas.ResourceInventoryOut])
def get_hospital_resources(
    hospital_id: int = Query(None),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id or hospital_id
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="Hospital ID required")

    return db.query(models.ResourceInventory).filter(
        models.ResourceInventory.hospital_id == target_hospital_id
    ).all()

@router.patch("/{resource_id}", response_model=schemas.ResourceInventoryOut)
def update_resource(
    resource_id: int,
    payload: schemas.ResourceInventoryUpdate,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    resource = db.query(models.ResourceInventory).filter(models.ResourceInventory.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if current_user.role != "ADMIN" and resource.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    resource.quantity_available = max(0, payload.quantity_available)
    
    # Auto-classify status if not explicitly overridden
    if payload.status:
        resource.status = payload.status
    else:
        if resource.quantity_available <= 2:
            resource.status = "CRITICAL"
        elif resource.quantity_available <= 5:
            resource.status = "LOW"
        else:
            resource.status = "ADEQUATE"

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="RESOURCE_UPDATED",
        entity_type="RESOURCE",
        entity_id=str(resource.id),
        details=f"Updated {resource.resource_name} quantity to {resource.quantity_available} ({resource.status})"
    ))

    db.commit()
    db.refresh(resource)
    return resource

@router.post("/adjust/{resource_id}", response_model=schemas.ResourceInventoryOut)
def adjust_resource(
    resource_id: int,
    delta: int = Query(...),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    resource = db.query(models.ResourceInventory).filter(models.ResourceInventory.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if current_user.role != "ADMIN" and resource.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    new_qty = max(0, resource.quantity_available + delta)
    resource.quantity_available = new_qty

    if resource.quantity_available <= 2:
        resource.status = "CRITICAL"
    elif resource.quantity_available <= 5:
        resource.status = "LOW"
    else:
        resource.status = "ADEQUATE"

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="RESOURCE_DELTA_ADJUST",
        entity_type="RESOURCE",
        entity_id=str(resource.id),
        details=f"Adjusted {resource.resource_name} by {delta:+d}. Now: {resource.quantity_available}"
    ))

    db.commit()
    db.refresh(resource)
    return resource

@router.post("", response_model=schemas.ResourceInventoryOut)
def create_resource(
    payload: schemas.ResourceInventoryCreate,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="User is not associated with a hospital")

    status = payload.status
    if not status:
        if payload.quantity_available <= 2:
            status = "CRITICAL"
        elif payload.quantity_available <= 5:
            status = "LOW"
        else:
            status = "ADEQUATE"

    resource = models.ResourceInventory(
        hospital_id=target_hospital_id,
        resource_name=payload.resource_name,
        category=payload.category,
        quantity_available=payload.quantity_available,
        unit=payload.unit,
        status=status
    )
    db.add(resource)
    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="RESOURCE_CREATED",
        entity_type="RESOURCE",
        entity_id=payload.resource_name,
        details=f"Added resource {payload.resource_name} ({payload.quantity_available} {payload.unit})"
    ))
    db.commit()
    db.refresh(resource)
    return resource

@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    resource = db.query(models.ResourceInventory).filter(models.ResourceInventory.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if current_user.role != "ADMIN" and resource.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    res_name = resource.resource_name
    db.delete(resource)
    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="RESOURCE_DELETED",
        entity_type="RESOURCE",
        entity_id=str(resource_id),
        details=f"Removed resource {res_name}"
    ))
    db.commit()
    return {"message": f"Resource '{res_name}' removed successfully"}
