"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  Calendar,
  PhoneCall,
  User,
  Activity,
  Ambulance,
  ArrowRight,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  MessageSquare,
  FileText,
  MapPin,
  ShieldCheck,
  Tag,
  BedDouble,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import {
  getReferralStats,
  getOutgoingReferrals,
  getIncomingReferrals,
  getReferralDetail,
  createReferral,
  respondToReferral,
  updateReferralStatus,
  searchReferralFacilities,
  Referral,
  ReferralStats,
  FacilitySearchItem,
  UserSession,
  getHospitalBeds,
  BedCategory,
  Hospital,
  getHospitals
} from "@/lib/api";

const REQUEST_TYPES = [
  { id: "DIAGNOSTIC", label: "Diagnostic Appointment", icon: Activity, desc: "MRI, CT Scan, X-Ray, Ultrasound, Doppler" },
  { id: "LABORATORY", label: "Laboratory Referral", icon: FileText, desc: "CBC, LFT, KFT, Blood Culture, Lipid Profile" },
  { id: "BED_CRITICAL_CARE", label: "Bed & Critical Care", icon: BedDouble, desc: "ICU, HDU, PICU, NICU, Ventilator Beds" },
  { id: "HOSPITAL_TRANSFER", label: "Patient Transfer", icon: Ambulance, desc: "Inter-facility clinical transfer with ambulance" },
  { id: "BLOOD_BANK", label: "Blood Bank Component", icon: Tag, desc: "Whole Blood, PRBC, Platelets, FFP units" },
  { id: "AMBULANCE", label: "Transport Coordination", icon: Ambulance, desc: "ALS / BLS patient transport logistics" },
  { id: "OTHER_FACILITY", label: "Specialized Procedure", icon: Building2, desc: "Dialysis, Endoscopy, Operation Theatre, Rehab" },
];

const SERVICE_CATEGORIES = [
  "Diagnostic Services",
  "Laboratory Services",
  "Room and Bed Charges",
  "Emergency Services",
  "Ambulance Services",
  "Other Services",
];

const COMMON_SERVICES = {
  DIAGNOSTIC: ["MRI 3T Brain & Spine Scan", "CT Scan Multi-Slice Whole Abdomen", "High-Resolution Ultrasound Doppler", "Digital Chest X-Ray (B/L)", "2D Echocardiography & Color Doppler", "Mammography Bilateral"],
  LABORATORY: ["Comprehensive Metabolic Panel & CBC", "Liver Function Test (LFT)", "Kidney Function Test (KFT)", "Lipid Profile & Serum Electrolytes", "HbA1c & Fasting Blood Glucose", "Coagulation Profile (PT/INR)"],
  BED_CRITICAL_CARE: ["ICU (Intensive Care Unit) Bed", "HDU (High Dependency Unit) Bed", "Cardiac ICU with Ventilator", "Pediatric ICU (PICU)", "Neonatal ICU (NICU)", "Isolation Ward Bed"],
  HOSPITAL_TRANSFER: ["Level 1 Trauma Triage Transfer", "Emergency Neuro-Surgical Transfer", "Cath Lab / Angioplasty Transfer", "Pediatric Emergency Transfer"],
  BLOOD_BANK: ["Packed Red Blood Cells (PRBC)", "Single Donor Platelets (SDP)", "Fresh Frozen Plasma (FFP)", "Whole Blood Units"],
  AMBULANCE: ["Advanced Life Support (ALS) Ambulance", "Basic Life Support (BLS) Ambulance", "Ventilator-Equipped Transit Unit"],
  OTHER_FACILITY: ["Emergency Hemodialysis Session", "Upper GI Endoscopy Procedure", "Emergency OT Booking", "Hyperbaric Oxygen Therapy"]
};

interface ReferralBookingTabProps {
  session: UserSession | null;
}

export default function ReferralBookingTab({ session }: ReferralBookingTabProps) {
  const hospitalId = session?.hospital_id || 1;

  // Sub-tab navigation
  const [subTab, setSubTab] = useState<"dashboard" | "outgoing" | "incoming" | "create" | "find">("dashboard");

  // Metrics
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    awaiting_responses: 0,
    accepted_referrals: 0,
    confirmed_appointments: 0,
    transfers_in_progress: 0,
    completed_requests: 0,
    cancelled_declined: 0,
    incoming_pending: 0,
  });

  // Outgoing and Incoming Referrals
  const [outgoing, setOutgoing] = useState<Referral[]>([]);
  const [incoming, setIncoming] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [respondModal, setRespondModal] = useState<{
    referral: Referral;
    action: "ACCEPT" | "DECLINE" | "OFFER_ALTERNATIVE" | "CONFIRM";
  } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [alternativeDetails, setAlternativeDetails] = useState("");
  const [confirmDate, setConfirmDate] = useState("");
  const [confirmTimeSlot, setConfirmTimeSlot] = useState("10:00 AM - 11:00 AM");
  const [prepInstructions, setPrepInstructions] = useState("");
  const [quotedPriceInput, setQuotedPriceInput] = useState("");
  const [allocatedBedId, setAllocatedBedId] = useState<number | undefined>(undefined);
  const [hospitalBeds, setHospitalBeds] = useState<BedCategory[]>([]);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Facility Discovery Tool State
  const [searchCategory, setSearchCategory] = useState("ALL");
  const [searchServiceName, setSearchServiceName] = useState("");
  const [searchCity, setSearchCity] = useState("All");
  const [facilityResults, setFacilityResults] = useState<FacilitySearchItem[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);

  // Create Form State
  const [form, setForm] = useState({
    receiving_hospital_id: 0,
    patient_name: "",
    patient_phone: "",
    patient_age: 45,
    patient_gender: "Male",
    patient_reference_id: "",
    request_type: "DIAGNOSTIC",
    service_category: "Diagnostic Services",
    service_name: "MRI 3T Brain & Spine Scan",
    clinical_urgency: "ROUTINE",
    preferred_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    preferred_time_slot: "Morning (10:00 AM - 11:00 AM)",
    quantity: 1,
    equipment_required: "",
    clinical_summary: "",
    special_instructions: "",
    required_by_time: "Within 24 Hours",
    referring_doctor_name: session?.name || "Dr. Attending Clinician",
    referring_contact_phone: "+91-20-2565-1100"
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statsData, outData, inData, bedsData, hospsData] = await Promise.all([
        getReferralStats(hospitalId).catch(() => ({
          total_referrals: 0,
          awaiting_responses: 0,
          accepted_referrals: 0,
          confirmed_appointments: 0,
          transfers_in_progress: 0,
          completed_requests: 0,
          cancelled_declined: 0,
          incoming_pending: 0,
        })),
        getOutgoingReferrals({ hospital_id: hospitalId }).catch(() => []),
        getIncomingReferrals({ hospital_id: hospitalId }).catch(() => []),
        getHospitalBeds(hospitalId).catch(() => []),
        getHospitals().catch(() => [])
      ]);
      setStats(statsData);
      setOutgoing(outData);
      setIncoming(inData);
      setHospitalBeds(bedsData);
      setAllHospitals(hospsData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  // Execute Facility Search
  const handleSearchFacilities = async () => {
    setFacilitiesLoading(true);
    try {
      const results = await searchReferralFacilities({
        category: searchCategory,
        service_name: searchServiceName.trim() || undefined,
        city: searchCity !== "All" ? searchCity : undefined,
      });
      // Filter out self
      setFacilityResults(results.filter((f) => f.hospital_id !== hospitalId));
    } catch {
      alert("Failed to search facilities. Please check backend connection.");
    } finally {
      setFacilitiesLoading(false);
    }
  };

  // Open Create Form with Pre-selected Facility
  const handleBookFacility = (facility: FacilitySearchItem) => {
    setForm((prev) => ({
      ...prev,
      receiving_hospital_id: facility.hospital_id,
      service_category: facility.category,
      service_name: facility.service_name,
      request_type:
        facility.category.includes("Diagnostic") ? "DIAGNOSTIC" :
        facility.category.includes("Laboratory") ? "LABORATORY" :
        facility.category.includes("Bed") ? "BED_CRITICAL_CARE" : "OTHER_FACILITY",
      special_instructions: facility.preparation_instructions || ""
    }));
    setSubTab("create");
  };

  // Submit Referral Request
  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name.trim() || !form.patient_phone.trim() || !form.service_name.trim()) {
      alert("Please fill in patient name, contact phone, and required service.");
      return;
    }
    setFormSubmitting(true);
    try {
      await createReferral({
        ...form,
        receiving_hospital_id: form.receiving_hospital_id > 0 ? form.receiving_hospital_id : null,
      });
      alert("Referral request dispatched successfully!");
      setForm((prev) => ({
        ...prev,
        patient_name: "",
        patient_phone: "",
        patient_reference_id: "",
        clinical_summary: "",
        special_instructions: ""
      }));
      setSubTab("outgoing");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to submit referral request.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Response Action (Accept, Decline, Alternative, Confirm)
  const handleExecuteResponse = async () => {
    if (!respondModal) return;
    setActionSubmitting(true);
    try {
      await respondToReferral(respondModal.referral.id, {
        action: respondModal.action,
        decline_reason: declineReason,
        alternative_details: alternativeDetails,
        confirmed_date: confirmDate || undefined,
        confirmed_time_slot: confirmTimeSlot || undefined,
        preparation_instructions: prepInstructions || undefined,
        quoted_price: quotedPriceInput ? parseFloat(quotedPriceInput) : undefined,
        allocated_bed_category_id: allocatedBedId,
      });
      setRespondModal(null);
      setDeclineReason("");
      setAlternativeDetails("");
      setAllocatedBedId(undefined);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record response.");
    } finally {
      setActionSubmitting(false);
    }
  };

  // Update Status (Dispatch, Arrive, Complete, Cancel)
  const handleUpdateStatus = async (referralId: number, action: "DISPATCH" | "ARRIVE" | "COMPLETE" | "CANCEL") => {
    if (action === "CANCEL" && !confirm("Are you sure you want to cancel this referral request?")) {
      return;
    }
    try {
      await updateReferralStatus(referralId, { action });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update referral status.");
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "AWAITING_ACCEPTANCE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Awaiting Response
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3 h-3" /> Request Accepted
          </span>
        );
      case "RESOURCE_RESERVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BedDouble className="w-3 h-3" /> Bed/Resource Reserved
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Appointment Confirmed
          </span>
        );
      case "ALTERNATIVE_OFFERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-3 h-3" /> Alternative Offered
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <Ambulance className="w-3 h-3" /> Patient In Transit
          </span>
        );
      case "ARRIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <MapPin className="w-3 h-3" /> Patient Arrived
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "DECLINED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Request Declined
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
            <X className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const renderUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL_P1":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-red-100 text-red-700 uppercase tracking-wide animate-pulse">
            P1 - Critical
          </span>
        );
      case "URGENT":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
            Urgent
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 uppercase tracking-wide">
            Routine
          </span>
        );
    }
  };

  // Filtered lists
  const filterList = (list: Referral[]) => {
    return list.filter((r) => {
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchType = typeFilter === "ALL" || r.request_type === typeFilter;
      const matchQuery =
        !searchQuery.trim() ||
        r.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.service_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchType && matchQuery;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Share2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              Hospital Referral & Resource Booking
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Inter-facility referral network, cross-hospital diagnostic slots, ICU beds, and ambulance coordination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
            title="Refresh Referrals"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
          </button>

          <button
            onClick={() => setSubTab("create")}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Referral Request</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-container-high pb-3 text-xs font-semibold">
        <button
          onClick={() => setSubTab("dashboard")}
          className={`px-3.5 py-2 rounded-lg transition-all ${
            subTab === "dashboard"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
          }`}
        >
          Referral Dashboard
        </button>

        <button
          onClick={() => setSubTab("outgoing")}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            subTab === "outgoing"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <span>Outgoing Referrals</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-surface-container-highest text-on-surface">
            {outgoing.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab("incoming")}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            subTab === "incoming"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <span>Incoming Requests (Receiving Hub)</span>
          {stats.incoming_pending > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
              {stats.incoming_pending} New
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setSubTab("find");
            if (facilityResults.length === 0) handleSearchFacilities();
          }}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            subTab === "find"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find Suitable Facilities</span>
        </button>

        <button
          onClick={() => setSubTab("create")}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            subTab === "create"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Request</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 1. REFERRAL DASHBOARD OVERVIEW */}
      {/* ==================================================================== */}
      {subTab === "dashboard" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-high shadow-sm">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Referrals
              </span>
              <p className="text-2xl font-extrabold text-on-surface mt-1">{stats.total_referrals}</p>
            </div>

            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Awaiting Response
              </span>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">{stats.awaiting_responses}</p>
            </div>

            <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 shadow-sm">
              <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                Accepted Requests
              </span>
              <p className="text-2xl font-extrabold text-blue-700 mt-1">{stats.accepted_referrals}</p>
            </div>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Confirmed Slots
              </span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.confirmed_appointments}</p>
            </div>

            <div className="bg-orange-50/60 p-3.5 rounded-xl border border-orange-200 shadow-sm">
              <span className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider">
                In Transit (ALS)
              </span>
              <p className="text-2xl font-extrabold text-orange-700 mt-1">{stats.transfers_in_progress}</p>
            </div>

            <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container-high shadow-sm">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                Completed
              </span>
              <p className="text-2xl font-extrabold text-gray-800 mt-1">{stats.completed_requests}</p>
            </div>

            <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-200 shadow-sm">
              <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">
                Declined / Cancelled
              </span>
              <p className="text-2xl font-extrabold text-red-700 mt-1">{stats.cancelled_declined}</p>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSubTab("create")}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high hover:border-primary/40 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
              </div>
              <h4 className="font-bold text-sm text-on-surface">Raise Referral / Booking</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Refer a patient for unavailable diagnostic scans, specialized laboratory tests, ICU bed bays, or ambulance transport.
              </p>
            </div>

            <div
              onClick={() => {
                setSubTab("find");
                if (facilityResults.length === 0) handleSearchFacilities();
              }}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high hover:border-primary/40 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                  <Search className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-outline group-hover:text-tertiary transition-colors" />
              </div>
              <h4 className="font-bold text-sm text-on-surface">Find Suitable Facilities</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Discover accredited partner hospitals offering specific MRI, CT, ICU beds with verified capacities and published pricing.
              </p>
            </div>

            <div
              onClick={() => setSubTab("incoming")}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high hover:border-primary/40 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-on-secondary">
                  {incoming.length} Requests
                </span>
              </div>
              <h4 className="font-bold text-sm text-on-surface">Review Incoming Referrals</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Receive, accept, or decline referrals sent from other facilities. Safely confirm reservations without double booking.
              </p>
            </div>
          </div>

          {/* Recent Referrals Overview Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface">Recent Outgoing Referrals</h3>
              <button
                onClick={() => setSubTab("outgoing")}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View All Outgoing ({outgoing.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {outgoing.length === 0 ? (
              <div className="p-8 text-center text-xs text-on-surface-variant">
                No outgoing referrals created yet. Click "New Referral Request" to dispatch a request.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-high">
                    <tr>
                      <th className="p-3 font-semibold">Referral Code</th>
                      <th className="p-3 font-semibold">Patient</th>
                      <th className="p-3 font-semibold">Required Service</th>
                      <th className="p-3 font-semibold">Receiving Center</th>
                      <th className="p-3 font-semibold">Urgency</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {outgoing.slice(0, 5).map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-3 font-bold text-primary">{r.referral_code}</td>
                        <td className="p-3">
                          <p className="font-semibold text-on-surface">{r.patient_name}</p>
                          <p className="text-[11px] text-on-surface-variant">{r.patient_phone}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-on-surface">{r.service_name}</p>
                          <p className="text-[11px] text-on-surface-variant">{r.service_category}</p>
                        </td>
                        <td className="p-3 text-on-surface-variant">
                          {r.receiving_hospital_name || "Unassigned Pool"}
                        </td>
                        <td className="p-3">{renderUrgencyBadge(r.clinical_urgency)}</td>
                        <td className="p-3">{renderStatusBadge(r.status)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedReferral(r)}
                            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. OUTGOING REFERRALS TAB */}
      {/* ==================================================================== */}
      {subTab === "outgoing" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search code, patient, service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="AWAITING_ACCEPTANCE">Awaiting Response</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="RESOURCE_RESERVED">Resource Reserved</option>
                <option value="CONFIRMED">Confirmed Slots</option>
                <option value="ALTERNATIVE_OFFERED">Alternative Offered</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="COMPLETED">Completed</option>
                <option value="DECLINED">Declined</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
              >
                <option value="ALL">All Request Types</option>
                {REQUEST_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setSubTab("create")}
              className="px-3 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Referral</span>
            </button>
          </div>

          {/* Outgoing Referrals List */}
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden shadow-sm">
            {filterList(outgoing).length === 0 ? (
              <div className="p-12 text-center text-xs text-on-surface-variant">
                No outgoing referrals match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-high">
                    <tr>
                      <th className="p-3.5 font-semibold">Referral Code</th>
                      <th className="p-3.5 font-semibold">Patient Details</th>
                      <th className="p-3.5 font-semibold">Service / Resource</th>
                      <th className="p-3.5 font-semibold">Receiving Hospital</th>
                      <th className="p-3.5 font-semibold">Preferred Schedule</th>
                      <th className="p-3.5 font-semibold">Urgency</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {filterList(outgoing).map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-3.5 font-bold text-primary">
                          {r.referral_code}
                          {r.booking_reference && (
                            <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 mt-0.5">
                              <span>Ref: {r.booking_reference}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-on-surface">{r.patient_name}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            {r.patient_gender}, {r.patient_age} yrs • {r.patient_phone}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-on-surface">{r.service_name}</p>
                          <p className="text-[11px] text-on-surface-variant">{r.service_category}</p>
                          {r.quoted_price && (
                            <p className="text-[11px] font-bold text-primary mt-0.5">
                              ₹{r.quoted_price.toLocaleString("en-IN")} {r.billing_unit ? `/${r.billing_unit}` : ""}
                            </p>
                          )}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-on-surface">
                            {r.receiving_hospital_name || "Facility Pool"}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">{r.receiving_hospital_city}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="text-on-surface font-semibold">{r.confirmed_date || r.preferred_date || "Immediate"}</p>
                          <p className="text-[11px] text-on-surface-variant">{r.confirmed_time_slot || r.preferred_time_slot}</p>
                        </td>
                        <td className="p-3.5">{renderUrgencyBadge(r.clinical_urgency)}</td>
                        <td className="p-3.5">{renderStatusBadge(r.status)}</td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {r.status === "RESOURCE_RESERVED" && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, "DISPATCH")}
                              className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] transition-colors"
                            >
                              Dispatch ALS
                            </button>
                          )}
                          {["AWAITING_ACCEPTANCE", "ALTERNATIVE_OFFERED"].includes(r.status) && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, "CANCEL")}
                              className="px-2.5 py-1 rounded bg-surface-container hover:bg-red-50 text-red-600 text-[11px] font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReferral(r)}
                            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. INCOMING REFERRALS (RECEIVING FACILITY HUB) */}
      {/* ==================================================================== */}
      {subTab === "incoming" && (
        <div className="space-y-4">
          <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high text-xs text-on-surface-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>
                Referrals dispatched to <strong>{session?.hospital_name || "Your Facility"}</strong> by other hospitals. Review requests and safely confirm bookings or bed allocations.
              </span>
            </div>
            <button
              onClick={loadData}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Incoming</span>
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden shadow-sm">
            {incoming.length === 0 ? (
              <div className="p-12 text-center text-xs text-on-surface-variant">
                No incoming referrals currently pending response for your facility.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-high">
                    <tr>
                      <th className="p-3.5 font-semibold">Code</th>
                      <th className="p-3.5 font-semibold">Requesting Hospital</th>
                      <th className="p-3.5 font-semibold">Patient Summary</th>
                      <th className="p-3.5 font-semibold">Required Service</th>
                      <th className="p-3.5 font-semibold">Urgency</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold text-right">Clinical Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {incoming.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-3.5 font-bold text-primary">{r.referral_code}</td>
                        <td className="p-3.5">
                          <p className="font-semibold text-on-surface">{r.referring_hospital_name}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            Dr. {r.referring_doctor_name || "Lead Clinician"} • {r.referring_contact_phone}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-on-surface">{r.patient_name}</p>
                          <p className="text-[11px] text-on-surface-variant line-clamp-1 max-w-xs">
                            {r.clinical_summary || "Routine referral request"}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-on-surface">{r.service_name}</p>
                          <p className="text-[11px] text-on-surface-variant">Pref: {r.preferred_date} ({r.preferred_time_slot})</p>
                        </td>
                        <td className="p-3.5">{renderUrgencyBadge(r.clinical_urgency)}</td>
                        <td className="p-3.5">{renderStatusBadge(r.status)}</td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {r.status === "AWAITING_ACCEPTANCE" && (
                            <>
                              <button
                                onClick={() => {
                                  setRespondModal({ referral: r, action: "ACCEPT" });
                                  setConfirmDate(r.preferred_date || "");
                                  setConfirmTimeSlot(r.preferred_time_slot || "10:00 AM - 11:00 AM");
                                  setPrepInstructions(r.preparation_instructions || "");
                                  if (r.quoted_price) setQuotedPriceInput(r.quoted_price.toString());
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                              >
                                Accept / Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setRespondModal({ referral: r, action: "OFFER_ALTERNATIVE" });
                                }}
                                className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] border border-purple-200 transition-colors"
                              >
                                Offer Alt
                              </button>
                              <button
                                onClick={() => {
                                  setRespondModal({ referral: r, action: "DECLINE" });
                                }}
                                className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11px] border border-red-200 transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {r.status === "IN_TRANSIT" && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, "ARRIVE")}
                              className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition-colors"
                            >
                              Confirm Arrival
                            </button>
                          )}

                          {["CONFIRMED", "ARRIVED", "RESOURCE_RESERVED"].includes(r.status) && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, "COMPLETE")}
                              className="px-2.5 py-1 rounded bg-primary hover:bg-primary-container text-on-primary font-bold text-[11px] transition-colors"
                            >
                              Complete Service
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedReferral(r)}
                            className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. FIND SUITABLE FACILITIES (DISCOVERY & CAPACITIES) */}
      {/* ==================================================================== */}
      {subTab === "find" && (
        <div className="space-y-4">
          {/* Search Header Controls */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Find Suitable Partner Facilities</h3>
                <p className="text-xs text-on-surface-variant">
                  Search verified hospitals and diagnostic centers offering MRI, CT, ICU beds with live capacity telemetry and published prices.
                </p>
              </div>
              <button
                onClick={handleSearchFacilities}
                disabled={facilitiesLoading}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition-colors flex items-center gap-1.5 self-start"
              >
                <Search className={`w-3.5 h-3.5 ${facilitiesLoading ? "animate-spin" : ""}`} />
                <span>{facilitiesLoading ? "Searching Mesh..." : "Find Facilities"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Service Category
                </label>
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                >
                  <option value="ALL">All Categories</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Service / Scan Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. MRI 3T, CT Scan, ICU, CBC..."
                  value={searchServiceName}
                  onChange={(e) => setSearchServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Region / City
                </label>
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                >
                  <option value="All">All Regions</option>
                  <option value="Pune">Pune Metro</option>
                  <option value="Solapur">Solapur</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Results Grid */}
          {facilitiesLoading ? (
            <div className="p-16 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Scanning verified regional hospitals & diagnostic capacity...</span>
            </div>
          ) : facilityResults.length === 0 ? (
            <div className="p-16 text-center text-xs text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-surface-container-high">
              No matching verified facilities found. Try broadening your category or scan name.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilityResults.map((fac) => (
                <div
                  key={fac.hospital_id}
                  className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed uppercase tracking-wider">
                          {fac.category}
                        </span>
                        <h4 className="font-bold text-sm text-on-surface mt-1.5">{fac.name}</h4>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-outline" />
                          <span>{fac.city} {fac.distance_km !== null ? `• ${fac.distance_km} km away` : ""}</span>
                        </p>
                      </div>

                      {fac.verification_status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-1.5">
                      <p className="font-semibold text-xs text-on-surface">{fac.service_name}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant">Published Price:</span>
                        <span className="font-extrabold text-primary">
                          {fac.published_price ? `₹${fac.published_price.toLocaleString("en-IN")} ${fac.billing_unit ? `/${fac.billing_unit}` : ""}` : "Disclosed on Confirmation"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant">Bed/Bay Telemetry:</span>
                        <span className={`font-bold ${fac.capacity_status === "AVAILABLE" ? "text-emerald-700" : "text-amber-700"}`}>
                          {fac.capacity_status === "AVAILABLE" ? `${fac.available_capacity || 0} Beds Available` : "Capacity Tight / Triage"}
                        </span>
                      </div>
                    </div>

                    {fac.available_slots.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-on-surface-variant block mb-1">
                          Available Diagnostic Slots:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {fac.available_slots.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-on-surface">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-surface-container-high mt-4 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${fac.reception_phone || fac.emergency_phone}`}
                      className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1"
                      title="Call Reception"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-primary" />
                    </a>

                    <button
                      onClick={() => handleBookFacility(fac)}
                      className="flex-1 px-3 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Request Referral</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. CREATE REFERRAL REQUEST FORM */}
      {/* ==================================================================== */}
      {subTab === "create" && (
        <form onSubmit={handleSubmitReferral} className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm space-y-6">
          <div className="border-b border-surface-container-high pb-4">
            <h3 className="font-bold text-base text-on-surface">Create Hospital Referral & Booking Request</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Fill in patient clinical details and specify the diagnostic, laboratory, bed bay, or transfer requirements.
            </p>
          </div>

          {/* Section 1: Request Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
              1. Select Referral / Booking Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {REQUEST_TYPES.map((t) => {
                const IconComponent = t.icon;
                const isSelected = form.request_type === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        request_type: t.id,
                        service_name: (COMMON_SERVICES as any)[t.id]?.[0] || prev.service_name,
                        service_category:
                          t.id === "DIAGNOSTIC" ? "Diagnostic Services" :
                          t.id === "LABORATORY" ? "Laboratory Services" :
                          t.id === "BED_CRITICAL_CARE" ? "Room and Bed Charges" :
                          t.id === "AMBULANCE" ? "Ambulance Services" : "Other Services"
                      }));
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary text-primary font-bold shadow-sm"
                        : "bg-surface-container-low border-surface-container-high hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mb-1 text-primary" />
                    <p className="font-bold text-xs text-on-surface">{t.label}</p>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1 mt-0.5">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Patient Information */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>2. Patient Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Jadhav"
                  value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91-98765-43210"
                  value={form.patient_phone}
                  onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Hospital MRN / UHID Reference</label>
                <input
                  type="text"
                  placeholder="e.g. MRN-90214"
                  value={form.patient_reference_id}
                  onChange={(e) => setForm({ ...form, patient_reference_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Age</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={form.patient_age}
                  onChange={(e) => setForm({ ...form, patient_age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Gender</label>
                <select
                  value={form.patient_gender}
                  onChange={(e) => setForm({ ...form, patient_gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Clinical Urgency</label>
                <select
                  value={form.clinical_urgency}
                  onChange={(e) => setForm({ ...form, clinical_urgency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs font-bold text-red-600"
                >
                  <option value="ROUTINE">Routine (Scheduled within 2-3 days)</option>
                  <option value="URGENT">Urgent (Within 24 Hours)</option>
                  <option value="CRITICAL_P1">P1 - Immediate Critical Care (Within 1 Hour)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Service Specification & Schedule */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>3. Required Service / Resource Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Service Category</label>
                <select
                  value={form.service_category}
                  onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Service / Resource Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MRI 3T Brain & Spine Scan"
                  value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Receiving Target Facility (Optional)</label>
                <select
                  value={form.receiving_hospital_id}
                  onChange={(e) => setForm({ ...form, receiving_hospital_id: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs font-semibold"
                >
                  <option value={0}>Open to Verified Partner Pool</option>
                  {allHospitals
                    .filter((h) => h.id !== hospitalId && h.verification_status === "APPROVED")
                    .map((h) => (
                      <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Preferred Slot</label>
                <select
                  value={form.preferred_time_slot}
                  onChange={(e) => setForm({ ...form, preferred_time_slot: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                >
                  <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 04:00 PM)">Afternoon (12:00 PM - 04:00 PM)</option>
                  <option value="Evening (04:00 PM - 08:00 PM)">Evening (04:00 PM - 08:00 PM)</option>
                  <option value="Immediate Triage (24/7)">Immediate Triage (24/7)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Required-By Timeframe</label>
                <input
                  type="text"
                  placeholder="e.g. Within 24 Hours, 30 Mins"
                  value={form.required_by_time}
                  onChange={(e) => setForm({ ...form, required_by_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Clinical Summary & Indication</label>
                <textarea
                  rows={2}
                  placeholder="Patient history, current symptoms, provisional diagnosis, and rationale for referral..."
                  value={form.clinical_summary}
                  onChange={(e) => setForm({ ...form, clinical_summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">Special Instructions & Precautions</label>
                <textarea
                  rows={2}
                  placeholder="Fasting instructions, claustrophobia, contrast allergy, oxygen dependency..."
                  value={form.special_instructions}
                  onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container-high flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSubTab("dashboard")}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <Share2 className={`w-4 h-4 ${formSubmitting ? "animate-spin" : ""}`} />
              <span>{formSubmitting ? "Dispatching Referral..." : "Dispatch Referral Request"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: REFERRAL TIMELINE & DETAILS */}
      {/* ==================================================================== */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container-high space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-base text-on-surface">
                    Referral {selectedReferral.referral_code}
                  </h3>
                  <p className="text-xs text-on-surface-variant">Created on {new Date(selectedReferral.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Urgency Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
              <div className="flex items-center gap-2">
                {renderStatusBadge(selectedReferral.status)}
                {renderUrgencyBadge(selectedReferral.clinical_urgency)}
              </div>
              {selectedReferral.booking_reference && (
                <div className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                  Booking Code: {selectedReferral.booking_reference}
                </div>
              )}
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-1">
                <span className="font-bold text-on-surface-variant uppercase text-[10px]">Patient</span>
                <p className="font-bold text-sm text-on-surface">{selectedReferral.patient_name}</p>
                <p className="text-on-surface-variant">
                  {selectedReferral.patient_gender}, {selectedReferral.patient_age} yrs • {selectedReferral.patient_phone}
                </p>
                {selectedReferral.patient_reference_id && (
                  <p className="text-on-surface-variant">MRN: {selectedReferral.patient_reference_id}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high space-y-1">
                <span className="font-bold text-on-surface-variant uppercase text-[10px]">Facility Link</span>
                <p className="font-bold text-xs text-on-surface">
                  From: {selectedReferral.referring_hospital_name}
                </p>
                <p className="font-bold text-xs text-primary">
                  To: {selectedReferral.receiving_hospital_name || "Open Facility Pool"}
                </p>
                <p className="text-on-surface-variant">
                  Lead: Dr. {selectedReferral.referring_doctor_name || "Clinician"} ({selectedReferral.referring_contact_phone})
                </p>
              </div>
            </div>

            {/* Service & Pricing Details */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-on-surface-variant uppercase text-[10px]">Requested Service</span>
                  <p className="font-bold text-sm text-on-surface">{selectedReferral.service_name}</p>
                  <p className="text-on-surface-variant">{selectedReferral.service_category}</p>
                </div>
                {selectedReferral.quoted_price && (
                  <div className="text-right">
                    <span className="font-bold text-on-surface-variant uppercase text-[10px]">Quoted Tariff</span>
                    <p className="font-extrabold text-base text-primary">
                      ₹{selectedReferral.quoted_price.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{selectedReferral.billing_unit}</p>
                  </div>
                )}
              </div>

              {selectedReferral.clinical_summary && (
                <div className="pt-2 border-t border-surface-container-high">
                  <span className="font-bold text-on-surface-variant text-[11px]">Clinical Summary:</span>
                  <p className="text-on-surface mt-0.5">{selectedReferral.clinical_summary}</p>
                </div>
              )}

              {selectedReferral.preparation_instructions && (
                <div className="pt-2 border-t border-surface-container-high bg-amber-50/50 p-2 rounded">
                  <span className="font-bold text-amber-800 text-[11px]">Preparation Instructions:</span>
                  <p className="text-amber-900 mt-0.5">{selectedReferral.preparation_instructions}</p>
                </div>
              )}

              {selectedReferral.decline_reason && (
                <div className="pt-2 border-t border-red-200 bg-red-50 p-2 rounded">
                  <span className="font-bold text-red-800 text-[11px]">Decline Reason:</span>
                  <p className="text-red-900 mt-0.5">{selectedReferral.decline_reason}</p>
                </div>
              )}
            </div>

            {/* Timeline Events */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Activity Audit Timeline</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedReferral.timeline && selectedReferral.timeline.length > 0 ? (
                  selectedReferral.timeline.map((event) => (
                    <div key={event.id} className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-xs flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-on-surface">{event.action.replace("REFERRAL_", "")}</span>
                          <span className="text-[10px] text-on-surface-variant">
                            {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-on-surface-variant text-[11px] mt-0.5">{event.notes}</p>
                        <p className="text-[10px] text-outline mt-0.5">By: {event.performed_by}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant">No timeline events recorded.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container-high flex justify-end">
              <button
                onClick={() => setSelectedReferral(null)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: RECEIVING HOSPITAL RESPONSE (ACCEPT, DECLINE, ALT) */}
      {/* ==================================================================== */}
      {respondModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <h3 className="font-bold text-base text-on-surface">
                {respondModal.action === "ACCEPT" && "Accept & Confirm Referral"}
                {respondModal.action === "DECLINE" && "Decline Referral Request"}
                {respondModal.action === "OFFER_ALTERNATIVE" && "Offer Alternative Slot / Facility"}
              </h3>
              <button
                onClick={() => setRespondModal(null)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Referral <strong>{respondModal.referral.referral_code}</strong> for patient <strong>{respondModal.referral.patient_name}</strong> ({respondModal.referral.service_name}).
            </p>

            {/* ACCEPT WORKFLOW */}
            {respondModal.action === "ACCEPT" && (
              <div className="space-y-3 text-xs">
                {respondModal.referral.request_type === "BED_CRITICAL_CARE" || respondModal.referral.request_type === "HOSPITAL_TRANSFER" ? (
                  <div className="space-y-1">
                    <label className="block font-bold text-on-surface">
                      Select Bed Bay to Reserve (Prevents Double Booking) *
                    </label>
                    <select
                      value={allocatedBedId || ""}
                      onChange={(e) => setAllocatedBedId(parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs font-semibold"
                    >
                      <option value="">-- Choose Bed Category --</option>
                      {hospitalBeds.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.available_beds < 1}>
                          {b.category} ({b.available_beds} of {b.total_beds} beds available)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-on-surface-variant">
                      Reserving this bed bay decrements available capacity atomically.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-on-surface mb-1">Confirmed Date</label>
                        <input
                          type="date"
                          value={confirmDate}
                          onChange={(e) => setConfirmDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-on-surface mb-1">Confirmed Time Slot</label>
                        <input
                          type="text"
                          value={confirmTimeSlot}
                          onChange={(e) => setConfirmTimeSlot(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface mb-1">Patient Preparation Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Arrive 15 minutes early, 4 hours fasting, previous scans..."
                        value={prepInstructions}
                        onChange={(e) => setPrepInstructions(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface mb-1">Quoted Tariff (₹ INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 6500"
                        value={quotedPriceInput}
                        onChange={(e) => setQuotedPriceInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary text-xs"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* DECLINE WORKFLOW */}
            {respondModal.action === "DECLINE" && (
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-red-700">Reason for Declining (Mandatory) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Bed capacity full, MRI scanner under maintenance, patient condition exceeds center capability..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-red-200 focus:outline-none focus:border-red-500 text-xs text-red-900"
                />
              </div>
            )}

            {/* OFFER ALTERNATIVE WORKFLOW */}
            {respondModal.action === "OFFER_ALTERNATIVE" && (
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-purple-700">Alternative Slot or Facility Details *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Slot available tomorrow at 02:30 PM, or can admit in HDU ward instead of ICU..."
                  value={alternativeDetails}
                  onChange={(e) => setAlternativeDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-purple-200 focus:outline-none focus:border-purple-500 text-xs text-purple-900"
                />
              </div>
            )}

            <div className="pt-3 border-t border-surface-container-high flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRespondModal(null)}
                className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteResponse}
                disabled={actionSubmitting}
                className={`px-4 py-2 rounded-lg font-bold text-white transition-colors flex items-center gap-1.5 ${
                  respondModal.action === "ACCEPT" ? "bg-emerald-600 hover:bg-emerald-700" :
                  respondModal.action === "DECLINE" ? "bg-red-600 hover:bg-red-700" :
                  "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {actionSubmitting ? "Processing..." : "Confirm & Submit Response"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
