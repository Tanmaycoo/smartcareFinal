from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    email: str
    role: str
    hospital_id: Optional[int] = None
    hospital_name: Optional[str] = None
    blood_bank_id: Optional[int] = None
    blood_bank_name: Optional[str] = None
    verification_status: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None
    hospital_id: Optional[int] = None
    blood_bank_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    expected_role: Optional[str] = None

class UserRegisterPatient(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    hospital_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Bed Category Schemas
class BedCategoryBase(BaseModel):
    category: str
    total_beds: int
    available_beds: int
    occupied_beds: int
    price_per_day: float

class BedCategoryOut(BedCategoryBase):
    id: int
    hospital_id: int
    last_updated: datetime

    class Config:
        from_attributes = True

class BedCategoryCreate(BaseModel):
    category: str
    total_beds: int
    available_beds: int
    occupied_beds: Optional[int] = None
    price_per_day: Optional[float] = 0.0

class BedCategoryUpdate(BaseModel):
    category: Optional[str] = None
    total_beds: Optional[int] = None
    available_beds: Optional[int] = None
    occupied_beds: Optional[int] = None
    price_per_day: Optional[float] = None

# Resource Schemas
class ResourceInventoryBase(BaseModel):
    resource_name: str
    category: str
    quantity_available: int
    unit: str
    status: str

class ResourceInventoryCreate(BaseModel):
    resource_name: str
    category: str
    quantity_available: int
    unit: str
    status: Optional[str] = "ADEQUATE"

class ResourceInventoryOut(ResourceInventoryBase):
    id: int
    hospital_id: int
    last_updated: datetime

    class Config:
        from_attributes = True

class ResourceInventoryUpdate(BaseModel):
    quantity_available: int
    status: Optional[str] = None

# Hospital Schemas
class HospitalRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    license_number: str
    type: str = "Multispecialty"
    address: str
    city: str
    state: str
    pincode: str
    latitude: float = 18.5204
    longitude: float = 73.8567
    emergency_phone: str
    reception_phone: Optional[str] = None
    website: Optional[str] = None
    total_capacity: int = 150
    ambulance_count: int = 4
    documents_summary: Optional[str] = "Medical License, NABH Certificate, Fire Safety NOC"
    uploaded_documents: Optional[List[dict]] = None

class HospitalRegisterResponse(BaseModel):
    message: str
    hospital_id: int
    hospital_name: str
    license_number: str
    verification_status: str

class HospitalOut(BaseModel):
    id: int
    name: str
    license_number: str
    type: str
    address: str
    city: str
    state: str
    pincode: str
    latitude: float
    longitude: float
    emergency_phone: str
    reception_phone: Optional[str] = None
    email: str
    website: Optional[str] = None
    verification_status: str
    rejection_reason: Optional[str] = None
    verification_notes: Optional[str] = None
    documents: Optional[str] = None
    total_capacity: int
    ambulance_count: int
    available_ambulances: int
    is_active: bool
    distance_km: Optional[float] = None
    total_available_beds: Optional[int] = None
    icu_available: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HospitalDetailOut(HospitalOut):
    beds: List[BedCategoryOut] = []
    resources: List[ResourceInventoryOut] = []

# Patient Request Schemas
class PatientRequestCreate(BaseModel):
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_phone: str
    emergency_type: str
    severity: str = "URGENT"
    notes: Optional[str] = None
    requested_hospital_id: int
    eta_minutes: Optional[int] = 20

class PatientRequestOut(BaseModel):
    id: int
    ticket_code: str
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_phone: str
    emergency_type: str
    severity: str
    notes: Optional[str] = None
    requested_hospital_id: int
    hospital_name: Optional[str] = None
    allocated_bed_category: Optional[str] = None
    status: str
    eta_minutes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientRequestUpdate(BaseModel):
    status: Optional[str] = None
    allocated_bed_category: Optional[str] = None
    eta_minutes: Optional[int] = None
    notes: Optional[str] = None

# Transfer Request Schemas
class TransferRequestCreate(BaseModel):
    patient_name: str
    target_hospital_id: int
    required_service: str
    priority: str = "P1 - Immediate (Within 30m)"
    owner_doctor: str
    deadline: str = "45 mins"
    notes: Optional[str] = None
    ambulance_assigned: Optional[str] = "SmartCare ALS Unit #2"

class TransferRequestOut(BaseModel):
    id: int
    transfer_code: str
    patient_name: str
    source_hospital_id: int
    source_hospital_name: Optional[str] = None
    target_hospital_id: int
    target_hospital_name: Optional[str] = None
    required_service: str
    priority: str
    owner_doctor: str
    deadline: str
    ambulance_assigned: str
    transfer_status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TransferRequestUpdate(BaseModel):
    transfer_status: str
    notes: Optional[str] = None
    ambulance_assigned: Optional[str] = None

# Admin Schemas
class ApplicationVerifyRequest(BaseModel):
    action: str = Field(..., description="'APPROVE' or 'REJECT'")
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class PlatformMetricsOut(BaseModel):
    total_hospitals: int
    approved_hospitals: int
    pending_applications: int
    total_beds: int
    available_beds: int
    icu_available: int
    ventilators_available: int
    active_transfers: int
    pending_emergency_requests: int
    available_ambulances: int

class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    actor_email: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: str
    ip_address: str

    class Config:
        from_attributes = True

# ----------------- PRICING & SERVICES SCHEMAS -----------------

class HospitalPriceBase(BaseModel):
    price: float
    status: str = "DRAFT"  # DRAFT, PUBLISHED, INACTIVE, ARCHIVED
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    notes: Optional[str] = None

class HospitalPriceCreate(HospitalPriceBase):
    service_id: int

class HospitalPriceUpdate(BaseModel):
    price: Optional[float] = None
    status: Optional[str] = None
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    notes: Optional[str] = None
    change_reason: Optional[str] = None

class HospitalPriceOut(HospitalPriceBase):
    id: int
    hospital_id: int
    service_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HospitalServiceBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    billing_unit: str = "per day"
    service_code: Optional[str] = None

class HospitalServiceCreate(HospitalServiceBase):
    initial_price: Optional[float] = None
    status: Optional[str] = "DRAFT"
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None

class HospitalServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    billing_unit: Optional[str] = None
    service_code: Optional[str] = None
    is_active: Optional[bool] = None

class HospitalServiceOut(HospitalServiceBase):
    id: int
    hospital_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    current_price: Optional[HospitalPriceOut] = None

    class Config:
        from_attributes = True

class PriceHistoryOut(BaseModel):
    id: int
    hospital_id: int
    service_id: int
    service_name: Optional[str] = None
    price_id: Optional[int] = None
    previous_price: Optional[float] = None
    new_price: float
    previous_status: Optional[str] = None
    new_status: str
    changed_by_email: Optional[str] = None
    change_reason: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True

class PricingDashboardMetrics(BaseModel):
    total_services: int
    published_services: int
    draft_services: int
    inactive_services: int
    recently_updated_count: int

class PublicServicePriceItem(BaseModel):
    service_id: int
    service_name: str
    category: str
    description: Optional[str] = None
    billing_unit: str
    price: float
    hospital_id: int
    hospital_name: str
    hospital_city: str
    hospital_address: Optional[str] = None
    hospital_phone: Optional[str] = None
    hospital_verification_status: Optional[str] = None
    effective_from: datetime
    effective_until: Optional[datetime] = None
    last_updated: datetime

# ----------------- COST ESTIMATION SCHEMAS -----------------

class CostEstimateItemInput(BaseModel):
    service_id: int
    quantity: float = 1.0

class CostEstimateRequest(BaseModel):
    hospital_id: int
    items: List[CostEstimateItemInput]
    tax_percentage: Optional[float] = 0.0
    discount_percentage: Optional[float] = 0.0

class CostEstimateItemResult(BaseModel):
    service_id: int
    service_name: str
    category: str
    billing_unit: str
    unit_price: float
    quantity: float
    item_total: float

class CostEstimateResponse(BaseModel):
    hospital_id: int
    hospital_name: str
    items: List[CostEstimateItemResult]
    subtotal: float
    tax_amount: float
    discount_amount: float
    estimated_total: float
    generated_at: datetime
    disclaimer: str

# ----------------- PATIENT BILLING & PAYMENT SCHEMAS -----------------

class BillItemCreate(BaseModel):
    service_id: Optional[int] = None
    service_name: str
    category: Optional[str] = None
    quantity: float = 1.0
    unit_price: float
    notes: Optional[str] = None

class BillItemOut(BaseModel):
    id: int
    bill_id: int
    service_id: Optional[int] = None
    service_name: str
    category: Optional[str] = None
    quantity: float
    unit_price: float
    total_price: float
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    amount: float
    payment_method: str  # CASH, CARD, UPI, INSURANCE, NET_BANKING
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    receipt_number: str
    bill_id: int
    amount: float
    payment_method: str
    transaction_reference: Optional[str] = None
    payment_date: datetime
    received_by: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PatientBillCreate(BaseModel):
    patient_id: Optional[int] = None
    patient_name: str
    patient_phone: Optional[str] = None
    patient_email: Optional[str] = None
    admission_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    notes: Optional[str] = None
    items: List[BillItemCreate]

class PatientBillUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_email: Optional[str] = None
    admission_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class PatientBillOut(BaseModel):
    id: int
    bill_number: str
    hospital_id: int
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_phone: Optional[str] = None
    patient_id: Optional[int] = None
    patient_name: str
    patient_phone: Optional[str] = None
    patient_email: Optional[str] = None
    admission_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None
    bill_date: datetime
    due_date: Optional[datetime] = None
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    amount_paid: float
    balance_due: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[BillItemOut] = []
    payments: List[PaymentOut] = []

    class Config:
        from_attributes = True

class HospitalBillingMetrics(BaseModel):
    total_bills: int
    total_billed: float
    total_collected: float
    total_outstanding: float
    draft_bills: int
    issued_bills: int
    partially_paid_bills: int
    paid_bills: int
    overdue_bills: int

class AdminBillingSummary(BaseModel):
    hospital_id: int
    hospital_name: str
    hospital_city: str
    total_bills: int
    total_billed: float
    total_collected: float
    total_outstanding: float
    published_services_count: int
    last_activity: Optional[datetime] = None

class AdminBillingOverview(BaseModel):
    total_platform_billed: float
    total_platform_collected: float
    total_platform_outstanding: float
    total_platform_bills: int
    hospital_summaries: List[AdminBillingSummary]

# --- BLOOD BANK & DONATION SCHEMAS ---

class BloodInventoryItem(BaseModel):
    blood_group: str
    component_type: str = "Whole Blood"
    available_units: int = 0
    reserved_units: int = 0

class BloodInventoryUpdate(BaseModel):
    items: List[BloodInventoryItem]

class BloodInventoryOut(BaseModel):
    id: int
    blood_bank_id: int
    blood_group: str
    component_type: str
    available_units: int
    reserved_units: int
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True

class BloodBankRegisterRequest(BaseModel):
    name: str
    license_number: str
    type: str = "Government / Red Cross"
    address: str
    city: str
    state: str = "Maharashtra"
    pincode: str
    latitude: float = 18.5204
    longitude: float = 73.8567
    phone: str
    emergency_phone: str
    email: EmailStr
    password: str

class BloodBankOut(BaseModel):
    id: int
    name: str
    license_number: str
    type: str
    address: str
    city: str
    state: str
    pincode: str
    latitude: float
    longitude: float
    phone: str
    emergency_phone: str
    email: str
    is_active: bool
    verification_status: str
    total_units: int
    distance_km: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BloodBankDetailOut(BloodBankOut):
    inventory: List[BloodInventoryOut] = []

class BloodDonorRegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    blood_group: str  # A+, A-, B+, B-, AB+, AB-, O+, O-
    age: Optional[int] = None
    gender: Optional[str] = None
    city: str
    state: str = "Maharashtra"
    address: Optional[str] = None
    latitude: float = 18.5204
    longitude: float = 73.8567
    is_available: bool = True
    last_donation_date: Optional[str] = None
    notes: Optional[str] = None

class BloodDonorOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    phone: str
    email: Optional[str] = None
    blood_group: str
    age: Optional[int] = None
    gender: Optional[str] = None
    city: str
    state: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    is_available: bool
    last_donation_date: Optional[str] = None
    distance_km: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BloodRequestCreate(BaseModel):
    requester_type: str = "HOSPITAL"  # HOSPITAL or PATIENT
    requester_id: Optional[int] = None
    requester_name: str
    patient_name: str
    blood_group: str
    component_type: str = "Whole Blood"
    units_needed: int = 1
    urgency: str = "CRITICAL"  # CRITICAL, HIGH, MODERATE
    hospital_id: Optional[int] = None
    hospital_name: Optional[str] = None
    contact_phone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None

class BloodRequestOut(BaseModel):
    id: int
    request_number: str
    requester_type: str
    requester_name: str
    patient_name: str
    blood_group: str
    component_type: str
    units_needed: int
    urgency: str
    hospital_name: Optional[str] = None
    contact_phone: str
    status: str
    fulfilled_by_blood_bank_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

class BloodRequestStatusUpdate(BaseModel):
    status: str
    fulfilled_by_blood_bank_id: Optional[int] = None

# ============================================================================
# HOSPITAL REFERRAL & RESOURCE BOOKING SCHEMAS
# ============================================================================

class ReferralCreateRequest(BaseModel):
    receiving_hospital_id: Optional[int] = None
    patient_name: str
    patient_phone: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_reference_id: Optional[str] = None
    request_type: str  # DIAGNOSTIC, LABORATORY, BED_CRITICAL_CARE, HOSPITAL_TRANSFER, BLOOD_BANK, AMBULANCE, OTHER_FACILITY
    service_category: str
    service_name: str
    clinical_urgency: str = "ROUTINE"  # ROUTINE, URGENT, CRITICAL_P1
    preferred_date: Optional[str] = None
    preferred_time_slot: Optional[str] = None
    quantity: int = 1
    equipment_required: Optional[str] = None
    clinical_summary: Optional[str] = None
    special_instructions: Optional[str] = None
    required_by_time: Optional[str] = None
    referring_doctor_name: Optional[str] = None
    referring_contact_phone: Optional[str] = None

class ReferralResponseRequest(BaseModel):
    action: str  # ACCEPT, DECLINE, OFFER_ALTERNATIVE, CONFIRM
    decline_reason: Optional[str] = None
    alternative_details: Optional[str] = None
    confirmed_date: Optional[str] = None
    confirmed_time_slot: Optional[str] = None
    preparation_instructions: Optional[str] = None
    quoted_price: Optional[float] = None
    allocated_bed_category_id: Optional[int] = None
    receiving_contact_name: Optional[str] = None
    receiving_contact_phone: Optional[str] = None
    notes: Optional[str] = None

class ReferralStatusUpdateRequest(BaseModel):
    action: str  # DISPATCH, ARRIVE, COMPLETE, CANCEL
    notes: Optional[str] = None
    ambulance_details: Optional[str] = None

class ReferralTimelineEventOut(BaseModel):
    id: int
    referral_id: int
    action: str
    from_status: Optional[str] = None
    to_status: str
    performed_by: str
    actor_role: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReferralOut(BaseModel):
    id: int
    referral_code: str
    referring_hospital_id: int
    referring_hospital_name: Optional[str] = None
    receiving_hospital_id: Optional[int] = None
    receiving_hospital_name: Optional[str] = None
    receiving_hospital_city: Optional[str] = None
    receiving_hospital_phone: Optional[str] = None
    patient_name: str
    patient_phone: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_reference_id: Optional[str] = None
    request_type: str
    service_category: str
    service_name: str
    clinical_urgency: str
    preferred_date: Optional[str] = None
    preferred_time_slot: Optional[str] = None
    quantity: int
    equipment_required: Optional[str] = None
    clinical_summary: Optional[str] = None
    special_instructions: Optional[str] = None
    required_by_time: Optional[str] = None
    status: str
    booking_reference: Optional[str] = None
    confirmed_date: Optional[str] = None
    confirmed_time_slot: Optional[str] = None
    preparation_instructions: Optional[str] = None
    quoted_price: Optional[float] = None
    billing_unit: Optional[str] = None
    decline_reason: Optional[str] = None
    alternative_details: Optional[str] = None
    allocated_bed_category_id: Optional[int] = None
    ambulance_details: Optional[str] = None
    referring_doctor_name: Optional[str] = None
    referring_contact_phone: Optional[str] = None
    receiving_contact_name: Optional[str] = None
    receiving_contact_phone: Optional[str] = None
    dispatched_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    timeline: List[ReferralTimelineEventOut] = []

    class Config:
        from_attributes = True

class ReferralDashboardStats(BaseModel):
    total_referrals: int
    awaiting_responses: int
    accepted_referrals: int
    confirmed_appointments: int
    transfers_in_progress: int
    completed_requests: int
    cancelled_declined: int
    incoming_pending: int

class FacilitySearchItem(BaseModel):
    hospital_id: int
    name: str
    city: str
    address: str
    verification_status: str
    distance_km: Optional[float] = None
    reception_phone: Optional[str] = None
    emergency_phone: Optional[str] = None
    category: str
    service_name: str
    published_price: Optional[float] = None
    billing_unit: Optional[str] = None
    capacity_status: str  # AVAILABLE, LOW, FULL, NOT_REPORTED
    available_capacity: Optional[int] = None
    total_capacity: Optional[int] = None
    available_slots: List[str] = []
    preparation_instructions: Optional[str] = None
