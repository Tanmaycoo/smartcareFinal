import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default="PATIENT")  # PATIENT, HOSPITAL, ADMIN
    is_active = Column(Boolean, default=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    blood_bank_id = Column(Integer, ForeignKey("blood_banks.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="users")
    blood_bank = relationship("BloodBank", back_populates="users")
    bills = relationship("PatientBill", back_populates="patient")
    donor_profile = relationship("BloodDonor", back_populates="user", uselist=False)

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    license_number = Column(String(100), unique=True, index=True, nullable=False)
    type = Column(String(100), default="Multispecialty")  # General, Tertiary, Trauma Center, Specialty, Multispecialty
    address = Column(String(500), nullable=False)
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False, default=18.5204)
    longitude = Column(Float, nullable=False, default=73.8567)
    emergency_phone = Column(String(50), nullable=False)
    reception_phone = Column(String(50), nullable=True)
    email = Column(String(255), unique=True, nullable=False)
    website = Column(String(255), nullable=True)
    verification_status = Column(String(50), default="PENDING")  # PENDING, APPROVED, REJECTED
    rejection_reason = Column(Text, nullable=True)
    verification_notes = Column(Text, nullable=True)
    documents = Column(Text, nullable=True)  # JSON-encoded array of documents
    total_capacity = Column(Integer, default=100)
    ambulance_count = Column(Integer, default=5)
    available_ambulances = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    users = relationship("User", back_populates="hospital")
    beds = relationship("BedCategory", back_populates="hospital", cascade="all, delete-orphan")
    resources = relationship("ResourceInventory", back_populates="hospital", cascade="all, delete-orphan")
    requests = relationship("PatientRequest", back_populates="hospital", cascade="all, delete-orphan")
    outgoing_transfers = relationship("TransferRequest", foreign_keys="TransferRequest.source_hospital_id", back_populates="source_hospital")
    incoming_transfers = relationship("TransferRequest", foreign_keys="TransferRequest.target_hospital_id", back_populates="target_hospital")
    outgoing_referrals = relationship("HospitalReferral", foreign_keys="HospitalReferral.referring_hospital_id", back_populates="referring_hospital")
    incoming_referrals = relationship("HospitalReferral", foreign_keys="HospitalReferral.receiving_hospital_id", back_populates="receiving_hospital")
    services = relationship("HospitalService", back_populates="hospital", cascade="all, delete-orphan")
    prices = relationship("HospitalPrice", back_populates="hospital", cascade="all, delete-orphan")
    bills = relationship("PatientBill", back_populates="hospital", cascade="all, delete-orphan")

class BedCategory(Base):
    __tablename__ = "bed_categories"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)  # ICU, Ventilator, Oxygen Support, General Ward, Pediatric, Emergency Triage, Maternity
    total_beds = Column(Integer, default=20)
    available_beds = Column(Integer, default=5)
    occupied_beds = Column(Integer, default=15)
    price_per_day = Column(Float, default=1500.0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="beds")

class ResourceInventory(Base):
    __tablename__ = "resource_inventory"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    resource_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)  # Oxygen, Blood Bank, Critical Equipment, Staff
    quantity_available = Column(Integer, default=10)
    unit = Column(String(50), default="units")  # cylinders, units, liters, staff
    status = Column(String(50), default="ADEQUATE")  # ADEQUATE, LOW, CRITICAL
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="resources")

class PatientRequest(Base):
    __tablename__ = "patient_requests"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(50), unique=True, index=True, nullable=False)
    patient_name = Column(String(255), nullable=False)
    patient_age = Column(Integer, nullable=False)
    patient_gender = Column(String(20), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    emergency_type = Column(String(100), nullable=False)  # Cardiac, Trauma/Accident, Respiratory Distress, Stroke, Pediatric, General
    severity = Column(String(50), default="URGENT")  # CRITICAL, URGENT, NORMAL
    notes = Column(Text, nullable=True)
    requested_hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    allocated_bed_category = Column(String(100), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, TRIAGED, BED_ALLOCATED, DIVERTED, ADMITTED, CANCELLED
    eta_minutes = Column(Integer, default=20)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="requests")

class TransferRequest(Base):
    __tablename__ = "transfer_requests"

    id = Column(Integer, primary_key=True, index=True)
    transfer_code = Column(String(50), unique=True, index=True, nullable=False)
    patient_name = Column(String(255), nullable=False)
    source_hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    target_hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    required_service = Column(String(150), nullable=False)  # ECMO Support, Pediatric ICU, Level 1 Trauma, Neuro ICU, Burn Unit
    priority = Column(String(100), default="P1 - Immediate (Within 30m)")
    owner_doctor = Column(String(255), nullable=False)
    deadline = Column(String(100), nullable=False)  # e.g. "30 mins", "2 hours"
    ambulance_assigned = Column(String(100), default="SmartCare ALS Unit #4")
    transfer_status = Column(String(50), default="INITIATED")  # INITIATED, ACCEPTED_BY_TARGET, IN_TRANSIT, COMPLETED, REJECTED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    source_hospital = relationship("Hospital", foreign_keys=[source_hospital_id], back_populates="outgoing_transfers")
    target_hospital = relationship("Hospital", foreign_keys=[target_hospital_id], back_populates="incoming_transfers")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    actor_email = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # BED_UPDATE, HOSPITAL_APPROVED, TRANSFER_DISPATCH, EMERGENCY_REQUEST
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=False)
    ip_address = Column(String(50), default="127.0.0.1")

class HospitalService(Base):
    __tablename__ = "hospital_services"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    service_code = Column(String(50), nullable=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # Room and Bed Charges, Emergency Services, Ambulance Services, Laboratory Services, Diagnostic Services, Other Services
    description = Column(Text, nullable=True)
    billing_unit = Column(String(50), nullable=False, default="per day")  # per day, per visit, per trip, per test, per scan, per procedure, per hour
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="services")
    prices = relationship("HospitalPrice", back_populates="service", cascade="all, delete-orphan")
    history = relationship("PriceHistory", back_populates="service", cascade="all, delete-orphan")

class HospitalPrice(Base):
    __tablename__ = "hospital_prices"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("hospital_services.id", ondelete="CASCADE"), nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String(50), default="DRAFT")  # DRAFT, PUBLISHED, INACTIVE, ARCHIVED
    effective_from = Column(DateTime, default=datetime.datetime.utcnow)
    effective_until = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="prices")
    service = relationship("HospitalService", back_populates="prices")
    history = relationship("PriceHistory", back_populates="price")

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("hospital_services.id", ondelete="CASCADE"), nullable=False)
    price_id = Column(Integer, ForeignKey("hospital_prices.id", ondelete="SET NULL"), nullable=True)
    previous_price = Column(Float, nullable=True)
    new_price = Column(Float, nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_by_email = Column(String(255), nullable=True)
    change_reason = Column(String(255), nullable=True)
    changed_at = Column(DateTime, default=datetime.datetime.utcnow)

    hospital = relationship("Hospital")
    service = relationship("HospitalService", back_populates="history")
    price = relationship("HospitalPrice", back_populates="history")

class PatientBill(Base):
    __tablename__ = "patient_bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_number = Column(String(50), unique=True, index=True, nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50), nullable=True)
    patient_email = Column(String(255), nullable=True)
    admission_date = Column(DateTime, nullable=True)
    discharge_date = Column(DateTime, nullable=True)
    bill_date = Column(DateTime, default=datetime.datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    status = Column(String(50), default="DRAFT")  # DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="bills")
    patient = relationship("User", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="bill", cascade="all, delete-orphan")

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("patient_bills.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("hospital_services.id", ondelete="SET NULL"), nullable=True)
    service_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    notes = Column(String(255), nullable=True)

    bill = relationship("PatientBill", back_populates="items")
    service = relationship("HospitalService")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(50), unique=True, index=True, nullable=False)
    bill_id = Column(Integer, ForeignKey("patient_bills.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)  # CASH, CARD, UPI, INSURANCE, NET_BANKING
    transaction_reference = Column(String(100), nullable=True)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    received_by = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    bill = relationship("PatientBill", back_populates="payments")

class BloodBank(Base):
    __tablename__ = "blood_banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    license_number = Column(String(100), unique=True, index=True, nullable=False)
    type = Column(String(100), default="Government / Red Cross")  # Government, Red Cross, Private Hospital Attached, Standalone
    address = Column(String(500), nullable=False)
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False, default=18.5204)
    longitude = Column(Float, nullable=False, default=73.8567)
    phone = Column(String(50), nullable=False)
    emergency_phone = Column(String(50), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    verification_status = Column(String(50), default="APPROVED")  # APPROVED, PENDING
    total_units = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    users = relationship("User", back_populates="blood_bank")
    inventory = relationship("BloodInventory", back_populates="blood_bank", cascade="all, delete-orphan")
    fulfilled_requests = relationship("BloodRequest", back_populates="fulfilled_by_bank")

class BloodInventory(Base):
    __tablename__ = "blood_inventory"

    id = Column(Integer, primary_key=True, index=True)
    blood_bank_id = Column(Integer, ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False)
    blood_group = Column(String(10), nullable=False)  # A+, A-, B+, B-, AB+, AB-, O+, O-
    component_type = Column(String(50), default="Whole Blood")  # Whole Blood, PRBC, Platelets, FFP
    available_units = Column(Integer, default=0)
    reserved_units = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    blood_bank = relationship("BloodBank", back_populates="inventory")

class BloodDonor(Base):
    __tablename__ = "blood_donors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    blood_group = Column(String(10), index=True, nullable=False)  # A+, A-, B+, B-, AB+, AB-, O+, O-
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), default="Maharashtra")
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False, default=18.5204)
    longitude = Column(Float, nullable=False, default=73.8567)
    is_available = Column(Boolean, default=True)  # Ready for emergency donation
    last_donation_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="donor_profile")

class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String(50), unique=True, index=True, nullable=False)
    requester_type = Column(String(50), default="HOSPITAL")  # HOSPITAL, PATIENT
    requester_id = Column(Integer, nullable=True)  # hospital_id or user_id
    requester_name = Column(String(255), nullable=False)
    patient_name = Column(String(255), nullable=False)
    blood_group = Column(String(10), index=True, nullable=False)
    component_type = Column(String(50), default="Whole Blood")
    units_needed = Column(Integer, default=1)
    urgency = Column(String(50), default="CRITICAL")  # CRITICAL, HIGH, MODERATE
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    hospital_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, ACCEPTED, IN_TRANSIT, FULFILLED, CANCELLED
    fulfilled_by_blood_bank_id = Column(Integer, ForeignKey("blood_banks.id", ondelete="SET NULL"), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital")
    fulfilled_by_bank = relationship("BloodBank", back_populates="fulfilled_requests")

class HospitalReferral(Base):
    __tablename__ = "hospital_referrals"

    id = Column(Integer, primary_key=True, index=True)
    referral_code = Column(String(50), unique=True, index=True, nullable=False)
    referring_hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    receiving_hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)

    # Patient information
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50), nullable=False)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(20), nullable=True)
    patient_reference_id = Column(String(100), nullable=True)  # MRN / UHID
    patient_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Request specification
    request_type = Column(String(50), nullable=False)  # DIAGNOSTIC, LABORATORY, BED_CRITICAL_CARE, HOSPITAL_TRANSFER, BLOOD_BANK, AMBULANCE, OTHER_FACILITY
    service_category = Column(String(100), nullable=False)
    service_name = Column(String(255), nullable=False)
    clinical_urgency = Column(String(50), default="ROUTINE")  # ROUTINE, URGENT, CRITICAL_P1

    # Schedule & Quantity
    preferred_date = Column(String(50), nullable=True)  # YYYY-MM-DD
    preferred_time_slot = Column(String(100), nullable=True)  # e.g. "Morning (09:00 - 12:00)", "Immediate"
    quantity = Column(Integer, default=1)
    equipment_required = Column(String(255), nullable=True)
    clinical_summary = Column(Text, nullable=True)
    special_instructions = Column(Text, nullable=True)
    required_by_time = Column(String(100), nullable=True)

    # Workflow status
    status = Column(String(50), default="AWAITING_ACCEPTANCE")
    # AWAITING_ACCEPTANCE, ACCEPTED, RESOURCE_RESERVED, CONFIRMED, ALTERNATIVE_OFFERED, RESCHEDULED, IN_TRANSIT, ARRIVED, COMPLETED, DECLINED, CANCELLED

    # Confirmation & Booking details
    booking_reference = Column(String(100), nullable=True)  # e.g. BKG-2026-XXXX
    confirmed_date = Column(String(50), nullable=True)
    confirmed_time_slot = Column(String(100), nullable=True)
    preparation_instructions = Column(Text, nullable=True)
    quoted_price = Column(Float, nullable=True)
    billing_unit = Column(String(50), nullable=True)

    # Response notes / alternatives
    decline_reason = Column(Text, nullable=True)
    alternative_details = Column(Text, nullable=True)
    allocated_bed_category_id = Column(Integer, ForeignKey("bed_categories.id", ondelete="SET NULL"), nullable=True)
    ambulance_details = Column(String(255), nullable=True)

    # Clinician / contact details
    referring_doctor_name = Column(String(255), nullable=True)
    referring_contact_phone = Column(String(50), nullable=True)
    receiving_contact_name = Column(String(255), nullable=True)
    receiving_contact_phone = Column(String(50), nullable=True)

    # Coordination timestamps
    dispatched_at = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    referring_hospital = relationship("Hospital", foreign_keys=[referring_hospital_id], back_populates="outgoing_referrals")
    receiving_hospital = relationship("Hospital", foreign_keys=[receiving_hospital_id], back_populates="incoming_referrals")
    patient_user = relationship("User")
    allocated_bed_category = relationship("BedCategory")
    timeline = relationship("ReferralTimelineEvent", back_populates="referral", cascade="all, delete-orphan", order_by="ReferralTimelineEvent.created_at.desc()")

class ReferralTimelineEvent(Base):
    __tablename__ = "referral_timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    referral_id = Column(Integer, ForeignKey("hospital_referrals.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    performed_by = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    referral = relationship("HospitalReferral", back_populates="timeline")
