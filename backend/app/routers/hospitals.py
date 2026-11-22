import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Calculate distance in km between two geo-coordinates
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 1)

@router.get("", response_model=List[schemas.HospitalOut])
def list_hospitals(
    q: Optional[str] = Query(None, description="Search term for name or city"),
    city: Optional[str] = Query(None, description="Filter by city"),
    bed_type: Optional[str] = Query(None, description="Filter by available bed category (e.g., ICU, Ventilator)"),
    lat: Optional[float] = Query(None, description="User latitude for distance calculation"),
    lng: Optional[float] = Query(None, description="User longitude for distance calculation"),
    radius_km: Optional[float] = Query(None, description="Maximum radius in kilometers"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Hospital).filter(
        models.Hospital.is_active == True,
        models.Hospital.verification_status == "APPROVED"
    )

    if city and city != "All":
        query = query.filter(models.Hospital.city.ilike(f"%{city}%"))

    if q:
        search_filter = (
            models.Hospital.name.ilike(f"%{q}%") |
            models.Hospital.address.ilike(f"%{q}%") |
            models.Hospital.city.ilike(f"%{q}%") |
            models.Hospital.type.ilike(f"%{q}%")
        )
        query = query.filter(search_filter)

    hospitals = query.all()
    results = []

    for h in hospitals:
        # Calculate available beds
        total_avail = 0
        icu_avail = 0
        has_matching_bed = False if bed_type and bed_type != "All" else True

        for b in h.beds:
            total_avail += b.available_beds
            if "ICU" in b.category.upper():
                icu_avail += b.available_beds
            if bed_type and bed_type != "All" and bed_type.lower() in b.category.lower() and b.available_beds > 0:
                has_matching_bed = True

        if bed_type and bed_type != "All" and not has_matching_bed:
            continue

        dist = None
        if lat is not None and lng is not None:
            dist = haversine(lat, lng, h.latitude, h.longitude)
            if radius_km and dist > radius_km:
                continue

        h_out = schemas.HospitalOut.from_orm(h)
        h_out.documents = None  # Strip heavy base64 verification documents from public list
        h_out.distance_km = dist
        h_out.total_available_beds = total_avail
        h_out.icu_available = icu_avail
        results.append(h_out)

    # Sort results
    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 99999)
    else:
        results.sort(key=lambda x: (x.total_available_beds or 0), reverse=True)

    return results

@router.get("/{hospital_id}", response_model=schemas.HospitalDetailOut)
def get_hospital_detail(hospital_id: int, db: Session = Depends(get_db)):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    total_avail = sum(b.available_beds for b in hospital.beds)
    icu_avail = sum(b.available_beds for b in hospital.beds if "ICU" in b.category.upper())

    detail = schemas.HospitalDetailOut.from_orm(hospital)
    detail.total_available_beds = total_avail
    detail.icu_available = icu_avail
    return detail

@router.get("/{hospital_id}/live-status")
def get_live_status(hospital_id: int, db: Session = Depends(get_db)):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    bed_summary = {}
    for b in hospital.beds:
        bed_summary[b.category] = {
            "available": b.available_beds,
            "total": b.total_beds,
            "occupied": b.occupied_beds
        }

    return {
        "hospital_id": hospital.id,
        "name": hospital.name,
        "available_ambulances": hospital.available_ambulances,
        "beds": bed_summary,
        "total_available": sum(b.available_beds for b in hospital.beds)
    }
