from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/hospital/beds", tags=["Beds Management"])

@router.get("", response_model=List[schemas.BedCategoryOut])
def get_hospital_beds(
    hospital_id: int = Query(None),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id or hospital_id
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="Hospital ID required")
    
    beds = db.query(models.BedCategory).filter(models.BedCategory.hospital_id == target_hospital_id).all()
    return beds

@router.patch("/{bed_id}", response_model=schemas.BedCategoryOut)
def update_bed_category(
    bed_id: int,
    payload: schemas.BedCategoryUpdate,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    bed = db.query(models.BedCategory).filter(models.BedCategory.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed category not found")
    
    if current_user.role != "ADMIN" and bed.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Unauthorized to modify this hospital's beds")

    if payload.total_beds is not None:
        bed.total_beds = payload.total_beds
    if payload.available_beds is not None:
        bed.available_beds = payload.available_beds
        bed.occupied_beds = max(0, bed.total_beds - bed.available_beds)
    if payload.occupied_beds is not None:
        bed.occupied_beds = payload.occupied_beds
        bed.available_beds = max(0, bed.total_beds - bed.occupied_beds)
    if payload.price_per_day is not None:
        bed.price_per_day = payload.price_per_day

    # Audit log
    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="BED_COUNT_UPDATED",
        entity_type="BED_CATEGORY",
        entity_id=str(bed.id),
        details=f"Updated {bed.category}: Total={bed.total_beds}, Available={bed.available_beds}, Occupied={bed.occupied_beds}"
    ))

    db.commit()
    db.refresh(bed)
    return bed

@router.post("/adjust/{bed_id}", response_model=schemas.BedCategoryOut)
def adjust_bed_count(
    bed_id: int,
    delta: int = Query(..., description="+1 to release bed, -1 to occupy bed"),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    bed = db.query(models.BedCategory).filter(models.BedCategory.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed category not found")

    if current_user.role != "ADMIN" and bed.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    new_available = bed.available_beds + delta
    if new_available < 0 or new_available > bed.total_beds:
        raise HTTPException(status_code=400, detail=f"Cannot adjust available beds beyond [0, {bed.total_beds}]")

    bed.available_beds = new_available
    bed.occupied_beds = bed.total_beds - new_available

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="BED_DELTA_ADJUST",
        entity_type="BED_CATEGORY",
        entity_id=str(bed.id),
        details=f"Adjusted {bed.category} by {delta:+d}. Available now: {bed.available_beds}"
    ))

    db.commit()
    db.refresh(bed)
    return bed

@router.post("", response_model=schemas.BedCategoryOut)
def create_bed_category(
    payload: schemas.BedCategoryCreate,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="User is not associated with a hospital")

    occupied = payload.occupied_beds if payload.occupied_beds is not None else max(0, payload.total_beds - payload.available_beds)
    bed = models.BedCategory(
        hospital_id=target_hospital_id,
        category=payload.category,
        total_beds=payload.total_beds,
        available_beds=payload.available_beds,
        occupied_beds=occupied,
        price_per_day=payload.price_per_day or 0.0
    )
    db.add(bed)
    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="BED_CATEGORY_CREATED",
        entity_type="BED_CATEGORY",
        entity_id=payload.category,
        details=f"Created bed category {payload.category} with {payload.total_beds} total beds"
    ))
    db.commit()
    db.refresh(bed)
    return bed

@router.delete("/{bed_id}")
def delete_bed_category(
    bed_id: int,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    bed = db.query(models.BedCategory).filter(models.BedCategory.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed category not found")

    if current_user.role != "ADMIN" and bed.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    category_name = bed.category
    db.delete(bed)
    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="BED_CATEGORY_DELETED",
        entity_type="BED_CATEGORY",
        entity_id=str(bed_id),
        details=f"Deleted bed category {category_name}"
    ))
    db.commit()
    return {"message": f"Bed category '{category_name}' removed successfully"}
