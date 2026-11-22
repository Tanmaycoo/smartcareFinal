from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Contact platform administrator.",
        )

    # Check expected role if specified by specialized portal
    if login_data.expected_role and user.role != login_data.expected_role and user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This portal is for {login_data.expected_role} users. Your account role is {user.role}.",
        )

    hospital_name = None
    blood_bank_name = None
    verification_status = None
    if user.hospital_id:
        hosp = db.query(models.Hospital).filter(models.Hospital.id == user.hospital_id).first()
        if hosp:
            hospital_name = hosp.name
            verification_status = hosp.verification_status

            # Strict security gate: Do NOT allow hospital login until SuperAdmin approves
            if user.role == "HOSPITAL" and hosp.verification_status != "APPROVED":
                if hosp.verification_status == "REJECTED":
                    reason = hosp.rejection_reason or "Uploaded medical establishment documents did not meet state accreditation criteria."
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"APPLICATION REJECTED: Your hospital registration was rejected by SuperAdmin. Reason: {reason}"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="APPLICATION PENDING APPROVAL: Your hospital registration and uploaded license documents are currently under review by SuperAdmin. Hospital Command Dashboard access is locked until SuperAdmin verifies and approves your application."
                    )

    if user.blood_bank_id:
        bb = db.query(models.BloodBank).filter(models.BloodBank.id == user.blood_bank_id).first()
        if bb:
            blood_bank_name = bb.name
            if not verification_status:
                verification_status = bb.verification_status

    token_data = {
        "sub": user.email,
        "role": user.role,
        "user_id": user.id,
        "hospital_id": user.hospital_id,
        "blood_bank_id": user.blood_bank_id
    }
    access_token = auth.create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "hospital_id": user.hospital_id,
        "hospital_name": hospital_name,
        "blood_bank_id": user.blood_bank_id,
        "blood_bank_name": blood_bank_name,
        "verification_status": verification_status
    }

@router.post("/register-patient", response_model=schemas.Token)
def register_patient(payload: schemas.UserRegisterPatient, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    user = models.User(
        email=payload.email,
        hashed_password=auth.get_password_hash(payload.password),
        name=payload.name,
        phone=payload.phone,
        role="PATIENT",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_data = {
        "sub": user.email,
        "role": user.role,
        "user_id": user.id,
        "hospital_id": None
    }
    access_token = auth.create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "hospital_id": None,
        "hospital_name": None,
        "verification_status": None
    }

@router.post("/register-hospital", response_model=schemas.HospitalRegisterResponse)
def register_hospital(payload: schemas.HospitalRegisterRequest, db: Session = Depends(get_db)):
    # Check if user email or hospital email/license already exists
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
    if db.query(models.Hospital).filter(models.Hospital.license_number == payload.license_number).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already in use")

    import json
    docs_payload = payload.documents_summary or "Medical License, NABH Certificate, Fire Safety NOC"
    if payload.uploaded_documents:
        docs_payload = json.dumps(payload.uploaded_documents)

    # Create Hospital record with PENDING verification status
    hospital = models.Hospital(
        name=payload.name,
        license_number=payload.license_number,
        type=payload.type,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        latitude=payload.latitude,
        longitude=payload.longitude,
        emergency_phone=payload.emergency_phone,
        reception_phone=payload.reception_phone,
        email=payload.email,
        website=payload.website,
        verification_status="PENDING",
        documents=docs_payload,
        total_capacity=payload.total_capacity,
        ambulance_count=payload.ambulance_count,
        available_ambulances=max(1, payload.ambulance_count - 1),
        is_active=True
    )
    db.add(hospital)
    db.flush()

    # New hospital starts clean with 0 beds and 0 resources.
    # Hospital staff will manually configure their wards, beds, and inventory upon login.

    # Create user account for the hospital
    user = models.User(
        email=payload.email,
        hashed_password=auth.get_password_hash(payload.password),
        name=f"Admin - {payload.name}",
        phone=payload.emergency_phone,
        role="HOSPITAL",
        is_active=True,
        hospital_id=hospital.id
    )
    db.add(user)

    # Add audit log
    db.add(models.AuditLog(
        actor_email=payload.email,
        actor_role="HOSPITAL",
        action="HOSPITAL_APPLICATION_SUBMITTED",
        entity_type="HOSPITAL",
        entity_id=str(hospital.id),
        details=f"New hospital application registered: {payload.name} (License: {payload.license_number})"
    ))

    db.commit()
    db.refresh(hospital)

    return {
        "message": "Hospital application submitted successfully. Your registration is queued for SuperAdmin document review. Access to the Hospital Command Dashboard will activate once SuperAdmin approves your licenses.",
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "license_number": hospital.license_number,
        "verification_status": hospital.verification_status
    }

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
