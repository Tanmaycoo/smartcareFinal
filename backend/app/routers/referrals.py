import datetime
import math
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/referrals", tags=["Hospital Referral & Resource Booking"])

def generate_referral_code() -> str:
    return f"REF-{datetime.datetime.utcnow().year}-{random.randint(10000, 99999)}"

def generate_booking_reference() -> str:
    return f"BKG-{datetime.datetime.utcnow().year}-{random.randint(10000, 99999)}"

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def format_referral_out(r: models.HospitalReferral) -> schemas.ReferralOut:
    out = schemas.ReferralOut.from_orm(r)
    if r.referring_hospital:
        out.referring_hospital_name = r.referring_hospital.name
    if r.receiving_hospital:
        out.receiving_hospital_name = r.receiving_hospital.name
        out.receiving_hospital_city = r.receiving_hospital.city
        out.receiving_hospital_phone = r.receiving_hospital.emergency_phone or r.receiving_hospital.reception_phone
    if r.timeline:
        out.timeline = [schemas.ReferralTimelineEventOut.from_orm(e) for e in r.timeline]
    return out


# ============================================================================
# 1. REFERRAL DASHBOARD METRICS
# ============================================================================
@router.get("/stats", response_model=schemas.ReferralDashboardStats)
def get_referral_stats(
    hospital_id: Optional[int] = Query(None),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    hosp_id = current_user.hospital_id or hospital_id
    if not hosp_id:
        raise HTTPException(status_code=400, detail="Hospital ID required")

    outgoing = db.query(models.HospitalReferral).filter(models.HospitalReferral.referring_hospital_id == hosp_id).all()
    incoming = db.query(models.HospitalReferral).filter(models.HospitalReferral.receiving_hospital_id == hosp_id).all()

    total_referrals = len(outgoing)
    awaiting = sum(1 for r in outgoing if r.status == "AWAITING_ACCEPTANCE")
    accepted = sum(1 for r in outgoing if r.status in ["ACCEPTED", "RESOURCE_RESERVED"])
    confirmed = sum(1 for r in outgoing if r.status == "CONFIRMED")
    in_transit = sum(1 for r in outgoing if r.status == "IN_TRANSIT")
    completed = sum(1 for r in outgoing if r.status == "COMPLETED")
    cancelled = sum(1 for r in outgoing if r.status in ["CANCELLED", "DECLINED"])
    incoming_pending = sum(1 for r in incoming if r.status == "AWAITING_ACCEPTANCE")

    return schemas.ReferralDashboardStats(
        total_referrals=total_referrals,
        awaiting_responses=awaiting,
        accepted_referrals=accepted,
        confirmed_appointments=confirmed,
        transfers_in_progress=in_transit,
        completed_requests=completed,
        cancelled_declined=cancelled,
        incoming_pending=incoming_pending
    )


# ============================================================================
# 2. OUTGOING REFERRALS (CREATED BY LOGGED-IN HOSPITAL)
# ============================================================================
@router.get("/outgoing", response_model=List[schemas.ReferralOut])
def list_outgoing_referrals(
    status: Optional[str] = Query(None),
    request_type: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    hospital_id: Optional[int] = Query(None),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    hosp_id = current_user.hospital_id or hospital_id
    if not hosp_id:
        raise HTTPException(status_code=400, detail="Hospital ID required")

    query = db.query(models.HospitalReferral).filter(models.HospitalReferral.referring_hospital_id == hosp_id)

    if status and status != "ALL":
        query = query.filter(models.HospitalReferral.status == status)
    if request_type and request_type != "ALL":
        query = query.filter(models.HospitalReferral.request_type == request_type)
    if urgency and urgency != "ALL":
        query = query.filter(models.HospitalReferral.clinical_urgency == urgency)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (models.HospitalReferral.referral_code.ilike(term)) |
            (models.HospitalReferral.patient_name.ilike(term)) |
            (models.HospitalReferral.service_name.ilike(term))
        )

    referrals = query.order_by(models.HospitalReferral.created_at.desc()).all()
    return [format_referral_out(r) for r in referrals]


# ============================================================================
# 3. INCOMING REFERRALS (TARGETING LOGGED-IN HOSPITAL)
# ============================================================================
@router.get("/incoming", response_model=List[schemas.ReferralOut])
def list_incoming_referrals(
    status: Optional[str] = Query(None),
    request_type: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    hospital_id: Optional[int] = Query(None),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    hosp_id = current_user.hospital_id or hospital_id
    if not hosp_id:
        raise HTTPException(status_code=400, detail="Hospital ID required")

    query = db.query(models.HospitalReferral).filter(models.HospitalReferral.receiving_hospital_id == hosp_id)

    if status and status != "ALL":
        query = query.filter(models.HospitalReferral.status == status)
    if request_type and request_type != "ALL":
        query = query.filter(models.HospitalReferral.request_type == request_type)
    if urgency and urgency != "ALL":
        query = query.filter(models.HospitalReferral.clinical_urgency == urgency)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (models.HospitalReferral.referral_code.ilike(term)) |
            (models.HospitalReferral.patient_name.ilike(term)) |
            (models.HospitalReferral.service_name.ilike(term))
        )

    referrals = query.order_by(models.HospitalReferral.created_at.desc()).all()
    return [format_referral_out(r) for r in referrals]


# ============================================================================
# 4. REFERRAL DETAILS
# ============================================================================
@router.get("/{referral_id}", response_model=schemas.ReferralOut)
def get_referral_detail(
    referral_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    referral = db.query(models.HospitalReferral).filter(models.HospitalReferral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral record not found")

    # Authorize: Must be referring hospital, receiving hospital, admin, or matching patient
    is_staff = current_user.role in ["HOSPITAL", "ADMIN"]
    is_referring = current_user.hospital_id == referral.referring_hospital_id
    is_receiving = current_user.hospital_id == referral.receiving_hospital_id
    is_patient = (current_user.phone and current_user.phone == referral.patient_phone) or (referral.patient_user_id == current_user.id)

    if not (is_referring or is_receiving or current_user.role == "ADMIN" or is_patient):
        raise HTTPException(status_code=403, detail="Not authorized to access this referral")

    return format_referral_out(referral)


# ============================================================================
# 5. CREATE REFERRAL REQUEST
# ============================================================================
@router.post("/create", response_model=schemas.ReferralOut, status_code=status.HTTP_201_CREATED)
def create_referral(
    payload: schemas.ReferralCreateRequest,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    hosp_id = current_user.hospital_id
    if not hosp_id:
        raise HTTPException(status_code=400, detail="Hospital ID missing from active session")

    if payload.receiving_hospital_id and payload.receiving_hospital_id == hosp_id:
        raise HTTPException(status_code=400, detail="Referring and receiving hospitals cannot be identical")

    ref_hosp = db.query(models.Hospital).filter(models.Hospital.id == hosp_id).first()
    rec_hosp = None
    if payload.receiving_hospital_id:
        rec_hosp = db.query(models.Hospital).filter(models.Hospital.id == payload.receiving_hospital_id).first()
        if not rec_hosp:
            raise HTTPException(status_code=404, detail="Receiving hospital not found")

    # Check published pricing if service matches
    quoted_price = None
    billing_unit = None
    if rec_hosp:
        pub_price = db.query(models.HospitalPrice).join(models.HospitalService).filter(
            models.HospitalPrice.hospital_id == rec_hosp.id,
            models.HospitalPrice.status == "PUBLISHED",
            models.HospitalService.name.ilike(f"%{payload.service_name.strip()}%")
        ).first()
        if pub_price:
            quoted_price = pub_price.price
            billing_unit = pub_price.service.billing_unit

    # Check if patient phone matches an existing patient user
    patient_user = db.query(models.User).filter(models.User.phone == payload.patient_phone.strip()).first()
    patient_user_id = patient_user.id if patient_user else None

    code = generate_referral_code()
    referral = models.HospitalReferral(
        referral_code=code,
        referring_hospital_id=hosp_id,
        receiving_hospital_id=payload.receiving_hospital_id,
        patient_name=payload.patient_name.strip(),
        patient_phone=payload.patient_phone.strip(),
        patient_age=payload.patient_age,
        patient_gender=payload.patient_gender,
        patient_reference_id=payload.patient_reference_id,
        patient_user_id=patient_user_id,
        request_type=payload.request_type,
        service_category=payload.service_category,
        service_name=payload.service_name.strip(),
        clinical_urgency=payload.clinical_urgency,
        preferred_date=payload.preferred_date,
        preferred_time_slot=payload.preferred_time_slot,
        quantity=payload.quantity,
        equipment_required=payload.equipment_required,
        clinical_summary=payload.clinical_summary,
        special_instructions=payload.special_instructions,
        required_by_time=payload.required_by_time,
        status="AWAITING_ACCEPTANCE",
        quoted_price=quoted_price,
        billing_unit=billing_unit,
        referring_doctor_name=payload.referring_doctor_name or current_user.name,
        referring_contact_phone=payload.referring_contact_phone or (ref_hosp.reception_phone if ref_hosp else None)
    )
    db.add(referral)
    db.flush()

    # Initial timeline event
    target_name = rec_hosp.name if rec_hosp else "Selected Facility Pool"
    timeline_event = models.ReferralTimelineEvent(
        referral_id=referral.id,
        action="REFERRAL_CREATED",
        from_status=None,
        to_status="AWAITING_ACCEPTANCE",
        performed_by=f"{current_user.name} ({ref_hosp.name if ref_hosp else 'Hospital'})",
        actor_role="REFERRING_HOSPITAL",
        notes=f"Referral request created for {payload.service_name} ({payload.clinical_urgency}). Dispatched to {target_name}."
    )
    db.add(timeline_event)

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="REFERRAL_CREATED",
        entity_type="HOSPITAL_REFERRAL",
        entity_id=code,
        details=f"Referral {code} raised by {ref_hosp.name if ref_hosp else hosp_id} for patient {payload.patient_name}. Service: {payload.service_name}."
    ))

    db.commit()
    db.refresh(referral)
    return format_referral_out(referral)


# ============================================================================
# 6. RECEIVING HOSPITAL RESPONSE (ACCEPT, DECLINE, ALTERNATIVE, CONFIRM)
# ============================================================================
@router.post("/{referral_id}/respond", response_model=schemas.ReferralOut)
def respond_to_referral(
    referral_id: int,
    payload: schemas.ReferralResponseRequest,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    referral = db.query(models.HospitalReferral).filter(models.HospitalReferral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral record not found")

    hosp_id = current_user.hospital_id
    # If unassigned receiving hospital, current hospital can accept it
    if referral.receiving_hospital_id and referral.receiving_hospital_id != hosp_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only designated receiving hospital staff can respond to this referral")

    rec_hosp = db.query(models.Hospital).filter(models.Hospital.id == hosp_id).first()
    old_status = referral.status
    action = payload.action.upper()

    if action == "DECLINE":
        if not payload.decline_reason or not payload.decline_reason.strip():
            raise HTTPException(status_code=400, detail="Decline reason is mandatory when declining a referral")
        referral.status = "DECLINED"
        referral.decline_reason = payload.decline_reason.strip()
        new_status = "DECLINED"
        action_note = f"Referral declined. Reason: {payload.decline_reason.strip()}"

    elif action == "OFFER_ALTERNATIVE":
        if not payload.alternative_details or not payload.alternative_details.strip():
            raise HTTPException(status_code=400, detail="Alternative schedule or facility details must be provided")
        referral.status = "ALTERNATIVE_OFFERED"
        referral.alternative_details = payload.alternative_details.strip()
        new_status = "ALTERNATIVE_OFFERED"
        action_note = f"Alternative offered by receiving facility: {payload.alternative_details.strip()}"

    elif action in ["ACCEPT", "CONFIRM"]:
        # Set receiving hospital if not previously assigned
        if not referral.receiving_hospital_id:
            referral.receiving_hospital_id = hosp_id

        # BED RESERVATION (CONCURRENCY CONTROL)
        if payload.allocated_bed_category_id:
            # Query bed category with row-level transaction safety
            bed_cat = db.query(models.BedCategory).filter(
                models.BedCategory.id == payload.allocated_bed_category_id,
                models.BedCategory.hospital_id == hosp_id
            ).with_for_update().first()

            if not bed_cat:
                raise HTTPException(status_code=404, detail="Designated bed category not found at this facility")

            if bed_cat.available_beds < 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reserve: {bed_cat.category} has 0 available beds. Concurrency collision prevented."
                )

            # Atomic decrement
            bed_cat.available_beds -= 1
            bed_cat.occupied_beds += 1
            referral.allocated_bed_category_id = bed_cat.id
            referral.status = "RESOURCE_RESERVED"
            new_status = "RESOURCE_RESERVED"
            action_note = f"Accepted & 1 {bed_cat.category} bed reserved. Remaining available beds: {bed_cat.available_beds}."

        elif referral.request_type in ["DIAGNOSTIC", "LABORATORY"]:
            # Confirm appointment slot
            bkg_ref = generate_booking_reference()
            referral.booking_reference = bkg_ref
            referral.status = "CONFIRMED"
            new_status = "CONFIRMED"
            referral.confirmed_date = payload.confirmed_date or referral.preferred_date
            referral.confirmed_time_slot = payload.confirmed_time_slot or referral.preferred_time_slot or "10:00 AM - 11:00 AM"
            referral.preparation_instructions = payload.preparation_instructions or "Please report 15 minutes before the scheduled slot with previous medical reports."
            action_note = f"Diagnostic appointment confirmed. Booking Ref: {bkg_ref} on {referral.confirmed_date} at {referral.confirmed_time_slot}."

        else:
            referral.status = "ACCEPTED"
            new_status = "ACCEPTED"
            action_note = "Referral request accepted by receiving clinical team."

        if payload.quoted_price is not None:
            referral.quoted_price = payload.quoted_price
        if payload.preparation_instructions:
            referral.preparation_instructions = payload.preparation_instructions
        if payload.receiving_contact_name:
            referral.receiving_contact_name = payload.receiving_contact_name
        if payload.receiving_contact_phone:
            referral.receiving_contact_phone = payload.receiving_contact_phone

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported response action: {payload.action}")

    # Add timeline event
    timeline = models.ReferralTimelineEvent(
        referral_id=referral.id,
        action=f"REFERRAL_{action}",
        from_status=old_status,
        to_status=new_status,
        performed_by=f"{current_user.name} ({rec_hosp.name if rec_hosp else 'Receiving Center'})",
        actor_role="RECEIVING_HOSPITAL",
        notes=payload.notes or action_note
    )
    db.add(timeline)

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action=f"REFERRAL_{action}",
        entity_type="HOSPITAL_REFERRAL",
        entity_id=referral.referral_code,
        details=f"Referral {referral.referral_code} updated to {new_status} by {current_user.email}."
    ))

    db.commit()
    db.refresh(referral)
    return format_referral_out(referral)


# ============================================================================
# 7. UPDATE REFERRAL STATUS (DISPATCH, ARRIVE, COMPLETE, CANCEL)
# ============================================================================
@router.post("/{referral_id}/update-status", response_model=schemas.ReferralOut)
def update_referral_status(
    referral_id: int,
    payload: schemas.ReferralStatusUpdateRequest,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    referral = db.query(models.HospitalReferral).filter(models.HospitalReferral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral record not found")

    hosp_id = current_user.hospital_id
    if current_user.role != "ADMIN" and hosp_id not in [referral.referring_hospital_id, referral.receiving_hospital_id]:
        raise HTTPException(status_code=403, detail="Not authorized to update this referral")

    old_status = referral.status
    action = payload.action.upper()

    if action == "DISPATCH":
        referral.status = "IN_TRANSIT"
        referral.dispatched_at = datetime.datetime.utcnow()
        if payload.ambulance_details:
            referral.ambulance_details = payload.ambulance_details
        note = f"Patient dispatched in transit. Ambulance: {referral.ambulance_details or 'Coordinated ALS Transport'}."

    elif action == "ARRIVE":
        referral.status = "ARRIVED"
        referral.arrived_at = datetime.datetime.utcnow()
        note = "Patient arrival confirmed at receiving facility. Clinical handover initiated."

    elif action == "COMPLETE":
        referral.status = "COMPLETED"
        referral.completed_at = datetime.datetime.utcnow()
        note = "Referral procedure/admission successfully completed."

    elif action == "CANCEL":
        referral.status = "CANCELLED"
        # Release reserved bed if any
        if referral.allocated_bed_category_id:
            bed_cat = db.query(models.BedCategory).filter(models.BedCategory.id == referral.allocated_bed_category_id).first()
            if bed_cat:
                bed_cat.available_beds += 1
                if bed_cat.occupied_beds > 0:
                    bed_cat.occupied_beds -= 1
        note = f"Referral cancelled. {payload.notes or ''}"

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported status action: {payload.action}")

    timeline = models.ReferralTimelineEvent(
        referral_id=referral.id,
        action=f"REFERRAL_{action}",
        from_status=old_status,
        to_status=referral.status,
        performed_by=f"{current_user.name}",
        actor_role="HOSPITAL_STAFF",
        notes=payload.notes or note
    )
    db.add(timeline)

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action=f"REFERRAL_{action}",
        entity_type="HOSPITAL_REFERRAL",
        entity_id=referral.referral_code,
        details=f"Referral {referral.referral_code} progressed to {referral.status}."
    ))

    db.commit()
    db.refresh(referral)
    return format_referral_out(referral)


# ============================================================================
# 8. FIND SUITABLE FACILITIES (DISCOVERY & CAPACITIES)
# ============================================================================
@router.get("/facilities/search", response_model=List[schemas.FacilitySearchItem])
def search_facilities_for_referral(
    category: Optional[str] = Query(None),
    service_name: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(18.5204),
    lng: Optional[float] = Query(73.8567),
    radius_km: Optional[float] = Query(50.0),
    db: Session = Depends(get_db)
):
    # Only verified approved hospitals
    hospitals = db.query(models.Hospital).filter(
        models.Hospital.is_active == True,
        models.Hospital.verification_status == "APPROVED"
    ).all()

    DEFAULT_SLOTS = [
        "09:00 AM - 10:00 AM",
        "11:30 AM - 12:30 PM",
        "02:00 PM - 03:00 PM",
        "04:30 PM - 05:30 PM"
    ]

    results = []
    for h in hospitals:
        dist = haversine(lat, lng, h.latitude, h.longitude) if lat and lng else None
        if radius_km and dist is not None and dist > radius_km:
            continue
        if city and city.lower() != "all" and city.lower() not in h.city.lower():
            continue

        # Check Bed/ICU capacities
        bed_matches = [b for b in h.beds if not service_name or service_name.lower() in b.category.lower()]
        total_avail_beds = sum(b.available_beds for b in bed_matches) if bed_matches else sum(b.available_beds for b in h.beds)
        total_beds_count = sum(b.total_beds for b in bed_matches) if bed_matches else sum(b.total_beds for b in h.beds)

        # Check published pricing for matching services
        services = db.query(models.HospitalService).filter(
            models.HospitalService.hospital_id == h.id,
            models.HospitalService.is_active == True
        )
        if category and category.lower() != "all":
            services = services.filter(models.HospitalService.category.ilike(f"%{category}%"))
        if service_name and service_name.strip():
            services = services.filter(models.HospitalService.name.ilike(f"%{service_name.strip()}%"))
        matching_services = services.all()

        pub_price = None
        b_unit = None
        s_name = service_name or (matching_services[0].name if matching_services else "General Medical Facility")
        s_cat = category or (matching_services[0].category if matching_services else "Hospital Care")

        if matching_services:
            svc = matching_services[0]
            price_obj = db.query(models.HospitalPrice).filter(
                models.HospitalPrice.service_id == svc.id,
                models.HospitalPrice.status == "PUBLISHED"
            ).first()
            if price_obj:
                pub_price = price_obj.price
                b_unit = svc.billing_unit

        capacity_status = "AVAILABLE" if total_avail_beds > 0 else "FULL"
        if not h.beds:
            capacity_status = "NOT_REPORTED"

        results.append(schemas.FacilitySearchItem(
            hospital_id=h.id,
            name=h.name,
            city=h.city,
            address=h.address,
            verification_status=h.verification_status,
            distance_km=dist,
            reception_phone=h.reception_phone or h.emergency_phone,
            emergency_phone=h.emergency_phone,
            category=s_cat,
            service_name=s_name,
            published_price=pub_price,
            billing_unit=b_unit,
            capacity_status=capacity_status,
            available_capacity=total_avail_beds,
            total_capacity=total_beds_count,
            available_slots=DEFAULT_SLOTS,
            preparation_instructions="Please arrive 15 minutes before slot with doctor prescription and previous scan reports."
        ))

    # Sort results by distance
    results.sort(key=lambda x: (x.distance_km if x.distance_km is not None else 9999))
    return results


# ============================================================================
# 9. PATIENT REFERRALS & CONFIRMED APPOINTMENTS
# ============================================================================
@router.get("/patient/my-referrals", response_model=List[schemas.ReferralOut])
def get_patient_referrals(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.HospitalReferral).filter(
        (models.HospitalReferral.patient_user_id == current_user.id) |
        (models.HospitalReferral.patient_phone == current_user.phone)
    )
    referrals = query.order_by(models.HospitalReferral.created_at.desc()).all()
    return [format_referral_out(r) for r in referrals]
