import datetime
import random
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/billing", tags=["Billing & Payments"])

def generate_bill_number(db: Session, hospital_id: int) -> str:
    year = datetime.datetime.utcnow().year
    count = db.query(models.PatientBill).filter(
        models.PatientBill.hospital_id == hospital_id
    ).count() + 1
    rand_suffix = random.randint(100, 999)
    return f"SC-BILL-{year}-{hospital_id:03d}-{count:04d}-{rand_suffix}"

def generate_receipt_number(db: Session, bill_id: int) -> str:
    year = datetime.datetime.utcnow().year
    count = db.query(models.Payment).count() + 1
    rand_suffix = random.randint(100, 999)
    return f"SC-RCP-{year}-{count:05d}-{rand_suffix}"

# ==============================================================================
# HOSPITAL BILLING MANAGEMENT ENDPOINTS
# ==============================================================================

@router.get("/hospital/metrics", response_model=schemas.HospitalBillingMetrics)
def get_hospital_billing_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    bills = db.query(models.PatientBill).filter(models.PatientBill.hospital_id == hospital_id).all()

    total_bills = len(bills)
    total_billed = 0.0
    total_collected = 0.0
    total_outstanding = 0.0

    draft_bills = 0
    issued_bills = 0
    partially_paid_bills = 0
    paid_bills = 0
    overdue_bills = 0

    now = datetime.datetime.utcnow()

    for b in bills:
        # Do not include CANCELLED in financial summaries
        if b.status == "CANCELLED":
            continue

        total_billed += (b.total_amount or 0.0)
        total_collected += (b.amount_paid or 0.0)
        total_outstanding += (b.balance_due or 0.0)

        # Check overdue if not fully paid and due_date has passed
        is_overdue = b.due_date and b.due_date < now and b.balance_due > 0 and b.status not in ["PAID", "CANCELLED"]

        if is_overdue and b.status != "OVERDUE":
            b.status = "OVERDUE"
            overdue_bills += 1
        elif b.status == "DRAFT":
            draft_bills += 1
        elif b.status == "ISSUED":
            issued_bills += 1
        elif b.status == "PARTIALLY_PAID":
            partially_paid_bills += 1
        elif b.status == "PAID":
            paid_bills += 1
        elif b.status == "OVERDUE":
            overdue_bills += 1

    db.commit()

    return schemas.HospitalBillingMetrics(
        total_bills=total_bills,
        total_billed=round(total_billed, 2),
        total_collected=round(total_collected, 2),
        total_outstanding=round(total_outstanding, 2),
        draft_bills=draft_bills,
        issued_bills=issued_bills,
        partially_paid_bills=partially_paid_bills,
        paid_bills=paid_bills,
        overdue_bills=overdue_bills
    )

@router.get("/hospital/bills", response_model=List[schemas.PatientBillOut])
def get_hospital_bills(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    start_date: Optional[datetime.datetime] = None,
    end_date: Optional[datetime.datetime] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    query = db.query(models.PatientBill).filter(models.PatientBill.hospital_id == hospital_id)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(models.PatientBill.status == status_filter.upper())

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.PatientBill.bill_number.ilike(search_fmt),
                models.PatientBill.patient_name.ilike(search_fmt),
                models.PatientBill.patient_phone.ilike(search_fmt),
                models.PatientBill.patient_email.ilike(search_fmt)
            )
        )

    if start_date:
        query = query.filter(models.PatientBill.bill_date >= start_date)
    if end_date:
        query = query.filter(models.PatientBill.bill_date <= end_date)

    bills = query.order_by(models.PatientBill.created_at.desc()).all()
    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()

    results = []
    for b in bills:
        bill_out = schemas.PatientBillOut.from_orm(b)
        if hosp:
            bill_out.hospital_name = hosp.name
            bill_out.hospital_address = hosp.address
            bill_out.hospital_phone = hosp.emergency_phone
        results.append(bill_out)

    return results

@router.post("/hospital/bills", response_model=schemas.PatientBillOut, status_code=status.HTTP_201_CREATED)
def create_patient_bill(
    payload: schemas.PatientBillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot create a bill without line items.")

    # Match patient if patient_id is not provided but email/phone is given
    patient_id = payload.patient_id
    if not patient_id and payload.patient_email:
        patient_user = db.query(models.User).filter(models.User.email == payload.patient_email.strip().lower()).first()
        if patient_user:
            patient_id = patient_user.id
    if not patient_id and payload.patient_phone:
        clean_p = re.sub(r"\D", "", payload.patient_phone)
        if clean_p and len(clean_p) >= 10:
            patient_user = db.query(models.User).filter(models.User.phone.like(f"%{clean_p[-10:]}%")).first()
            if patient_user:
                patient_id = patient_user.id

    bill_number = generate_bill_number(db, hospital_id)

    # Calculate item totals authoritative on the backend
    subtotal = 0.0
    bill_items_to_create = []

    for item in payload.items:
        qty = max(0.01, float(item.quantity))
        u_price = max(0.0, float(item.unit_price))
        total_item_price = round(qty * u_price, 2)
        subtotal += total_item_price

        bill_items_to_create.append({
            "service_id": item.service_id,
            "service_name": item.service_name.strip(),
            "category": item.category.strip() if item.category else None,
            "quantity": qty,
            "unit_price": u_price,
            "total_price": total_item_price,
            "notes": item.notes.strip() if item.notes else None
        })

    subtotal = round(subtotal, 2)
    tax_amount = round(max(0.0, float(payload.tax_amount or 0.0)), 2)
    discount_amount = round(max(0.0, float(payload.discount_amount or 0.0)), 2)
    total_amount = round(max(0.0, (subtotal + tax_amount) - discount_amount), 2)
    balance_due = total_amount

    # Create bill record
    bill = models.PatientBill(
        bill_number=bill_number,
        hospital_id=hospital_id,
        patient_id=patient_id,
        patient_name=payload.patient_name.strip(),
        patient_phone=payload.patient_phone.strip() if payload.patient_phone else None,
        patient_email=payload.patient_email.strip().lower() if payload.patient_email else None,
        admission_date=payload.admission_date,
        discharge_date=payload.discharge_date,
        bill_date=datetime.datetime.utcnow(),
        due_date=payload.due_date or (datetime.datetime.utcnow() + datetime.timedelta(days=14)),
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        amount_paid=0.0,
        balance_due=balance_due,
        status="ISSUED",
        notes=payload.notes.strip() if payload.notes else None
    )
    db.add(bill)
    db.flush()

    for item_data in bill_items_to_create:
        bill_item = models.BillItem(
            bill_id=bill.id,
            service_id=item_data["service_id"],
            service_name=item_data["service_name"],
            category=item_data["category"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            total_price=item_data["total_price"],
            notes=item_data["notes"]
        )
        db.add(bill_item)

    # Log to audit trail
    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="BILL_CREATED",
        entity_type="PATIENT_BILL",
        entity_id=str(bill.id),
        details=f"Created bill {bill.bill_number} for {bill.patient_name} of amount ₹{total_amount}"
    ))

    db.commit()
    db.refresh(bill)

    bill_out = schemas.PatientBillOut.from_orm(bill)
    bill_out.hospital_name = hosp.name
    bill_out.hospital_address = hosp.address
    bill_out.hospital_phone = hosp.emergency_phone
    return bill_out

@router.get("/hospital/bills/{bill_id}", response_model=schemas.PatientBillOut)
def get_hospital_bill_detail(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    bill = db.query(models.PatientBill).filter(
        models.PatientBill.id == bill_id,
        models.PatientBill.hospital_id == hospital_id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    bill_out = schemas.PatientBillOut.from_orm(bill)
    if hosp:
        bill_out.hospital_name = hosp.name
        bill_out.hospital_address = hosp.address
        bill_out.hospital_phone = hosp.emergency_phone
    return bill_out

@router.put("/hospital/bills/{bill_id}", response_model=schemas.PatientBillOut)
def update_hospital_bill(
    bill_id: int,
    payload: schemas.PatientBillUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    bill = db.query(models.PatientBill).filter(
        models.PatientBill.id == bill_id,
        models.PatientBill.hospital_id == hospital_id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if payload.patient_name is not None:
        bill.patient_name = payload.patient_name.strip()
    if payload.patient_phone is not None:
        bill.patient_phone = payload.patient_phone.strip()
    if payload.patient_email is not None:
        bill.patient_email = payload.patient_email.strip().lower()
    if payload.admission_date is not None:
        bill.admission_date = payload.admission_date
    if payload.discharge_date is not None:
        bill.discharge_date = payload.discharge_date
    if payload.due_date is not None:
        bill.due_date = payload.due_date
    if payload.notes is not None:
        bill.notes = payload.notes.strip()
    if payload.status is not None:
        bill.status = payload.status.upper()

    recalc = False
    if payload.tax_amount is not None:
        bill.tax_amount = round(max(0.0, float(payload.tax_amount)), 2)
        recalc = True
    if payload.discount_amount is not None:
        bill.discount_amount = round(max(0.0, float(payload.discount_amount)), 2)
        recalc = True

    if recalc:
        bill.total_amount = round(max(0.0, (bill.subtotal + bill.tax_amount) - bill.discount_amount), 2)
        bill.balance_due = round(max(0.0, bill.total_amount - (bill.amount_paid or 0.0)), 2)
        if bill.balance_due == 0 and bill.amount_paid > 0:
            bill.status = "PAID"

    bill.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(bill)

    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    bill_out = schemas.PatientBillOut.from_orm(bill)
    if hosp:
        bill_out.hospital_name = hosp.name
        bill_out.hospital_address = hosp.address
        bill_out.hospital_phone = hosp.emergency_phone
    return bill_out

@router.post("/hospital/bills/{bill_id}/issue", response_model=schemas.PatientBillOut)
def issue_hospital_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    bill = db.query(models.PatientBill).filter(
        models.PatientBill.id == bill_id,
        models.PatientBill.hospital_id == hospital_id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    bill.status = "ISSUED"
    bill.bill_date = datetime.datetime.utcnow()
    bill.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(bill)

    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    bill_out = schemas.PatientBillOut.from_orm(bill)
    if hosp:
        bill_out.hospital_name = hosp.name
        bill_out.hospital_address = hosp.address
        bill_out.hospital_phone = hosp.emergency_phone
    return bill_out

@router.post("/hospital/bills/{bill_id}/cancel", response_model=schemas.PatientBillOut)
def cancel_hospital_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    bill = db.query(models.PatientBill).filter(
        models.PatientBill.id == bill_id,
        models.PatientBill.hospital_id == hospital_id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if (bill.amount_paid or 0.0) > 0:
        raise HTTPException(status_code=400, detail="Cannot cancel a bill that already has recorded payments.")

    bill.status = "CANCELLED"
    bill.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(bill)

    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    bill_out = schemas.PatientBillOut.from_orm(bill)
    if hosp:
        bill_out.hospital_name = hosp.name
        bill_out.hospital_address = hosp.address
        bill_out.hospital_phone = hosp.emergency_phone
    return bill_out

@router.post("/hospital/bills/{bill_id}/payments", response_model=schemas.PatientBillOut)
def record_bill_payment(
    bill_id: int,
    payload: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    bill = db.query(models.PatientBill).filter(
        models.PatientBill.id == bill_id,
        models.PatientBill.hospital_id == hospital_id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cannot record payments on a cancelled bill.")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")

    receipt_number = generate_receipt_number(db, bill.id)

    payment = models.Payment(
        receipt_number=receipt_number,
        bill_id=bill.id,
        amount=round(payload.amount, 2),
        payment_method=payload.payment_method.upper(),
        transaction_reference=payload.transaction_reference.strip() if payload.transaction_reference else None,
        payment_date=datetime.datetime.utcnow(),
        received_by=current_user.name,
        notes=payload.notes.strip() if payload.notes else None
    )
    db.add(payment)
    db.flush()

    # Update bill amounts and status
    new_amount_paid = round((bill.amount_paid or 0.0) + payload.amount, 2)
    new_balance = round(max(0.0, bill.total_amount - new_amount_paid), 2)

    bill.amount_paid = new_amount_paid
    bill.balance_due = new_balance

    if new_balance == 0.0:
        bill.status = "PAID"
    else:
        bill.status = "PARTIALLY_PAID"

    bill.updated_at = datetime.datetime.utcnow()

    # Log to audit trail
    db.add(models.AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="PAYMENT_RECORDED",
        entity_type="PAYMENT",
        entity_id=receipt_number,
        details=f"Recorded payment of ₹{payload.amount} via {payload.payment_method} for bill {bill.bill_number}"
    ))

    db.commit()
    db.refresh(bill)

    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    bill_out = schemas.PatientBillOut.from_orm(bill)
    if hosp:
        bill_out.hospital_name = hosp.name
        bill_out.hospital_address = hosp.address
        bill_out.hospital_phone = hosp.emergency_phone
    return bill_out


# ==============================================================================
# PATIENT BILLING ACCESS ENDPOINTS
# ==============================================================================

@router.get("/patient/bills/lookup", response_model=List[schemas.PatientBillOut])
def lookup_patient_bills(
    query: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """
    Public lookup for patient bills by bill_number, ticket_code, patient_phone,
    or patient_name. Allows patients to immediately find and track their issued invoices.
    """
    base_query = db.query(models.PatientBill).filter(
        models.PatientBill.status.in_(["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"])
    )

    if query and query.strip():
        q = query.strip()
        clean_digits = re.sub(r"\D", "", q)
        q_filter = [
            models.PatientBill.bill_number.ilike(f"%{q}%"),
            models.PatientBill.patient_name.ilike(f"%{q}%"),
            models.PatientBill.patient_email.ilike(f"%{q}%"),
            models.PatientBill.notes.ilike(f"%{q}%"),
        ]
        if clean_digits and len(clean_digits) >= 4:
            phone_clean_expr = func.replace(func.replace(func.replace(models.PatientBill.patient_phone, '-', ''), ' ', ''), '+', '')
            q_filter.append(phone_clean_expr.like(f"%{clean_digits}%"))
            if len(clean_digits) >= 10:
                q_filter.append(phone_clean_expr.like(f"%{clean_digits[-10:]}%"))

        base_query = base_query.filter(or_(*q_filter))

    if status_filter and status_filter.upper() != "ALL":
        base_query = base_query.filter(models.PatientBill.status == status_filter.upper())

    bills = base_query.order_by(models.PatientBill.created_at.desc()).limit(50).all()
    results = []

    for b in bills:
        hosp = db.query(models.Hospital).filter(models.Hospital.id == b.hospital_id).first()
        bill_out = schemas.PatientBillOut.from_orm(b)
        if hosp:
            bill_out.hospital_name = hosp.name
            bill_out.hospital_address = hosp.address
            bill_out.hospital_phone = hosp.emergency_phone
        results.append(bill_out)

    return results

@router.get("/patient/bills", response_model=List[schemas.PatientBillOut])
def get_patient_bills(
    status_filter: Optional[str] = Query(None, alias="status"),
    query_str: Optional[str] = Query(None, alias="query"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    base_query = db.query(models.PatientBill).filter(
        models.PatientBill.status.in_(["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"])
    )

    if current_user:
        user_email = (current_user.email or "").strip().lower()
        user_phone = (current_user.phone or "").strip()
        clean_user_phone = re.sub(r"\D", "", user_phone)

        filters = [models.PatientBill.patient_id == current_user.id]
        if user_email:
            filters.append(models.PatientBill.patient_email.ilike(user_email))
        if user_phone:
            filters.append(models.PatientBill.patient_phone == user_phone)
        if clean_user_phone and len(clean_user_phone) >= 10:
            phone_clean_expr = func.replace(func.replace(func.replace(models.PatientBill.patient_phone, '-', ''), ' ', ''), '+', '')
            filters.append(phone_clean_expr.like(f"%{clean_user_phone[-10:]}%"))
        if current_user.name and len(current_user.name.strip()) >= 3:
            filters.append(models.PatientBill.patient_name.ilike(f"%{current_user.name.strip()}%"))

        base_query = base_query.filter(or_(*filters))
    elif query_str and query_str.strip():
        q = query_str.strip()
        clean_digits = re.sub(r"\D", "", q)
        q_filter = [
            models.PatientBill.bill_number.ilike(f"%{q}%"),
            models.PatientBill.patient_name.ilike(f"%{q}%"),
            models.PatientBill.patient_email.ilike(f"%{q}%"),
            models.PatientBill.notes.ilike(f"%{q}%"),
        ]
        if clean_digits and len(clean_digits) >= 4:
            phone_clean_expr = func.replace(func.replace(func.replace(models.PatientBill.patient_phone, '-', ''), ' ', ''), '+', '')
            q_filter.append(phone_clean_expr.like(f"%{clean_digits}%"))
            if len(clean_digits) >= 10:
                q_filter.append(phone_clean_expr.like(f"%{clean_digits[-10:]}%"))
        base_query = base_query.filter(or_(*q_filter))

    if status_filter and status_filter.upper() != "ALL":
        base_query = base_query.filter(models.PatientBill.status == status_filter.upper())

    bills = base_query.order_by(models.PatientBill.created_at.desc()).limit(50).all()
    results = []

    for b in bills:
        hosp = db.query(models.Hospital).filter(models.Hospital.id == b.hospital_id).first()
        bill_out = schemas.PatientBillOut.from_orm(b)
        if hosp:
            bill_out.hospital_name = hosp.name
            bill_out.hospital_address = hosp.address
            bill_out.hospital_phone = hosp.emergency_phone
        results.append(bill_out)

    return results

@router.get("/patient/bills/{bill_id}", response_model=schemas.PatientBillOut)
def get_patient_bill_detail(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    bill = db.query(models.PatientBill).filter(models.PatientBill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.status == "DRAFT":
        if not current_user or current_user.role not in ["ADMIN", "HOSPITAL"]:
            raise HTTPException(status_code=403, detail="Bill is not yet issued.")

    hosp = db.query(models.Hospital).filter(models.Hospital.id == bill.hospital_id).first()
    bill_out = schemas.PatientBillOut.from_orm(bill)
    if hosp:
        bill_out.hospital_name = hosp.name
        bill_out.hospital_address = hosp.address
        bill_out.hospital_phone = hosp.emergency_phone
    return bill_out


# ==============================================================================
# ADMIN BILLING OVERSIGHT ENDPOINTS
# ==============================================================================

@router.get("/admin/overview", response_model=schemas.AdminBillingOverview)
def get_admin_billing_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    hospitals = db.query(models.Hospital).all()

    total_platform_billed = 0.0
    total_platform_collected = 0.0
    total_platform_outstanding = 0.0
    total_platform_bills = 0

    summaries = []

    for h in hospitals:
        bills = db.query(models.PatientBill).filter(
            models.PatientBill.hospital_id == h.id,
            models.PatientBill.status != "CANCELLED"
        ).all()

        h_billed = sum([b.total_amount or 0.0 for b in bills])
        h_collected = sum([b.amount_paid or 0.0 for b in bills])
        h_outstanding = sum([b.balance_due or 0.0 for b in bills])
        h_bills_count = len(bills)

        published_services_count = db.query(models.HospitalPrice).filter(
            models.HospitalPrice.hospital_id == h.id,
            models.HospitalPrice.status == "PUBLISHED"
        ).count()

        latest_bill = db.query(models.PatientBill).filter(
            models.PatientBill.hospital_id == h.id
        ).order_by(models.PatientBill.updated_at.desc()).first()

        last_activity = latest_bill.updated_at if latest_bill else h.updated_at

        total_platform_billed += h_billed
        total_platform_collected += h_collected
        total_platform_outstanding += h_outstanding
        total_platform_bills += h_bills_count

        summaries.append(schemas.AdminBillingSummary(
            hospital_id=h.id,
            hospital_name=h.name,
            hospital_city=h.city,
            total_bills=h_bills_count,
            total_billed=round(h_billed, 2),
            total_collected=round(h_collected, 2),
            total_outstanding=round(h_outstanding, 2),
            published_services_count=published_services_count,
            last_activity=last_activity
        ))

    return schemas.AdminBillingOverview(
        total_platform_billed=round(total_platform_billed, 2),
        total_platform_collected=round(total_platform_collected, 2),
        total_platform_outstanding=round(total_platform_outstanding, 2),
        total_platform_bills=total_platform_bills,
        hospital_summaries=summaries
    )
