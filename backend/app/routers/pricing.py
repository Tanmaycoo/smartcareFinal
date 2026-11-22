import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/pricing", tags=["Pricing & Services"])

STANDARD_CATEGORIES = [
    "Room and Bed Charges",
    "Emergency Services",
    "Ambulance Services",
    "Laboratory Services",
    "Diagnostic Services",
    "Other Services",
]

# ==============================================================================
# HOSPITAL PRICING MANAGEMENT ENDPOINTS
# ==============================================================================

@router.get("/hospital/metrics", response_model=schemas.PricingDashboardMetrics)
def get_hospital_pricing_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    services = db.query(models.HospitalService).filter(
        models.HospitalService.hospital_id == hospital_id,
        models.HospitalService.is_active == True
    ).all()

    total_services = len(services)
    published_count = 0
    draft_count = 0
    inactive_count = 0

    now = datetime.datetime.utcnow()
    seven_days_ago = now - datetime.timedelta(days=7)
    recently_updated_count = 0

    for s in services:
        price = db.query(models.HospitalPrice).filter(
            models.HospitalPrice.service_id == s.id
        ).order_by(models.HospitalPrice.created_at.desc()).first()

        if price:
            if price.status == "PUBLISHED":
                published_count += 1
            elif price.status == "DRAFT":
                draft_count += 1
            elif price.status == "INACTIVE" or price.status == "ARCHIVED":
                inactive_count += 1

            if price.updated_at and price.updated_at >= seven_days_ago:
                recently_updated_count += 1
        else:
            draft_count += 1

    return {
        "total_services": total_services,
        "published_services": published_count,
        "draft_services": draft_count,
        "inactive_services": inactive_count,
        "recently_updated_count": recently_updated_count,
    }

@router.get("/hospital/services", response_model=List[schemas.HospitalServiceOut])
def get_hospital_services(
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    query = db.query(models.HospitalService).filter(
        models.HospitalService.hospital_id == hospital_id,
        models.HospitalService.is_active == True
    )

    if category:
        query = query.filter(models.HospitalService.category == category)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.HospitalService.name.ilike(search_fmt),
                models.HospitalService.service_code.ilike(search_fmt),
                models.HospitalService.description.ilike(search_fmt)
            )
        )

    services = query.order_by(models.HospitalService.category, models.HospitalService.name).all()
    results = []

    for s in services:
        latest_price = db.query(models.HospitalPrice).filter(
            models.HospitalPrice.service_id == s.id
        ).order_by(models.HospitalPrice.created_at.desc()).first()

        if status_filter and latest_price:
            if latest_price.status.upper() != status_filter.upper():
                continue
        elif status_filter and not latest_price:
            if status_filter.upper() != "DRAFT":
                continue

        service_out = schemas.HospitalServiceOut.from_orm(s)
        if latest_price:
            service_out.current_price = schemas.HospitalPriceOut.from_orm(latest_price)
        results.append(service_out)

    return results

@router.post("/hospital/services", response_model=schemas.HospitalServiceOut, status_code=status.HTTP_201_CREATED)
def create_hospital_service(
    payload: schemas.HospitalServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id

    # Auto-generate service code if not provided
    service_code = payload.service_code
    if not service_code:
        prefix = "".join([w[0].upper() for w in payload.category.split()[:2]]) or "SRV"
        count = db.query(models.HospitalService).filter(models.HospitalService.hospital_id == hospital_id).count() + 1
        service_code = f"{prefix}-{count:03d}"

    service = models.HospitalService(
        hospital_id=hospital_id,
        service_code=service_code,
        name=payload.name.strip(),
        category=payload.category.strip(),
        description=payload.description.strip() if payload.description else None,
        billing_unit=payload.billing_unit.strip() or "per day",
        is_active=True
    )
    db.add(service)
    db.flush()

    latest_price = None
    if payload.initial_price is not None and payload.initial_price >= 0:
        price_status = payload.status if payload.status in ["DRAFT", "PUBLISHED"] else "DRAFT"
        price = models.HospitalPrice(
            hospital_id=hospital_id,
            service_id=service.id,
            price=payload.initial_price,
            status=price_status,
            effective_from=payload.effective_from or datetime.datetime.utcnow(),
            effective_until=payload.effective_until,
            notes="Initial price creation"
        )
        db.add(price)
        db.flush()
        latest_price = price

        # If published right away, add to price history
        if price_status == "PUBLISHED":
            db.add(models.PriceHistory(
                hospital_id=hospital_id,
                service_id=service.id,
                price_id=price.id,
                previous_price=None,
                new_price=payload.initial_price,
                previous_status=None,
                new_status="PUBLISHED",
                changed_by_user_id=current_user.id,
                changed_by_email=current_user.email,
                change_reason="Initial service publication"
            ))

    db.commit()
    db.refresh(service)

    service_out = schemas.HospitalServiceOut.from_orm(service)
    if latest_price:
        service_out.current_price = schemas.HospitalPriceOut.from_orm(latest_price)
    return service_out

@router.put("/hospital/services/{service_id}", response_model=schemas.HospitalServiceOut)
def update_hospital_service(
    service_id: int,
    payload: schemas.HospitalServiceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    service = db.query(models.HospitalService).filter(
        models.HospitalService.id == service_id,
        models.HospitalService.hospital_id == hospital_id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    if payload.name is not None:
        service.name = payload.name.strip()
    if payload.category is not None:
        service.category = payload.category.strip()
    if payload.description is not None:
        service.description = payload.description.strip()
    if payload.billing_unit is not None:
        service.billing_unit = payload.billing_unit.strip()
    if payload.service_code is not None:
        service.service_code = payload.service_code.strip()
    if payload.is_active is not None:
        service.is_active = payload.is_active

    service.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(service)

    latest_price = db.query(models.HospitalPrice).filter(
        models.HospitalPrice.service_id == service.id
    ).order_by(models.HospitalPrice.created_at.desc()).first()

    service_out = schemas.HospitalServiceOut.from_orm(service)
    if latest_price:
        service_out.current_price = schemas.HospitalPriceOut.from_orm(latest_price)
    return service_out

@router.delete("/hospital/services/{service_id}")
def delete_hospital_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    service = db.query(models.HospitalService).filter(
        models.HospitalService.id == service_id,
        models.HospitalService.hospital_id == hospital_id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Soft delete / deactivate to preserve historical audit trail
    service.is_active = False
    service.updated_at = datetime.datetime.utcnow()

    # Deactivate existing prices
    prices = db.query(models.HospitalPrice).filter(models.HospitalPrice.service_id == service.id).all()
    for p in prices:
        if p.status == "PUBLISHED":
            p.status = "ARCHIVED"
            p.updated_at = datetime.datetime.utcnow()

    db.commit()
    return {"message": "Service successfully deactivated and archived."}

@router.post("/hospital/services/{service_id}/price", response_model=schemas.HospitalPriceOut)
def update_or_create_service_price(
    service_id: int,
    payload: schemas.HospitalPriceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    service = db.query(models.HospitalService).filter(
        models.HospitalService.id == service_id,
        models.HospitalService.hospital_id == hospital_id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    latest_price = db.query(models.HospitalPrice).filter(
        models.HospitalPrice.service_id == service.id
    ).order_by(models.HospitalPrice.created_at.desc()).first()

    prev_price_val = latest_price.price if latest_price else None
    prev_status_val = latest_price.status if latest_price else None

    target_price_val = payload.price if payload.price is not None else (prev_price_val or 0.0)
    target_status = payload.status or (prev_status_val or "DRAFT")

    if latest_price:
        # Check if price changed or status changed
        price_changed = (payload.price is not None and payload.price != latest_price.price)
        status_changed = (payload.status is not None and payload.status != latest_price.status)

        if price_changed or status_changed:
            # Audit in price history
            db.add(models.PriceHistory(
                hospital_id=hospital_id,
                service_id=service.id,
                price_id=latest_price.id,
                previous_price=prev_price_val,
                new_price=target_price_val,
                previous_status=prev_status_val,
                new_status=target_status,
                changed_by_user_id=current_user.id,
                changed_by_email=current_user.email,
                change_reason=payload.change_reason or "Price / status update"
            ))

        if payload.price is not None:
            latest_price.price = payload.price
        if payload.status is not None:
            latest_price.status = payload.status
        if payload.effective_from is not None:
            latest_price.effective_from = payload.effective_from
        if payload.effective_until is not None:
            latest_price.effective_until = payload.effective_until
        if payload.notes is not None:
            latest_price.notes = payload.notes
        latest_price.updated_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(latest_price)
        return latest_price
    else:
        new_price = models.HospitalPrice(
            hospital_id=hospital_id,
            service_id=service.id,
            price=target_price_val,
            status=target_status,
            effective_from=payload.effective_from or datetime.datetime.utcnow(),
            effective_until=payload.effective_until,
            notes=payload.notes
        )
        db.add(new_price)
        db.flush()

        db.add(models.PriceHistory(
            hospital_id=hospital_id,
            service_id=service.id,
            price_id=new_price.id,
            previous_price=None,
            new_price=target_price_val,
            previous_status=None,
            new_status=target_status,
            changed_by_user_id=current_user.id,
            changed_by_email=current_user.email,
            change_reason=payload.change_reason or "First price configured"
        ))

        db.commit()
        db.refresh(new_price)
        return new_price

@router.post("/hospital/services/{service_id}/publish", response_model=schemas.HospitalPriceOut)
def publish_service_price(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    service = db.query(models.HospitalService).filter(
        models.HospitalService.id == service_id,
        models.HospitalService.hospital_id == hospital_id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    latest_price = db.query(models.HospitalPrice).filter(
        models.HospitalPrice.service_id == service.id
    ).order_by(models.HospitalPrice.created_at.desc()).first()

    if not latest_price:
        raise HTTPException(status_code=400, detail="Cannot publish service without configuring a price first.")

    prev_status = latest_price.status
    latest_price.status = "PUBLISHED"
    latest_price.effective_from = datetime.datetime.utcnow()
    latest_price.updated_at = datetime.datetime.utcnow()

    # Record history
    db.add(models.PriceHistory(
        hospital_id=hospital_id,
        service_id=service.id,
        price_id=latest_price.id,
        previous_price=latest_price.price,
        new_price=latest_price.price,
        previous_status=prev_status,
        new_status="PUBLISHED",
        changed_by_user_id=current_user.id,
        changed_by_email=current_user.email,
        change_reason="Published to patient portal"
    ))

    db.commit()
    db.refresh(latest_price)
    return latest_price

@router.post("/hospital/services/{service_id}/deactivate", response_model=schemas.HospitalPriceOut)
def deactivate_service_price(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    service = db.query(models.HospitalService).filter(
        models.HospitalService.id == service_id,
        models.HospitalService.hospital_id == hospital_id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    latest_price = db.query(models.HospitalPrice).filter(
        models.HospitalPrice.service_id == service.id
    ).order_by(models.HospitalPrice.created_at.desc()).first()

    if not latest_price:
        raise HTTPException(status_code=404, detail="No price found to deactivate")

    prev_status = latest_price.status
    latest_price.status = "INACTIVE"
    latest_price.updated_at = datetime.datetime.utcnow()

    db.add(models.PriceHistory(
        hospital_id=hospital_id,
        service_id=service.id,
        price_id=latest_price.id,
        previous_price=latest_price.price,
        new_price=latest_price.price,
        previous_status=prev_status,
        new_status="INACTIVE",
        changed_by_user_id=current_user.id,
        changed_by_email=current_user.email,
        change_reason="Deactivated from public rates"
    ))

    db.commit()
    db.refresh(latest_price)
    return latest_price

@router.get("/hospital/history", response_model=List[schemas.PriceHistoryOut])
def get_hospital_price_history(
    service_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    query = db.query(models.PriceHistory).filter(models.PriceHistory.hospital_id == hospital_id)

    if service_id:
        query = query.filter(models.PriceHistory.service_id == service_id)

    records = query.order_by(models.PriceHistory.changed_at.desc()).all()
    results = []

    for r in records:
        srv = db.query(models.HospitalService).filter(models.HospitalService.id == r.service_id).first()
        item = schemas.PriceHistoryOut.from_orm(r)
        item.service_name = srv.name if srv else "Unknown Service"
        results.append(item)

    return results

@router.get("/hospital/preview", response_model=List[schemas.PublicServicePriceItem])
def preview_hospital_rate_card(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_hospital)
):
    hospital_id = current_user.hospital_id
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    services = db.query(models.HospitalService).filter(
        models.HospitalService.hospital_id == hospital_id,
        models.HospitalService.is_active == True
    ).all()

    items = []
    now = datetime.datetime.utcnow()

    for s in services:
        price = db.query(models.HospitalPrice).filter(
            models.HospitalPrice.service_id == s.id,
            models.HospitalPrice.status == "PUBLISHED"
        ).order_by(models.HospitalPrice.created_at.desc()).first()

        if price:
            items.append(schemas.PublicServicePriceItem(
                service_id=s.id,
                service_name=s.name,
                category=s.category,
                description=s.description,
                billing_unit=s.billing_unit,
                price=price.price,
                hospital_id=hospital.id,
                hospital_name=hospital.name,
                hospital_city=hospital.city,
                hospital_address=hospital.address,
                hospital_phone=hospital.emergency_phone,
                hospital_verification_status=hospital.verification_status,
                effective_from=price.effective_from or now,
                effective_until=price.effective_until,
                last_updated=price.updated_at or price.created_at or now
            ))

    return items


# ==============================================================================
# PUBLIC & PATIENT PRICING ENDPOINTS
# ==============================================================================

@router.get("/categories", response_model=List[str])
def get_service_categories(db: Session = Depends(get_db)):
    # Distinct categories present in DB plus standard categories
    db_cats = [r[0] for r in db.query(models.HospitalService.category).distinct().all() if r[0]]
    combined = list(dict.fromkeys(STANDARD_CATEGORIES + db_cats))
    return combined

@router.get("/hospitals/{hospital_id}", response_model=List[schemas.PublicServicePriceItem])
def get_hospital_published_pricing(
    hospital_id: int,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    query = db.query(models.HospitalService).filter(
        models.HospitalService.hospital_id == hospital_id,
        models.HospitalService.is_active == True
    )

    if category:
        query = query.filter(models.HospitalService.category == category)

    services = query.order_by(models.HospitalService.category, models.HospitalService.name).all()
    results = []
    now = datetime.datetime.utcnow()

    for s in services:
        # Only ACTIVE & PUBLISHED prices
        price = db.query(models.HospitalPrice).filter(
            models.HospitalPrice.service_id == s.id,
            models.HospitalPrice.status == "PUBLISHED"
        ).order_by(models.HospitalPrice.created_at.desc()).first()

        if price:
            results.append(schemas.PublicServicePriceItem(
                service_id=s.id,
                service_name=s.name,
                category=s.category,
                description=s.description,
                billing_unit=s.billing_unit,
                price=price.price,
                hospital_id=hospital.id,
                hospital_name=hospital.name,
                hospital_city=hospital.city,
                hospital_address=hospital.address,
                hospital_phone=hospital.emergency_phone,
                hospital_verification_status=hospital.verification_status,
                effective_from=price.effective_from or now,
                effective_until=price.effective_until,
                last_updated=price.updated_at or price.created_at or now
            ))

    return results

@router.get("/services", response_model=List[schemas.PublicServicePriceItem])
def search_published_services(
    search: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    hospital_id: Optional[int] = None,
    sort_by: Optional[str] = Query(None, description="'price_asc', 'price_desc', 'name_asc'"),
    db: Session = Depends(get_db)
):
    # Only return services from APPROVED hospitals with active & published prices
    query = db.query(
        models.HospitalService,
        models.HospitalPrice,
        models.Hospital
    ).join(
        models.HospitalPrice, models.HospitalPrice.service_id == models.HospitalService.id
    ).join(
        models.Hospital, models.Hospital.id == models.HospitalService.hospital_id
    ).filter(
        models.Hospital.verification_status == "APPROVED",
        models.HospitalService.is_active == True,
        models.HospitalPrice.status == "PUBLISHED"
    )

    if hospital_id:
        query = query.filter(models.Hospital.id == hospital_id)
    if city:
        query = query.filter(models.Hospital.city.ilike(f"%{city.strip()}%"))
    if category:
        query = query.filter(models.HospitalService.category == category)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.HospitalService.name.ilike(search_fmt),
                models.HospitalService.description.ilike(search_fmt),
                models.Hospital.name.ilike(search_fmt)
            )
        )

    if sort_by == "price_asc":
        query = query.order_by(models.HospitalPrice.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(models.HospitalPrice.price.desc())
    elif sort_by == "name_asc":
        query = query.order_by(models.HospitalService.name.asc())
    else:
        query = query.order_by(models.Hospital.name.asc(), models.HospitalService.category.asc())

    rows = query.all()
    results = []
    now = datetime.datetime.utcnow()

    for s, p, h in rows:
        results.append(schemas.PublicServicePriceItem(
            service_id=s.id,
            service_name=s.name,
            category=s.category,
            description=s.description,
            billing_unit=s.billing_unit,
            price=p.price,
            hospital_id=h.id,
            hospital_name=h.name,
            hospital_city=h.city,
            hospital_address=h.address,
            hospital_phone=h.emergency_phone,
            hospital_verification_status=h.verification_status,
            effective_from=p.effective_from or now,
            effective_until=p.effective_until,
            last_updated=p.updated_at or p.created_at or now
        ))

    return results

@router.post("/estimate", response_model=schemas.CostEstimateResponse)
def calculate_cost_estimate(
    payload: schemas.CostEstimateRequest,
    db: Session = Depends(get_db)
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == payload.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="At least one service must be selected to generate a cost estimate.")

    item_results = []
    subtotal = 0.0

    for item_input in payload.items:
        service = db.query(models.HospitalService).filter(
            models.HospitalService.id == item_input.service_id,
            models.HospitalService.hospital_id == hospital.id,
            models.HospitalService.is_active == True
        ).first()

        if not service:
            continue

        latest_price = db.query(models.HospitalPrice).filter(
            models.HospitalPrice.service_id == service.id,
            models.HospitalPrice.status == "PUBLISHED"
        ).order_by(models.HospitalPrice.created_at.desc()).first()

        if not latest_price:
            # Service does not have an active published rate
            continue

        qty = max(0.1, float(item_input.quantity))
        item_total = round(latest_price.price * qty, 2)
        subtotal += item_total

        item_results.append(schemas.CostEstimateItemResult(
            service_id=service.id,
            service_name=service.name,
            category=service.category,
            billing_unit=service.billing_unit,
            unit_price=latest_price.price,
            quantity=qty,
            item_total=item_total
        ))

    if not item_results:
        raise HTTPException(status_code=400, detail="None of the selected services have published pricing available for this hospital.")

    tax_pct = max(0.0, float(payload.tax_percentage or 0.0))
    disc_pct = max(0.0, float(payload.discount_percentage or 0.0))

    discount_amount = round(subtotal * (disc_pct / 100.0), 2)
    after_discount = max(0.0, subtotal - discount_amount)
    tax_amount = round(after_discount * (tax_pct / 100.0), 2)
    estimated_total = round(after_discount + tax_amount, 2)

    return schemas.CostEstimateResponse(
        hospital_id=hospital.id,
        hospital_name=hospital.name,
        items=item_results,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        estimated_total=estimated_total,
        generated_at=datetime.datetime.utcnow(),
        disclaimer=(
            "Prices shown are published by the hospital and are for informational purposes. "
            "Actual charges may vary depending on the services provided, treatment requirements, "
            "length of stay, additional procedures and applicable fees. Contact the hospital to confirm the final cost."
        )
    )
