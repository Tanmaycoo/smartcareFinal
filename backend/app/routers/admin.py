from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/admin", tags=["SuperAdmin Management"])

@router.get("/applications", response_model=List[schemas.HospitalOut])
def get_pending_applications(
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    applications = db.query(models.Hospital).filter(
        models.Hospital.verification_status == "PENDING"
    ).order_by(models.Hospital.created_at.desc()).all()
    return applications

@router.post("/applications/{hospital_id}/verify", response_model=schemas.HospitalOut)
def verify_hospital_application(
    hospital_id: int,
    payload: schemas.ApplicationVerifyRequest,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    action_upper = payload.action.upper()
    if action_upper not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT")

    if action_upper == "APPROVE":
        hospital.verification_status = "APPROVED"
        hospital.is_active = True
        hospital.verification_notes = payload.notes or "All clinical documents, licensing and ICU accreditations verified."
        hospital.rejection_reason = None
    else:
        hospital.verification_status = "REJECTED"
        hospital.rejection_reason = payload.rejection_reason or payload.notes or "Documentation discrepancies found."
        hospital.verification_notes = payload.notes

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action=f"HOSPITAL_{action_upper}D",
        entity_type="HOSPITAL",
        entity_id=str(hospital.id),
        details=f"Admin {current_user.email} marked {hospital.name} as {hospital.verification_status}. Notes: {payload.notes}"
    ))

    db.commit()
    db.refresh(hospital)
    return hospital

@router.get("/hospitals", response_model=List[schemas.HospitalOut])
def list_all_hospital_accounts(
    status_filter: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(models.Hospital)
    if status_filter and status_filter != "ALL":
        query = query.filter(models.Hospital.verification_status == status_filter)

    hospitals = query.order_by(models.Hospital.created_at.desc()).all()
    results = []
    for h in hospitals:
        total_avail = sum(b.available_beds for b in h.beds)
        icu_avail = sum(b.available_beds for b in h.beds if "ICU" in b.category.upper())
        h_out = schemas.HospitalOut.from_orm(h)
        h_out.total_available_beds = total_avail
        h_out.icu_available = icu_avail
        results.append(h_out)
    return results

@router.patch("/hospitals/{hospital_id}/toggle-status", response_model=schemas.HospitalOut)
def toggle_hospital_active_status(
    hospital_id: int,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    hospital.is_active = not hospital.is_active

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="HOSPITAL_STATUS_TOGGLED",
        entity_type="HOSPITAL",
        entity_id=str(hospital.id),
        details=f"Hospital {hospital.name} active status set to {hospital.is_active}"
    ))

    db.commit()
    db.refresh(hospital)
    return hospital

@router.get("/platform-metrics", response_model=schemas.PlatformMetricsOut)
def get_platform_metrics(
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    total_hospitals = db.query(models.Hospital).count()
    approved_hospitals = db.query(models.Hospital).filter(models.Hospital.verification_status == "APPROVED").count()
    pending_applications = db.query(models.Hospital).filter(models.Hospital.verification_status == "PENDING").count()

    beds = db.query(models.BedCategory).all()
    total_beds = sum(b.total_beds for b in beds)
    available_beds = sum(b.available_beds for b in beds)
    icu_available = sum(b.available_beds for b in beds if "ICU" in b.category.upper())

    ventilators = db.query(models.ResourceInventory).filter(
        models.ResourceInventory.resource_name.ilike("%ventilator%")
    ).all()
    ventilators_available = sum(v.quantity_available for v in ventilators)

    active_transfers = db.query(models.TransferRequest).filter(
        models.TransferRequest.transfer_status.in_(["INITIATED", "ACCEPTED_BY_TARGET", "IN_TRANSIT"])
    ).count()

    pending_emergency_requests = db.query(models.PatientRequest).filter(
        models.PatientRequest.status == "PENDING"
    ).count()

    hospitals = db.query(models.Hospital).filter(models.Hospital.is_active == True).all()
    available_ambulances = sum(h.available_ambulances for h in hospitals)

    return {
        "total_hospitals": total_hospitals,
        "approved_hospitals": approved_hospitals,
        "pending_applications": pending_applications,
        "total_beds": total_beds,
        "available_beds": available_beds,
        "icu_available": icu_available,
        "ventilators_available": ventilators_available,
        "active_transfers": active_transfers,
        "pending_emergency_requests": pending_emergency_requests,
        "available_ambulances": available_ambulances
    }

@router.get("/audit-logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(
    limit: int = 50,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
    return logs
