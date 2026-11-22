import math
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/blood-bank", tags=["Blood Bank & Donation"])

# Blood compatibility chart (Recipient -> Eligible Donor groups)
COMPATIBLE_DONOR_MAP = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"],
}

ALL_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

def normalize_blood_group(bg: Optional[str]) -> Optional[str]:
    if not bg or bg == "All":
        return None
    cleaned = bg.upper().strip().replace(" ", "+")
    if not cleaned.endswith("+") and not cleaned.endswith("-"):
        cleaned += "+"
    return cleaned

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 1)

# ============================================================================
# 1. BLOOD BANK REGISTRATION & RETRIEVAL
# ============================================================================

@router.post("/register", response_model=schemas.BloodBankOut)
def register_blood_bank(payload: schemas.BloodBankRegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
    if db.query(models.BloodBank).filter(models.BloodBank.license_number == payload.license_number).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already in use")

    blood_bank = models.BloodBank(
        name=payload.name,
        license_number=payload.license_number,
        type=payload.type,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        latitude=payload.latitude,
        longitude=payload.longitude,
        phone=payload.phone,
        emergency_phone=payload.emergency_phone,
        email=payload.email,
        is_active=True,
        verification_status="APPROVED",
        total_units=0
    )
    db.add(blood_bank)
    db.flush()

    # Create associated user for Blood Bank portal login
    user = models.User(
        email=payload.email,
        hashed_password=auth.get_password_hash(payload.password),
        name=f"Admin - {payload.name}",
        phone=payload.emergency_phone,
        role="BLOOD_BANK",
        is_active=True,
        blood_bank_id=blood_bank.id
    )
    db.add(user)

    # Initialize empty standard inventory for all 8 blood groups
    for group in ALL_BLOOD_GROUPS:
        inv = models.BloodInventory(
            blood_bank_id=blood_bank.id,
            blood_group=group,
            component_type="Whole Blood",
            available_units=0,
            reserved_units=0
        )
        db.add(inv)

    db.commit()
    db.refresh(blood_bank)
    return blood_bank

@router.get("/nearby", response_model=List[schemas.BloodBankOut])
def get_nearby_blood_banks(
    q: Optional[str] = Query(None, description="Search by name or address"),
    city: Optional[str] = Query(None, description="Filter by city"),
    blood_group: Optional[str] = Query(None, description="Filter by available blood group"),
    lat: Optional[float] = Query(None, description="Latitude for distance calculation"),
    lng: Optional[float] = Query(None, description="Longitude for distance calculation"),
    radius_km: Optional[float] = Query(None, description="Radius filter in kilometers"),
    db: Session = Depends(get_db)
):
    query = db.query(models.BloodBank).filter(
        models.BloodBank.is_active == True,
        models.BloodBank.verification_status == "APPROVED"
    )

    if city and city != "All":
        query = query.filter(models.BloodBank.city.ilike(f"%{city}%"))

    if q:
        query = query.filter(
            models.BloodBank.name.ilike(f"%{q}%") |
            models.BloodBank.address.ilike(f"%{q}%") |
            models.BloodBank.city.ilike(f"%{q}%")
        )

    banks = query.all()
    results = []

    for b in banks:
        # Check stock of blood group if specified
        if blood_group and blood_group != "All":
            has_stock = any(
                item.blood_group.upper() == blood_group.upper() and item.available_units > 0
                for item in b.inventory
            )
            # If checking specific group, still list the bank, but compute stock
            # We don't exclude unless strictly 0 and user asked for stock

        dist = None
        if lat is not None and lng is not None:
            dist = haversine(lat, lng, b.latitude, b.longitude)
            if radius_km is not None and radius_km > 0 and dist is not None and dist > radius_km:
                continue

        # Recalculate total units from inventory
        total_units = sum(item.available_units for item in b.inventory)
        b.total_units = total_units

        b_out = schemas.BloodBankOut.from_orm(b)
        b_out.distance_km = dist
        b_out.total_units = total_units
        results.append(b_out)

    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 99999)
    else:
        results.sort(key=lambda x: x.total_units, reverse=True)

    return results

@router.get("/{bank_id}", response_model=schemas.BloodBankDetailOut)
def get_blood_bank_detail(bank_id: int, db: Session = Depends(get_db)):
    bank = db.query(models.BloodBank).filter(models.BloodBank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood Bank not found")

    total_units = sum(item.available_units for item in bank.inventory)
    bank.total_units = total_units

    out = schemas.BloodBankDetailOut.from_orm(bank)
    out.total_units = total_units
    return out

@router.put("/{bank_id}/inventory", response_model=List[schemas.BloodInventoryOut])
def update_blood_inventory(
    bank_id: int,
    payload: schemas.BloodInventoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    bank = db.query(models.BloodBank).filter(models.BloodBank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood Bank not found")

    # Authorization check
    if current_user.role != "ADMIN" and current_user.blood_bank_id != bank_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit inventory for this blood bank")

    for item in payload.items:
        existing = db.query(models.BloodInventory).filter(
            models.BloodInventory.blood_bank_id == bank_id,
            models.BloodInventory.blood_group == item.blood_group,
            models.BloodInventory.component_type == item.component_type
        ).first()

        if existing:
            existing.available_units = max(0, item.available_units)
            existing.reserved_units = max(0, item.reserved_units)
            existing.last_updated = datetime.datetime.utcnow()
        else:
            new_inv = models.BloodInventory(
                blood_bank_id=bank_id,
                blood_group=item.blood_group,
                component_type=item.component_type,
                available_units=max(0, item.available_units),
                reserved_units=max(0, item.reserved_units)
            )
            db.add(new_inv)

    db.commit()

    # Update total units
    total_avail = sum(i.available_units for i in bank.inventory)
    bank.total_units = total_avail
    db.commit()

    return bank.inventory

# ============================================================================
# 2. VOLUNTARY BLOOD DONORS MANAGEMENT & NEARBY SEARCH
# ============================================================================

@router.post("/donors/register", response_model=schemas.BloodDonorOut)
def register_donor(
    payload: schemas.BloodDonorRegisterRequest,
    db: Session = Depends(get_db)
):
    # Check if donor with same phone or email exists
    existing = db.query(models.BloodDonor).filter(models.BloodDonor.phone == payload.phone).first()
    if existing:
        # Update existing donor profile
        existing.name = payload.name
        existing.blood_group = payload.blood_group.upper().strip()
        existing.age = payload.age
        existing.gender = payload.gender
        existing.city = payload.city
        existing.state = payload.state
        existing.address = payload.address or existing.address
        existing.latitude = payload.latitude
        existing.longitude = payload.longitude
        existing.is_available = payload.is_available
        existing.last_donation_date = payload.last_donation_date or existing.last_donation_date
        existing.notes = payload.notes or existing.notes
        existing.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    donor = models.BloodDonor(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        blood_group=payload.blood_group.upper().strip(),
        age=payload.age,
        gender=payload.gender,
        city=payload.city,
        state=payload.state,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_available=payload.is_available,
        last_donation_date=payload.last_donation_date,
        notes=payload.notes
    )
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return donor

@router.get("/donors/nearby", response_model=List[schemas.BloodDonorOut])
def get_nearby_donors(
    blood_group: Optional[str] = Query(None, description="Patient/Hospital needed blood group (e.g. B+, O-)"),
    compatible_only: bool = Query(True, description="Whether to include compatible donor groups"),
    city: Optional[str] = Query(None, description="Filter by city"),
    lat: Optional[float] = Query(None, description="Latitude of hospital or emergency scene"),
    lng: Optional[float] = Query(None, description="Longitude of hospital or emergency scene"),
    radius_km: Optional[float] = Query(None, description="Radius limit in km"),
    only_available: bool = Query(True, description="Only show donors currently available for emergency calls"),
    db: Session = Depends(get_db)
):
    query = db.query(models.BloodDonor)

    if only_available:
        query = query.filter(models.BloodDonor.is_available == True)

    if city and city != "All":
        query = query.filter(models.BloodDonor.city.ilike(f"%{city}%"))

    # Determine blood group filter
    target_groups = []
    bg_clean = normalize_blood_group(blood_group)
    if bg_clean:
        if compatible_only and bg_clean in COMPATIBLE_DONOR_MAP:
            target_groups = COMPATIBLE_DONOR_MAP[bg_clean]
        else:
            target_groups = [bg_clean]

    if target_groups:
        query = query.filter(models.BloodDonor.blood_group.in_(target_groups))

    donors = query.all()
    results = []

    for d in donors:
        dist = None
        if lat is not None and lng is not None:
            dist = haversine(lat, lng, d.latitude, d.longitude)
            if radius_km and dist > radius_km:
                continue

        d_out = schemas.BloodDonorOut.from_orm(d)
        d_out.distance_km = dist
        results.append(d_out)

    if lat is not None and lng is not None:
        results.sort(key=lambda x: (0 if x.is_available else 1, x.distance_km if x.distance_km is not None else 99999))
    else:
        results.sort(key=lambda x: (0 if x.is_available else 1, x.id))

    return results

@router.patch("/donors/{donor_id}/toggle-availability", response_model=schemas.BloodDonorOut)
def toggle_donor_availability(donor_id: int, db: Session = Depends(get_db)):
    donor = db.query(models.BloodDonor).filter(models.BloodDonor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    donor.is_available = not donor.is_available
    donor.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(donor)
    return donor

# ============================================================================
# 3. EMERGENCY BLOOD REQUESTS & BROADCASTS
# ============================================================================

@router.post("/requests", response_model=schemas.BloodRequestOut)
def create_blood_request(payload: schemas.BloodRequestCreate, db: Session = Depends(get_db)):
    req_count = db.query(models.BloodRequest).count() + 1
    req_number = f"BR-{datetime.datetime.utcnow().year}-{req_count:04d}"

    blood_req = models.BloodRequest(
        request_number=req_number,
        requester_type=payload.requester_type,
        requester_id=payload.requester_id,
        requester_name=payload.requester_name,
        patient_name=payload.patient_name,
        blood_group=payload.blood_group.upper().strip(),
        component_type=payload.component_type,
        units_needed=payload.units_needed,
        urgency=payload.urgency,
        hospital_id=payload.hospital_id,
        hospital_name=payload.hospital_name,
        contact_phone=payload.contact_phone,
        status="PENDING",
        latitude=payload.latitude,
        longitude=payload.longitude,
        notes=payload.notes
    )
    db.add(blood_req)
    db.commit()
    db.refresh(blood_req)
    return blood_req

@router.get("/requests", response_model=List[schemas.BloodRequestOut])
def list_blood_requests(
    status_filter: Optional[str] = Query(None, description="PENDING, ACCEPTED, FULFILLED, CANCELLED"),
    blood_group: Optional[str] = Query(None),
    hospital_id: Optional[int] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.BloodRequest)

    if status_filter and status_filter != "ALL":
        query = query.filter(models.BloodRequest.status == status_filter)

    if blood_group and blood_group != "All":
        query = query.filter(models.BloodRequest.blood_group == blood_group.upper().strip())

    if hospital_id:
        query = query.filter(models.BloodRequest.hospital_id == hospital_id)

    requests = query.order_by(models.BloodRequest.created_at.desc()).all()
    results = []

    for r in requests:
        dist = None
        if lat is not None and lng is not None and r.latitude and r.longitude:
            dist = haversine(lat, lng, r.latitude, r.longitude)

        r_out = schemas.BloodRequestOut.from_orm(r)
        r_out.distance_km = dist
        results.append(r_out)

    return results

@router.patch("/requests/{request_id}/status", response_model=schemas.BloodRequestOut)
def update_blood_request_status(
    request_id: int,
    payload: schemas.BloodRequestStatusUpdate,
    db: Session = Depends(get_db)
):
    req = db.query(models.BloodRequest).filter(models.BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    req.status = payload.status
    if payload.fulfilled_by_blood_bank_id:
        req.fulfilled_by_blood_bank_id = payload.fulfilled_by_blood_bank_id

    req.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req
