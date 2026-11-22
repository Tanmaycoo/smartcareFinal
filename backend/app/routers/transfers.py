import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/hospital/transfers", tags=["Hospital Transfers"])

def generate_transfer_code() -> str:
    return f"TRF-{random.randint(1000, 9999)}"

@router.get("", response_model=List[schemas.TransferRequestOut])
def list_hospital_transfers(
    direction: Optional[str] = Query("ALL", description="'OUTGOING', 'INCOMING', or 'ALL'"),
    hospital_id: Optional[int] = Query(None),
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id or hospital_id
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="Hospital ID required")

    query = db.query(models.TransferRequest)
    if direction == "OUTGOING":
        query = query.filter(models.TransferRequest.source_hospital_id == target_hospital_id)
    elif direction == "INCOMING":
        query = query.filter(models.TransferRequest.target_hospital_id == target_hospital_id)
    else:
        query = query.filter(
            (models.TransferRequest.source_hospital_id == target_hospital_id) |
            (models.TransferRequest.target_hospital_id == target_hospital_id)
        )

    transfers = query.order_by(models.TransferRequest.created_at.desc()).all()
    results = []
    for t in transfers:
        out = schemas.TransferRequestOut.from_orm(t)
        if t.source_hospital:
            out.source_hospital_name = t.source_hospital.name
        if t.target_hospital:
            out.target_hospital_name = t.target_hospital.name
        results.append(out)

    return results

@router.post("", response_model=schemas.TransferRequestOut)
def initiate_transfer(
    payload: schemas.TransferRequestCreate,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    source_hosp_id = current_user.hospital_id
    if not source_hosp_id:
        raise HTTPException(status_code=400, detail="Hospital ID missing from user session")

    if source_hosp_id == payload.target_hospital_id:
        raise HTTPException(status_code=400, detail="Source and destination hospitals cannot be identical")

    target_hosp = db.query(models.Hospital).filter(models.Hospital.id == payload.target_hospital_id).first()
    if not target_hosp:
        raise HTTPException(status_code=404, detail="Target hospital not found")

    source_hosp = db.query(models.Hospital).filter(models.Hospital.id == source_hosp_id).first()

    code = generate_transfer_code()
    transfer = models.TransferRequest(
        transfer_code=code,
        patient_name=payload.patient_name,
        source_hospital_id=source_hosp_id,
        target_hospital_id=payload.target_hospital_id,
        required_service=payload.required_service,
        priority=payload.priority,
        owner_doctor=payload.owner_doctor,
        deadline=payload.deadline,
        ambulance_assigned=payload.ambulance_assigned or "SmartCare ALS Unit #1",
        transfer_status="INITIATED",
        notes=payload.notes
    )
    db.add(transfer)

    # Decrement available ambulance if possible
    if source_hosp and source_hosp.available_ambulances > 0:
        source_hosp.available_ambulances -= 1

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="TRANSFER_INITIATED",
        entity_type="TRANSFER_REQUEST",
        entity_id=code,
        details=f"Transfer initiated for {payload.patient_name} to {target_hosp.name}. Priority: {payload.priority}, Deadline: {payload.deadline}, Lead: {payload.owner_doctor}"
    ))

    db.commit()
    db.refresh(transfer)

    out = schemas.TransferRequestOut.from_orm(transfer)
    out.source_hospital_name = source_hosp.name if source_hosp else ""
    out.target_hospital_name = target_hosp.name
    return out

@router.patch("/{transfer_id}/status", response_model=schemas.TransferRequestOut)
def update_transfer_status(
    transfer_id: int,
    payload: schemas.TransferRequestUpdate,
    current_user: models.User = Depends(auth.require_hospital),
    db: Session = Depends(get_db)
):
    transfer = db.query(models.TransferRequest).filter(models.TransferRequest.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")

    # Authorization check
    if current_user.role != "ADMIN":
        if current_user.hospital_id not in [transfer.source_hospital_id, transfer.target_hospital_id]:
            raise HTTPException(status_code=403, detail="Unauthorized for this transfer")

    transfer.transfer_status = payload.transfer_status
    if payload.notes:
        transfer.notes = (transfer.notes or "") + f" | Update: {payload.notes}"
    if payload.ambulance_assigned:
        transfer.ambulance_assigned = payload.ambulance_assigned

    # If completed or rejected, return ambulance
    if payload.transfer_status in ["COMPLETED", "REJECTED"]:
        source_hosp = db.query(models.Hospital).filter(models.Hospital.id == transfer.source_hospital_id).first()
        if source_hosp and source_hosp.available_ambulances < source_hosp.ambulance_count:
            source_hosp.available_ambulances += 1

    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="TRANSFER_STATUS_CHANGED",
        entity_type="TRANSFER_REQUEST",
        entity_id=transfer.transfer_code,
        details=f"Transfer {transfer.transfer_code} status set to {payload.transfer_status}"
    ))

    db.commit()
    db.refresh(transfer)

    out = schemas.TransferRequestOut.from_orm(transfer)
    if transfer.source_hospital:
        out.source_hospital_name = transfer.source_hospital.name
    if transfer.target_hospital:
        out.target_hospital_name = transfer.target_hospital.name
    return out
