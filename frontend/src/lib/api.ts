// SmartCare API Client
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8001`;
  }
  return "http://127.0.0.1:8001";
}

export interface UserSession {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
  role: "PATIENT" | "HOSPITAL" | "ADMIN" | "BLOOD_BANK";
  hospital_id?: number | null;
  hospital_name?: string | null;
  blood_bank_id?: number | null;
  blood_bank_name?: string | null;
  verification_status?: string | null;
}

export interface BedCategory {
  id: number;
  hospital_id: number;
  category: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  price_per_day: number;
  last_updated: string;
}

export interface ResourceInventory {
  id: number;
  hospital_id: number;
  resource_name: string;
  category: string;
  quantity_available: number;
  unit: string;
  status: "ADEQUATE" | "LOW" | "CRITICAL";
  last_updated: string;
}

export interface Hospital {
  id: number;
  name: string;
  license_number: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  emergency_phone: string;
  reception_phone?: string;
  email: string;
  website?: string;
  verification_status: "PENDING" | "APPROVED" | "REJECTED";
  verification_notes?: string;
  rejection_reason?: string;
  documents?: string;
  total_capacity: number;
  ambulance_count: number;
  available_ambulances: number;
  is_active: boolean;
  distance_km?: number;
  total_available_beds?: number;
  icu_available?: number;
  beds?: BedCategory[];
  resources?: ResourceInventory[];
}

export interface PatientRequest {
  id: number;
  ticket_code: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  contact_phone: string;
  emergency_type: string;
  severity: "CRITICAL" | "URGENT" | "NORMAL";
  notes?: string;
  requested_hospital_id: number;
  hospital_name?: string;
  allocated_bed_category?: string;
  status: "PENDING" | "TRIAGED" | "BED_ALLOCATED" | "DIVERTED" | "ADMITTED" | "CANCELLED";
  eta_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface TransferRequest {
  id: number;
  transfer_code: string;
  patient_name: string;
  source_hospital_id: number;
  source_hospital_name?: string;
  target_hospital_id: number;
  target_hospital_name?: string;
  required_service: string;
  priority: string;
  owner_doctor: string;
  deadline: string;
  ambulance_assigned: string;
  transfer_status: "INITIATED" | "ACCEPTED_BY_TARGET" | "IN_TRANSIT" | "COMPLETED" | "REJECTED";
  notes?: string;
  created_at: string;
}

export interface PlatformMetrics {
  total_hospitals: number;
  approved_hospitals: number;
  pending_applications: number;
  total_beds: number;
  available_beds: number;
  icu_available: number;
  ventilators_available: number;
  active_transfers: number;
  pending_emergency_requests: number;
  available_ambulances: number;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  ip_address: string;
}

// Token Storage
export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("smartcare_session");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem("smartcare_session", JSON.stringify(session));
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("smartcare_session");
  }
}

function getAuthHeaders(): HeadersInit {
  const session = getStoredSession();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// API methods
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = "API Request Failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

// Public Hospital Search
export async function getHospitals(params?: {
  q?: string;
  city?: string;
  bed_type?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}): Promise<Hospital[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.city) query.set("city", params.city);
  if (params?.bed_type) query.set("bed_type", params.bed_type);
  if (params?.lat !== undefined) query.set("lat", params.lat.toString());
  if (params?.lng !== undefined) query.set("lng", params.lng.toString());
  if (params?.radius_km) query.set("radius_km", params.radius_km.toString());

  return apiFetch<Hospital[]>(`/hospitals?${query.toString()}`);
}

export async function getHospitalDetail(id: number): Promise<Hospital> {
  return apiFetch<Hospital>(`/hospitals/${id}`);
}

// Auth
export async function loginUser(email: string, password: string, expected_role?: string): Promise<UserSession> {
  const res = await apiFetch<UserSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, expected_role }),
  });
  saveSession(res);
  return res;
}

export async function registerPatient(name: string, email: string, password: string, phone?: string): Promise<UserSession> {
  const res = await apiFetch<UserSession>("/auth/register-patient", {
    method: "POST",
    body: JSON.stringify({ name, email, password, phone }),
  });
  saveSession(res);
  return res;
}

export async function registerHospital(data: any): Promise<{
  message: string;
  hospital_id: number;
  hospital_name: string;
  license_number: string;
  verification_status: string;
}> {
  return apiFetch("/auth/register-hospital", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Beds
export async function getHospitalBeds(hospital_id?: number): Promise<BedCategory[]> {
  const q = hospital_id ? `?hospital_id=${hospital_id}` : "";
  return apiFetch<BedCategory[]>(`/hospital/beds${q}`);
}

export async function adjustBedCount(bed_id: number, delta: number): Promise<BedCategory> {
  return apiFetch<BedCategory>(`/hospital/beds/adjust/${bed_id}?delta=${delta}`, {
    method: "POST",
  });
}

export async function updateBed(bed_id: number, data: Partial<BedCategory>): Promise<BedCategory> {
  return apiFetch<BedCategory>(`/hospital/beds/${bed_id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createBedCategory(data: {
  category: string;
  total_beds: number;
  available_beds: number;
  occupied_beds?: number;
  price_per_day?: number;
}): Promise<BedCategory> {
  return apiFetch<BedCategory>("/hospital/beds", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteBedCategory(bed_id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/hospital/beds/${bed_id}`, {
    method: "DELETE",
  });
}

// Resources
export async function getHospitalResources(hospital_id?: number): Promise<ResourceInventory[]> {
  const q = hospital_id ? `?hospital_id=${hospital_id}` : "";
  return apiFetch<ResourceInventory[]>(`/hospital/resources${q}`);
}

export async function adjustResourceCount(resource_id: number, delta: number): Promise<ResourceInventory> {
  return apiFetch<ResourceInventory>(`/hospital/resources/adjust/${resource_id}?delta=${delta}`, {
    method: "POST",
  });
}

export async function updateResource(resource_id: number, data: { quantity_available: number; status?: string }): Promise<ResourceInventory> {
  return apiFetch<ResourceInventory>(`/hospital/resources/${resource_id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createResource(data: {
  resource_name: string;
  category: string;
  quantity_available: number;
  unit: string;
  status?: string;
}): Promise<ResourceInventory> {
  return apiFetch<ResourceInventory>("/hospital/resources", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteResource(resource_id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/hospital/resources/${resource_id}`, {
    method: "DELETE",
  });
}

// Requests
export async function createEmergencyRequest(data: {
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  contact_phone: string;
  emergency_type: string;
  severity: string;
  notes?: string;
  requested_hospital_id: number;
  eta_minutes?: number;
}): Promise<PatientRequest> {
  return apiFetch<PatientRequest>("/patient/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function trackEmergencyRequest(ticket_code: string): Promise<PatientRequest> {
  return apiFetch<PatientRequest>(`/patient/requests/track/${ticket_code}`);
}

export async function getHospitalRequests(status_filter?: string, hospital_id?: number): Promise<PatientRequest[]> {
  const query = new URLSearchParams();
  if (status_filter) query.set("status_filter", status_filter);
  if (hospital_id) query.set("hospital_id", hospital_id.toString());
  return apiFetch<PatientRequest[]>(`/hospital/requests?${query.toString()}`);
}

export async function updateRequestStatus(requestId: number, data: {
  status?: string;
  allocated_bed_category?: string;
  eta_minutes?: number;
  notes?: string;
}): Promise<PatientRequest> {
  return apiFetch<PatientRequest>(`/hospital/requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Transfers
export async function getHospitalTransfers(direction: string = "ALL", hospital_id?: number): Promise<TransferRequest[]> {
  const query = new URLSearchParams();
  query.set("direction", direction);
  if (hospital_id) query.set("hospital_id", hospital_id.toString());
  return apiFetch<TransferRequest[]>(`/hospital/transfers?${query.toString()}`);
}

export async function createTransfer(data: {
  patient_name: string;
  target_hospital_id: number;
  required_service: string;
  priority: string;
  owner_doctor: string;
  deadline: string;
  ambulance_assigned?: string;
  notes?: string;
}): Promise<TransferRequest> {
  return apiFetch<TransferRequest>("/hospital/transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTransferStatus(transferId: number, data: {
  transfer_status: string;
  notes?: string;
  ambulance_assigned?: string;
}): Promise<TransferRequest> {
  return apiFetch<TransferRequest>(`/hospital/transfers/${transferId}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Admin
export async function getAdminApplications(): Promise<Hospital[]> {
  return apiFetch<Hospital[]>("/admin/applications");
}

export async function verifyHospitalApplication(hospital_id: number, action: "APPROVE" | "REJECT", notes?: string, rejection_reason?: string): Promise<Hospital> {
  return apiFetch<Hospital>(`/admin/applications/${hospital_id}/verify`, {
    method: "POST",
    body: JSON.stringify({ action, notes, rejection_reason }),
  });
}

export async function getAdminHospitals(status_filter?: string): Promise<Hospital[]> {
  const q = status_filter ? `?status_filter=${status_filter}` : "";
  return apiFetch<Hospital[]>(`/admin/hospitals${q}`);
}

export async function toggleHospitalActive(hospital_id: number): Promise<Hospital> {
  return apiFetch<Hospital>(`/admin/hospitals/${hospital_id}/toggle-status`, {
    method: "PATCH",
  });
}

export async function getAdminMetrics(): Promise<PlatformMetrics> {
  return apiFetch<PlatformMetrics>("/admin/platform-metrics");
}

export async function getAdminAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>(`/admin/audit-logs?limit=${limit}`);
}

// ==============================================================================
// PRICING & SERVICES INTERFACES & API METHODS
// ==============================================================================

export interface HospitalPrice {
  id: number;
  hospital_id: number;
  service_id: number;
  price: number;
  status: "DRAFT" | "PUBLISHED" | "INACTIVE" | "ARCHIVED";
  effective_from: string;
  effective_until?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HospitalService {
  id: number;
  hospital_id: number;
  service_code?: string | null;
  name: string;
  category: string;
  description?: string | null;
  billing_unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_price?: HospitalPrice | null;
}

export interface PriceHistory {
  id: number;
  hospital_id: number;
  service_id: number;
  service_name?: string | null;
  price_id?: number | null;
  previous_price?: number | null;
  new_price: number;
  previous_status?: string | null;
  new_status: string;
  changed_by_email?: string | null;
  change_reason?: string | null;
  changed_at: string;
}

export interface PricingDashboardMetrics {
  total_services: number;
  published_services: number;
  draft_services: number;
  inactive_services: number;
  recently_updated_count: number;
}

export interface PublicServicePriceItem {
  service_id: number;
  service_name: string;
  category: string;
  description?: string | null;
  billing_unit: string;
  price: number;
  hospital_id: number;
  hospital_name: string;
  hospital_city: string;
  hospital_address?: string | null;
  hospital_phone?: string | null;
  hospital_verification_status?: string | null;
  effective_from: string;
  effective_until?: string | null;
  last_updated: string;
}

export interface CostEstimateItemInput {
  service_id: number;
  quantity: number;
}

export interface CostEstimateRequest {
  hospital_id: number;
  items: CostEstimateItemInput[];
  tax_percentage?: number;
  discount_percentage?: number;
}

export interface CostEstimateItemResult {
  service_id: number;
  service_name: string;
  category: string;
  billing_unit: string;
  unit_price: number;
  quantity: number;
  item_total: number;
}

export interface CostEstimateResponse {
  hospital_id: number;
  hospital_name: string;
  items: CostEstimateItemResult[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  estimated_total: number;
  generated_at: string;
  disclaimer: string;
}

// Pricing APIs
export async function getPricingMetrics(): Promise<PricingDashboardMetrics> {
  return apiFetch<PricingDashboardMetrics>("/pricing/hospital/metrics");
}

export async function getHospitalServices(params?: {
  category?: string;
  status_filter?: string;
  search?: string;
}): Promise<HospitalService[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.status_filter) query.set("status_filter", params.status_filter);
  if (params?.search) query.set("search", params.search);
  const qStr = query.toString();
  return apiFetch<HospitalService[]>(`/pricing/hospital/services${qStr ? `?${qStr}` : ""}`);
}

export async function createHospitalService(data: {
  name: string;
  category: string;
  description?: string;
  billing_unit: string;
  service_code?: string;
  initial_price?: number;
  status?: "DRAFT" | "PUBLISHED";
  effective_from?: string;
  effective_until?: string;
}): Promise<HospitalService> {
  return apiFetch<HospitalService>("/pricing/hospital/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateHospitalService(serviceId: number, data: {
  name?: string;
  category?: string;
  description?: string;
  billing_unit?: string;
  service_code?: string;
  is_active?: boolean;
}): Promise<HospitalService> {
  return apiFetch<HospitalService>(`/pricing/hospital/services/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteHospitalService(serviceId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/pricing/hospital/services/${serviceId}`, {
    method: "DELETE",
  });
}

export async function updateHospitalServicePrice(serviceId: number, data: {
  price?: number;
  status?: "DRAFT" | "PUBLISHED" | "INACTIVE" | "ARCHIVED";
  notes?: string;
  change_reason?: string;
  effective_from?: string;
  effective_until?: string;
}): Promise<HospitalPrice> {
  return apiFetch<HospitalPrice>(`/pricing/hospital/services/${serviceId}/price`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function publishHospitalServicePrice(serviceId: number): Promise<HospitalPrice> {
  return apiFetch<HospitalPrice>(`/pricing/hospital/services/${serviceId}/publish`, {
    method: "POST",
  });
}

export async function deactivateHospitalServicePrice(serviceId: number): Promise<HospitalPrice> {
  return apiFetch<HospitalPrice>(`/pricing/hospital/services/${serviceId}/deactivate`, {
    method: "POST",
  });
}

export async function getHospitalPriceHistory(serviceId?: number): Promise<PriceHistory[]> {
  const q = serviceId ? `?service_id=${serviceId}` : "";
  return apiFetch<PriceHistory[]>(`/pricing/hospital/history${q}`);
}

export async function getHospitalRatePreview(): Promise<PublicServicePriceItem[]> {
  return apiFetch<PublicServicePriceItem[]>("/pricing/hospital/preview");
}

export async function getPublicHospitalPricing(hospitalId: number, category?: string): Promise<PublicServicePriceItem[]> {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<PublicServicePriceItem[]>(`/pricing/hospitals/${hospitalId}${q}`);
}

export async function searchPublicServices(params?: {
  search?: string;
  category?: string;
  city?: string;
  hospital_id?: number;
  sort_by?: "price_asc" | "price_desc" | "name_asc";
}): Promise<PublicServicePriceItem[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (params?.city) query.set("city", params.city);
  if (params?.hospital_id) query.set("hospital_id", params.hospital_id.toString());
  if (params?.sort_by) query.set("sort_by", params.sort_by);
  const qStr = query.toString();
  return apiFetch<PublicServicePriceItem[]>(`/pricing/services${qStr ? `?${qStr}` : ""}`);
}

export async function calculateCostEstimate(data: CostEstimateRequest): Promise<CostEstimateResponse> {
  return apiFetch<CostEstimateResponse>("/pricing/estimate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==============================================================================
// BILLING & PAYMENTS INTERFACES & API METHODS
// ==============================================================================

export interface BillItem {
  id: number;
  bill_id: number;
  service_id?: number | null;
  service_name: string;
  category?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string | null;
}

export interface Payment {
  id: number;
  receipt_number: string;
  bill_id: number;
  amount: number;
  payment_method: "CASH" | "CARD" | "UPI" | "INSURANCE" | "NET_BANKING" | string;
  transaction_reference?: string | null;
  payment_date: string;
  received_by?: string | null;
  notes?: string | null;
}

export interface PatientBill {
  id: number;
  bill_number: string;
  hospital_id: number;
  hospital_name?: string | null;
  hospital_address?: string | null;
  hospital_phone?: string | null;
  patient_id?: number | null;
  patient_name: string;
  patient_phone?: string | null;
  patient_email?: string | null;
  admission_date?: string | null;
  discharge_date?: string | null;
  bill_date: string;
  due_date?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items: BillItem[];
  payments: Payment[];
}

export interface HospitalBillingMetrics {
  total_bills: number;
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  draft_bills: number;
  issued_bills: number;
  partially_paid_bills: number;
  paid_bills: number;
  overdue_bills: number;
}

export interface AdminBillingSummary {
  hospital_id: number;
  hospital_name: string;
  hospital_city: string;
  total_bills: number;
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  published_services_count: number;
  last_activity?: string | null;
}

export interface AdminBillingOverview {
  total_platform_billed: number;
  total_platform_collected: number;
  total_platform_outstanding: number;
  total_platform_bills: number;
  hospital_summaries: AdminBillingSummary[];
}

// Billing APIs
export async function getHospitalBillingMetrics(): Promise<HospitalBillingMetrics> {
  return apiFetch<HospitalBillingMetrics>("/billing/hospital/metrics");
}

export async function getHospitalBills(params?: {
  status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}): Promise<PatientBill[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  const qStr = query.toString();
  return apiFetch<PatientBill[]>(`/billing/hospital/bills${qStr ? `?${qStr}` : ""}`);
}

export async function createPatientBill(data: {
  patient_id?: number;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  admission_date?: string;
  discharge_date?: string;
  due_date?: string;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  items: {
    service_id?: number;
    service_name: string;
    category?: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
}): Promise<PatientBill> {
  return apiFetch<PatientBill>("/billing/hospital/bills", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getHospitalBillDetail(billId: number): Promise<PatientBill> {
  return apiFetch<PatientBill>(`/billing/hospital/bills/${billId}`);
}

export async function updateHospitalBill(billId: number, data: Partial<PatientBill>): Promise<PatientBill> {
  return apiFetch<PatientBill>(`/billing/hospital/bills/${billId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function issueHospitalBill(billId: number): Promise<PatientBill> {
  return apiFetch<PatientBill>(`/billing/hospital/bills/${billId}/issue`, {
    method: "POST",
  });
}

export async function cancelHospitalBill(billId: number): Promise<PatientBill> {
  return apiFetch<PatientBill>(`/billing/hospital/bills/${billId}/cancel`, {
    method: "POST",
  });
}

export async function recordBillPayment(billId: number, data: {
  amount: number;
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
}): Promise<PatientBill> {
  return apiFetch<PatientBill>(`/billing/hospital/bills/${billId}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPatientBills(status?: string): Promise<PatientBill[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<PatientBill[]>(`/billing/patient/bills${q}`);
}

export async function getPatientBillDetail(billId: number): Promise<PatientBill> {
  return apiFetch<PatientBill>(`/billing/patient/bills/${billId}`);
}

export async function getAdminBillingOverview(): Promise<AdminBillingOverview> {
  return apiFetch<AdminBillingOverview>("/billing/admin/overview");
}

// ==========================================
// BLOOD BANK & DONATION SERVICES
// ==========================================

export interface BloodInventoryItem {
  id?: number;
  blood_bank_id?: number;
  blood_group: string;
  component_type: string;
  available_units: number;
  reserved_units?: number;
  last_updated?: string;
}

export interface BloodBank {
  id: number;
  name: string;
  license_number: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergency_phone: string;
  email: string;
  is_active: boolean;
  verification_status: string;
  total_units: number;
  distance_km?: number | null;
  created_at?: string;
  inventory?: BloodInventoryItem[];
}

export interface BloodDonor {
  id: number;
  user_id?: number | null;
  name: string;
  phone: string;
  email?: string | null;
  blood_group: string;
  age?: number | null;
  gender?: string | null;
  city: string;
  state: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  is_available: boolean;
  last_donation_date?: string | null;
  distance_km?: number | null;
  created_at?: string;
}

export interface BloodRequest {
  id: number;
  request_number: string;
  requester_type: "HOSPITAL" | "PATIENT";
  requester_name: string;
  patient_name: string;
  blood_group: string;
  component_type: string;
  units_needed: number;
  urgency: "CRITICAL" | "HIGH" | "MODERATE";
  hospital_name?: string | null;
  contact_phone: string;
  status: "PENDING" | "ACCEPTED" | "IN_TRANSIT" | "FULFILLED" | "CANCELLED";
  fulfilled_by_blood_bank_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  created_at?: string;
  distance_km?: number | null;
}

export async function registerBloodBank(data: any): Promise<BloodBank> {
  return apiFetch<BloodBank>("/blood-bank/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getNearbyBloodBanks(params?: {
  q?: string;
  city?: string;
  blood_group?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}): Promise<BloodBank[]> {
  const query = new URLSearchParams();
  if (params?.q) query.append("q", params.q);
  if (params?.city && params.city !== "All") query.append("city", params.city);
  if (params?.blood_group && params.blood_group !== "All") query.append("blood_group", params.blood_group);
  if (params?.lat !== undefined) query.append("lat", params.lat.toString());
  if (params?.lng !== undefined) query.append("lng", params.lng.toString());
  if (params?.radius_km !== undefined) query.append("radius_km", params.radius_km.toString());

  const qs = query.toString();
  return apiFetch<BloodBank[]>(`/blood-bank/nearby${qs ? `?${qs}` : ""}`);
}

export async function getBloodBankDetail(bankId: number): Promise<BloodBank> {
  return apiFetch<BloodBank>(`/blood-bank/${bankId}`);
}

export async function updateBloodInventory(
  bankId: number,
  items: BloodInventoryItem[]
): Promise<BloodInventoryItem[]> {
  return apiFetch<BloodInventoryItem[]>(`/blood-bank/${bankId}/inventory`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

export async function getNearbyBloodDonors(params?: {
  blood_group?: string;
  compatible_only?: boolean;
  city?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  only_available?: boolean;
}): Promise<BloodDonor[]> {
  const query = new URLSearchParams();
  if (params?.blood_group && params.blood_group !== "All") query.append("blood_group", params.blood_group);
  if (params?.compatible_only !== undefined) query.append("compatible_only", params.compatible_only.toString());
  if (params?.city && params.city !== "All") query.append("city", params.city);
  if (params?.lat !== undefined) query.append("lat", params.lat.toString());
  if (params?.lng !== undefined) query.append("lng", params.lng.toString());
  if (params?.radius_km !== undefined) query.append("radius_km", params.radius_km.toString());
  if (params?.only_available !== undefined) query.append("only_available", params.only_available.toString());

  const qs = query.toString();
  return apiFetch<BloodDonor[]>(`/blood-bank/donors/nearby${qs ? `?${qs}` : ""}`);
}

export async function registerBloodDonor(data: {
  name: string;
  phone: string;
  email?: string;
  blood_group: string;
  age?: number;
  gender?: string;
  city: string;
  state?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_available?: boolean;
  last_donation_date?: string;
  notes?: string;
}): Promise<BloodDonor> {
  return apiFetch<BloodDonor>("/blood-bank/donors/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function toggleDonorAvailability(donorId: number): Promise<BloodDonor> {
  return apiFetch<BloodDonor>(`/blood-bank/donors/${donorId}/toggle-availability`, {
    method: "PATCH",
  });
}

export async function createBloodRequest(data: {
  requester_type: "HOSPITAL" | "PATIENT";
  requester_id?: number;
  requester_name: string;
  patient_name: string;
  blood_group: string;
  component_type?: string;
  units_needed: number;
  urgency?: "CRITICAL" | "HIGH" | "MODERATE";
  hospital_id?: number;
  hospital_name?: string;
  contact_phone: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}): Promise<BloodRequest> {
  return apiFetch<BloodRequest>("/blood-bank/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getBloodRequests(params?: {
  status_filter?: string;
  blood_group?: string;
  hospital_id?: number;
  lat?: number;
  lng?: number;
}): Promise<BloodRequest[]> {
  const query = new URLSearchParams();
  if (params?.status_filter && params.status_filter !== "ALL") query.append("status_filter", params.status_filter);
  if (params?.blood_group && params.blood_group !== "All") query.append("blood_group", params.blood_group);
  if (params?.hospital_id) query.append("hospital_id", params.hospital_id.toString());
  if (params?.lat !== undefined) query.append("lat", params.lat.toString());
  if (params?.lng !== undefined) query.append("lng", params.lng.toString());

  const qs = query.toString();
  return apiFetch<BloodRequest[]>(`/blood-bank/requests${qs ? `?${qs}` : ""}`);
}

export async function updateBloodRequestStatus(
  requestId: number,
  status: string,
  fulfilledByBankId?: number
): Promise<BloodRequest> {
  return apiFetch<BloodRequest>(`/blood-bank/requests/${requestId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      fulfilled_by_blood_bank_id: fulfilledByBankId,
    }),
  });
}

// ============================================================================
// HOSPITAL REFERRAL & RESOURCE BOOKING INTERFACES & METHODS
// ============================================================================

export interface ReferralTimelineEvent {
  id: number;
  referral_id: number;
  action: string;
  from_status?: string | null;
  to_status: string;
  performed_by: string;
  actor_role: string;
  notes?: string | null;
  created_at: string;
}

export interface Referral {
  id: number;
  referral_code: string;
  referring_hospital_id: number;
  referring_hospital_name?: string;
  receiving_hospital_id?: number | null;
  receiving_hospital_name?: string | null;
  receiving_hospital_city?: string | null;
  receiving_hospital_phone?: string | null;
  patient_name: string;
  patient_phone: string;
  patient_age?: number | null;
  patient_gender?: string | null;
  patient_reference_id?: string | null;
  request_type: string;
  service_category: string;
  service_name: string;
  clinical_urgency: string;
  preferred_date?: string | null;
  preferred_time_slot?: string | null;
  quantity: number;
  equipment_required?: string | null;
  clinical_summary?: string | null;
  special_instructions?: string | null;
  required_by_time?: string | null;
  status: string;
  booking_reference?: string | null;
  confirmed_date?: string | null;
  confirmed_time_slot?: string | null;
  preparation_instructions?: string | null;
  quoted_price?: number | null;
  billing_unit?: string | null;
  decline_reason?: string | null;
  alternative_details?: string | null;
  allocated_bed_category_id?: number | null;
  ambulance_details?: string | null;
  referring_doctor_name?: string | null;
  referring_contact_phone?: string | null;
  receiving_contact_name?: string | null;
  receiving_contact_phone?: string | null;
  dispatched_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  timeline?: ReferralTimelineEvent[];
}

export interface ReferralStats {
  total_referrals: number;
  awaiting_responses: number;
  accepted_referrals: number;
  confirmed_appointments: number;
  transfers_in_progress: number;
  completed_requests: number;
  cancelled_declined: number;
  incoming_pending: number;
}

export interface FacilitySearchItem {
  hospital_id: number;
  name: string;
  city: string;
  address: string;
  verification_status: string;
  distance_km?: number | null;
  reception_phone?: string | null;
  emergency_phone?: string | null;
  category: string;
  service_name: string;
  published_price?: number | null;
  billing_unit?: string | null;
  capacity_status: string;
  available_capacity?: number | null;
  total_capacity?: number | null;
  available_slots: string[];
  preparation_instructions?: string | null;
}

export async function getReferralStats(hospitalId?: number): Promise<ReferralStats> {
  const qs = hospitalId ? `?hospital_id=${hospitalId}` : "";
  return apiFetch<ReferralStats>(`/referrals/stats${qs}`);
}

export async function getOutgoingReferrals(params?: {
  status?: string;
  request_type?: string;
  urgency?: string;
  q?: string;
  hospital_id?: number;
}): Promise<Referral[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "ALL") query.append("status", params.status);
  if (params?.request_type && params.request_type !== "ALL") query.append("request_type", params.request_type);
  if (params?.urgency && params.urgency !== "ALL") query.append("urgency", params.urgency);
  if (params?.q) query.append("q", params.q);
  if (params?.hospital_id) query.append("hospital_id", params.hospital_id.toString());

  const qs = query.toString();
  return apiFetch<Referral[]>(`/referrals/outgoing${qs ? `?${qs}` : ""}`);
}

export async function getIncomingReferrals(params?: {
  status?: string;
  request_type?: string;
  urgency?: string;
  q?: string;
  hospital_id?: number;
}): Promise<Referral[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "ALL") query.append("status", params.status);
  if (params?.request_type && params.request_type !== "ALL") query.append("request_type", params.request_type);
  if (params?.urgency && params.urgency !== "ALL") query.append("urgency", params.urgency);
  if (params?.q) query.append("q", params.q);
  if (params?.hospital_id) query.append("hospital_id", params.hospital_id.toString());

  const qs = query.toString();
  return apiFetch<Referral[]>(`/referrals/incoming${qs ? `?${qs}` : ""}`);
}

export async function getReferralDetail(referralId: number): Promise<Referral> {
  return apiFetch<Referral>(`/referrals/${referralId}`);
}

export async function createReferral(data: {
  receiving_hospital_id?: number | null;
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: string;
  patient_reference_id?: string;
  request_type: string;
  service_category: string;
  service_name: string;
  clinical_urgency?: string;
  preferred_date?: string;
  preferred_time_slot?: string;
  quantity?: number;
  equipment_required?: string;
  clinical_summary?: string;
  special_instructions?: string;
  required_by_time?: string;
  referring_doctor_name?: string;
  referring_contact_phone?: string;
}): Promise<Referral> {
  return apiFetch<Referral>("/referrals/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function respondToReferral(
  referralId: number,
  data: {
    action: "ACCEPT" | "DECLINE" | "OFFER_ALTERNATIVE" | "CONFIRM";
    decline_reason?: string;
    alternative_details?: string;
    confirmed_date?: string;
    confirmed_time_slot?: string;
    preparation_instructions?: string;
    quoted_price?: number;
    allocated_bed_category_id?: number;
    receiving_contact_name?: string;
    receiving_contact_phone?: string;
    notes?: string;
  }
): Promise<Referral> {
  return apiFetch<Referral>(`/referrals/${referralId}/respond`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReferralStatus(
  referralId: number,
  data: {
    action: "DISPATCH" | "ARRIVE" | "COMPLETE" | "CANCEL";
    notes?: string;
    ambulance_details?: string;
  }
): Promise<Referral> {
  return apiFetch<Referral>(`/referrals/${referralId}/update-status`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function searchReferralFacilities(params?: {
  category?: string;
  service_name?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}): Promise<FacilitySearchItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "ALL") query.append("category", params.category);
  if (params?.service_name) query.append("service_name", params.service_name);
  if (params?.city && params.city !== "All") query.append("city", params.city);
  if (params?.lat !== undefined) query.append("lat", params.lat.toString());
  if (params?.lng !== undefined) query.append("lng", params.lng.toString());
  if (params?.radius_km !== undefined) query.append("radius_km", params.radius_km.toString());

  const qs = query.toString();
  return apiFetch<FacilitySearchItem[]>(`/referrals/facilities/search${qs ? `?${qs}` : ""}`);
}

export async function getPatientReferrals(): Promise<Referral[]> {
  return apiFetch<Referral[]>("/referrals/patient/my-referrals");
}
