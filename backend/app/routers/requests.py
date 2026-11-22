import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(tags=["Patient Requests"])

def generate_ticket_code() -> str:
    return f"SC-EMG-{random.randint(1000, 9999)}"

@router.post("/patient/requests", response_model=schemas.PatientRequestOut)
def create_patient_emergency_request(
    payload: schemas.PatientRequestCreate,
    db: Session = Depends(get_db)
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == payload.requested_hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Target hospital not found")

    ticket_code = generate_ticket_code()
    while db.query(models.PatientRequest).filter(models.PatientRequest.ticket_code == ticket_code).first():
        ticket_code = generate_ticket_code()

    req = models.PatientRequest(
        ticket_code=ticket_code,
        patient_name=payload.patient_name,
        patient_age=payload.patient_age,
        patient_gender=payload.patient_gender,
        contact_phone=payload.contact_phone,
        emergency_type=payload.emergency_type,
        severity=payload.severity,
        notes=payload.notes,
        requested_hospital_id=payload.requested_hospital_id,
        status="PENDING",
        eta_minutes=payload.eta_minutes or 20
    )
    db.add(req)

    db.add(models.AuditLog(
        actor_email=payload.contact_phone,
        actor_role="PATIENT",
        action="EMERGENCY_REQUEST_SUBMITTED",
        entity_type="PATIENT_REQUEST",
        entity_id=ticket_code,
        details=f"Emergency admission requested for {payload.patient_name} ({payload.emergency_type}, {payload.severity}) at {hospital.name}"
    ))

    db.commit()
    db.refresh(req)

    req_out = schemas.PatientRequestOut.from_orm(req)
    req_out.hospital_name = hospital.name
    return req_out

@router.get("/patient/requests/track/{ticket_code}", response_model=schemas.PatientRequestOut)
def track_patient_request(ticket_code: str, db: Session = Depends(get_db)):
    req = db.query(models.PatientRequest).filter(models.PatientRequest.ticket_code == ticket_code).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request ticket not found")

    req_out = schemas.PatientRequestOut.from_orm(req)
    if req.hospital:
        req_out.hospital_name = req.hospital.name
    return req_out

@router.get("/hospital/requests", response_model=List[schemas.PatientRequestOut])
def list_hospital_requests(
    status_filter: Optional[str] = Query(None),
    hospital_id: Optional[int] = Query(None),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id or hospital_id
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="Hospital ID required")

    query = db.query(models.PatientRequest).filter(
        models.PatientRequest.requested_hospital_id == target_hospital_id
    )

    if status_filter and status_filter != "ALL":
        query = query.filter(models.PatientRequest.status == status_filter)

    query = query.order_by(models.PatientRequest.created_at.desc())
    requests = query.all()

    results = []
    for r in requests:
        out = schemas.PatientRequestOut.from_orm(r)
        if r.hospital:
            out.hospital_name = r.hospital.name
        results.append(out)

    return results

@router.patch("/hospital/requests/{request_id}", response_model=schemas.PatientRequestOut)
def update_patient_request_status(
    request_id: int,
    payload: schemas.PatientRequestUpdate,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    req = db.query(models.PatientRequest).filter(models.PatientRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if current_user.role != "ADMIN" and req.requested_hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if payload.status:
        req.status = payload.status
    if payload.allocated_bed_category:
        req.allocated_bed_category = payload.allocated_bed_category
    if payload.eta_minutes is not None:
        req.eta_minutes = payload.eta_minutes
    if payload.notes:
        req.notes = payload.notes

    # If admitted or bed allocated, optionally decrement bed count
    if payload.status == "BED_ALLOCATED" and payload.allocated_bed_category:
        bed = db.query(models.BedCategory).filter(
            models.BedCategory.hospital_id == req.requested_hospital_id,
            models.BedCategory.category == payload.allocated_bed_category
        ).first()
        if bed and bed.available_beds > 0:
            bed.available_beds -= 1
            bed.occupied_beds += 1

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="REQUEST_STATUS_UPDATED",
        entity_type="PATIENT_REQUEST",
        entity_id=req.ticket_code,
        details=f"Status set to {req.status}, bed: {req.allocated_bed_category}"
    ))

    db.commit()
    db.refresh(req)

    out = schemas.PatientRequestOut.from_orm(req)
    if req.hospital:
        out.hospital_name = req.hospital.name
    return out
