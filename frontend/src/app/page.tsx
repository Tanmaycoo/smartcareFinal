"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  PhoneCall,
  BedDouble,
  Activity,
  Ambulance,
  ShieldCheck,
  HeartPulse,
  SlidersHorizontal,
  Navigation,
  Clock,
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  User,
  ArrowRight,
  Send,
  Building,
  Check,
  Copy
} from "lucide-react";
import {
  getHospitals,
  getHospitalDetail,
  createEmergencyRequest,
  trackEmergencyRequest,
  Hospital,
  PatientRequest
} from "@/lib/api";

export default function PatientHomePage() {
  const router = useRouter();

  // State for Hospitals
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedBedType, setSelectedBedType] = useState("All");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | undefined>(undefined);
  const [geoLoading, setGeoLoading] = useState(false);

  // Ticket Tracker State
  const [ticketInput, setTicketInput] = useState("");
  const [trackedRequest, setTrackedRequest] = useState<PatientRequest | null>(null);
  const [ticketError, setTicketError] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);

  // Emergency Complaint Form State
  const [complaintForm, setComplaintForm] = useState({
    patient_name: "",
    patient_age: 40,
    patient_gender: "Male",
    contact_phone: "",
    emergency_type: "Cardiac / Severe Chest Pain",
    severity: "CRITICAL",
    notes: "",
    requested_hospital_id: 0,
    eta_minutes: 15,
  });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<PatientRequest | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Detail Modal State
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch Hospitals
  const loadHospitals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCity !== "All") params.city = selectedCity;
      if (selectedBedType !== "All") params.bed_type = selectedBedType;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        if (radiusKm) params.radius_km = radiusKm;
      }

      const data = await getHospitals(params);
      setHospitals(data);

      // Default complaint form target hospital to first hospital if none set
      if (data.length > 0 && complaintForm.requested_hospital_id === 0) {
        setComplaintForm((prev) => ({
          ...prev,
          requested_hospital_id: data[0].id,
        }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load network hospitals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [selectedCity, selectedBedType, userCoords, radiusKm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHospitals();
  };

  // Geolocation trigger
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setRadiusKm(25);
        setGeoLoading(false);
      },
      () => {
        setUserCoords({ lat: 18.5204, lng: 73.8567 });
        setRadiusKm(25);
        setGeoLoading(false);
      }
    );
  };

  // Open Detail Modal
  const openHospitalDetail = async (hospitalId: number) => {
    setDetailLoading(true);
    try {
      const fullDetail = await getHospitalDetail(hospitalId);
      setSelectedHospital(fullDetail);
    } catch {
      alert("Could not load hospital details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Quick action from hospital card to pre-fill complaint form
  const prefillHospitalComplaint = (hospital: Hospital) => {
    setComplaintForm((prev) => ({
      ...prev,
      requested_hospital_id: hospital.id,
    }));
    const el = document.getElementById("emergency-complaint");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Track Emergency Ticket
  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    setTicketError("");
    setTrackedRequest(null);
    setTicketLoading(true);

    try {
      const req = await trackEmergencyRequest(ticketInput.trim().toUpperCase());
      setTrackedRequest(req);
    } catch (err: any) {
      setTicketError(err.message || "Ticket code not found.");
    } finally {
      setTicketLoading(false);
    }
  };

  // Submit Complaint / Emergency Request Form
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.patient_name.trim()) {
      alert("Please enter the patient's full name.");
      return;
    }
    if (!complaintForm.contact_phone.trim()) {
      alert("Please enter a contact phone number.");
      return;
    }
    if (!complaintForm.notes.trim()) {
      alert("Please describe the patient's complaint / emergency condition.");
      return;
    }

    setComplaintSubmitting(true);
    try {
      const targetHospitalId = complaintForm.requested_hospital_id || (hospitals[0]?.id ?? 1);
      const res = await createEmergencyRequest({
        patient_name: complaintForm.patient_name.trim(),
        patient_age: Number(complaintForm.patient_age),
        patient_gender: complaintForm.patient_gender,
        contact_phone: complaintForm.contact_phone.trim(),
        emergency_type: complaintForm.emergency_type,
        severity: complaintForm.severity,
        notes: complaintForm.notes.trim(),
        requested_hospital_id: targetHospitalId,
        eta_minutes: Number(complaintForm.eta_minutes),
      });

      setComplaintSuccess(res);
      // Auto-load into tracker input
      setTicketInput(res.ticket_code);
    } catch (err: any) {
      alert(err.message || "Failed to submit emergency request.");
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const copyTicketCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  // Summary counts
  const totalBedsCount = hospitals.reduce((acc, h) => acc + (h.total_available_beds || 0), 0);
  const totalIcuCount = hospitals.reduce((acc, h) => acc + (h.icu_available || 0), 0);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-20">
      
      {/* 1. CLEAN HERO & TELEMETRY BANNER */}
      <section className="bg-surface-container-lowest border-b border-surface-container-high py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>Real-Time Healthcare Telemetry Active</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold text-on-surface tracking-tight leading-tight">
                Live Hospital Bed Availability & Emergency Triage Portal
              </h1>

              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Check verified ICU beds, oxygen supplies, and trauma bays across regional hospitals. Submit an immediate emergency complaint to reserve a bed before arrival.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geoLoading}
                  className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{geoLoading ? "Locating..." : "Find Nearest Hospital"}</span>
                </button>

                <a
                  href="#emergency-complaint"
                  className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 font-semibold text-xs transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span>File Emergency Complaint</span>
                </a>

                <a
                  href="tel:108"
                  className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call 108 Ambulance</span>
                </a>
              </div>
            </div>

            {/* Quick Live Telemetry Stat Card */}
            <div className="lg:w-80 bg-surface-container-low rounded-xl p-5 border border-surface-container-high space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Mesh Status</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                  Synced Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-surface-container-lowest rounded-lg border border-surface-container-high">
                  <span className="block text-2xl font-bold text-primary">{hospitals.length}</span>
                  <span className="text-xs text-on-surface-variant">Approved Hospitals</span>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-lg border border-surface-container-high">
                  <span className="block text-2xl font-bold text-secondary">{totalIcuCount}</span>
                  <span className="text-xs text-on-surface-variant">Available ICU Beds</span>
                </div>
              </div>

              <div className="p-2.5 bg-surface-container-lowest rounded-lg border border-surface-container-high flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Total Free General Beds:</span>
                <span className="font-bold text-on-surface">{totalBedsCount} Beds</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. EMERGENCY COMPLAINT & TICKET TRACKER SECTION */}
      <section id="emergency-complaint" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Emergency Complaint / Intake Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">Emergency Admission Complaint & Triage</h2>
                <p className="text-xs text-on-surface-variant">Submit patient symptoms & reserve an urgent hospital bed</p>
              </div>
            </div>

            {complaintSuccess ? (
              <div className="mt-6 p-6 rounded-xl bg-surface-container border border-tertiary/40 space-y-4">
                <div className="flex items-center gap-2 text-tertiary font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-tertiary" />
                  <span>Emergency Request Submitted Successfully</span>
                </div>

                <div className="p-4 rounded-lg bg-surface-container-lowest border border-surface-container-high space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-medium">Your Real-Time Ticket Code:</span>
                    <button
                      type="button"
                      onClick={() => copyTicketCode(complaintSuccess.ticket_code)}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                    >
                      {copiedTicket ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTicket ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                  <div className="text-xl font-bold font-mono text-primary tracking-wider">
                    {complaintSuccess.ticket_code}
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Keep this ticket code handy. The triage team at <strong>{complaintSuccess.hospital_name || "the hospital"}</strong> has received the notification.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComplaintSuccess(null);
                      setComplaintForm({
                        patient_name: "",
                        patient_age: 40,
                        patient_gender: "Male",
                        contact_phone: "",
                        emergency_type: "Cardiac / Severe Chest Pain",
                        severity: "CRITICAL",
                        notes: "",
                        requested_hospital_id: hospitals[0]?.id || 1,
                        eta_minutes: 15,
                      });
                    }}
                    className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/40 text-xs font-semibold hover:bg-surface-container-high transition-colors"
                  >
                    Submit Another Request
                  </button>
                  <a
                    href="#ticket-tracker"
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
                  >
                    View Status in Tracker
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="mt-6 space-y-4">
                
                {/* Row 1: Patient Name & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5">
                      Patient Full Name <span className="text-secondary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Patil"
                      value={complaintForm.patient_name}
                      onChange={(e) => setComplaintForm({ ...complaintForm, patient_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5">
                      Contact Phone Number <span className="text-secondary">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={complaintForm.contact_phone}
                      onChange={(e) => setComplaintForm({ ...complaintForm, contact_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Row 2: Age, Gender, ETA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5">
                      Patient Age
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={complaintForm.patient_age}
                      onChange={(e) => setComplaintForm({ ...complaintForm, patient_age: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5">
                      Gender
                    </label>
                    <select
                      value={complaintForm.patient_gender}
                      onChange={(e) => setComplaintForm({ ...complaintForm, patient_gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5">
                      Est. Arrival Time (Min)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={complaintForm.eta_minutes}
                      onChange={(e) => setComplaintForm({ ...complaintForm, eta_minutes: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Row 3: Target Hospital & Severity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5">
                      Target Hospital
                    </label>
                    <select
                      value={complaintForm.requested_hospital_id}
                      onChange={(e) => setComplaintForm({ ...complaintForm, requested_hospital_id: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city}) — {h.icu_available ?? 0} ICU Free
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5">
                      Triage Severity Level
                    </label>
                    <select
                      value={complaintForm.severity}
                      onChange={(e) => setComplaintForm({ ...complaintForm, severity: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-semibold"
                    >
                      <option value="CRITICAL">🔴 CRITICAL (Immediate ICU / Resuscitation)</option>
                      <option value="URGENT">🟠 URGENT (ER Trauma Bay under 1 hour)</option>
                      <option value="NORMAL">🟢 NORMAL (General Inpatient Ward)</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Chief Complaint Text Field */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">
                    Chief Complaint & Symptoms Description <span className="text-secondary">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe symptoms, vital signs if known, recent onset, or trauma details (e.g. Acute chest pain radiating to left shoulder, breathlessness, oxygen level 89%, conscious)..."
                    value={complaintForm.notes}
                    onChange={(e) => setComplaintForm({ ...complaintForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  ></textarea>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={complaintSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>{complaintSubmitting ? "Submitting Request..." : "Submit Emergency Complaint & Reserve Bed"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Real-time Ticket Status Checker */}
          <div id="ticket-tracker" className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container-high">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-on-surface">Track Admission Ticket</h2>
            </div>

            <p className="text-xs text-on-surface-variant">
              Enter your 11-digit emergency ticket (e.g. <span className="font-mono text-primary font-bold">SC-EMG-1042</span>) to monitor triage response and allocated bed status:
            </p>

            <form onSubmit={handleTrackTicket} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SC-EMG-1042"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/60 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={ticketLoading}
                className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                {ticketLoading ? "..." : <Search className="w-4 h-4" />}
                <span>Track</span>
              </button>
            </form>

            {ticketError && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
                {ticketError}
              </div>
            )}

            {trackedRequest && (
              <div className="p-4 rounded-xl bg-surface-container border border-surface-container-high space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-surface-container-high">
                  <span className="font-mono font-bold text-primary text-sm">
                    {trackedRequest.ticket_code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    trackedRequest.status === "BED_ALLOCATED" || trackedRequest.status === "ADMITTED"
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : trackedRequest.status === "TRIAGED"
                      ? "bg-primary-fixed text-on-primary-fixed"
                      : "bg-surface-container-highest text-on-surface"
                  }`}>
                    {trackedRequest.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-on-surface">
                  <p>
                    <strong className="text-on-surface-variant">Patient:</strong> {trackedRequest.patient_name} ({trackedRequest.patient_age}y, {trackedRequest.patient_gender})
                  </p>
                  <p>
                    <strong className="text-on-surface-variant">Assigned Facility:</strong> {trackedRequest.hospital_name || "Regional Triage Center"}
                  </p>
                  <p>
                    <strong className="text-on-surface-variant">Condition:</strong> {trackedRequest.emergency_type}
                  </p>
                  {trackedRequest.notes && (
                    <p className="text-on-surface-variant italic">
                      "{trackedRequest.notes}"
                    </p>
                  )}
                </div>

                {trackedRequest.allocated_bed_category && (
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-tertiary/30 text-tertiary font-bold text-xs flex items-center gap-2">
                    <BedDouble className="w-4 h-4" />
                    <span>Reserved Bed: {trackedRequest.allocated_bed_category}</span>
                  </div>
                )}

                <div className="text-[11px] text-on-surface-variant pt-1 flex justify-between items-center">
                  <span>ETA: ~{trackedRequest.eta_minutes} mins</span>
                  <span>Created: {new Date(trackedRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-surface-container-high text-[11px] text-on-surface-variant">
              <span>SmartCare automatically alerts the attending ER nurse station upon ticket creation.</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SEARCH & FILTER BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-on-surface">Find Verified Hospitals & Beds</h2>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              Showing {hospitals.length} facilities
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search hospital name, locality, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* City Select */}
            <div className="md:col-span-3">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="All">All Cities / Localities</option>
                <option value="Pune">Pune City</option>
                <option value="Shivaji Nagar">Shivaji Nagar</option>
                <option value="Deccan">Deccan Gymkhana</option>
                <option value="Kalyani Nagar">Kalyani Nagar</option>
              </select>
            </div>

            {/* Radius Selector */}
            <div className="md:col-span-2">
              <select
                value={radiusKm || ""}
                onChange={(e) => setRadiusKm(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Any Distance</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Quick Bed Filter Pills */}
          <div className="pt-2 border-t border-surface-container-high flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter by Bed Type:
            </span>

            {[
              { label: "All Facilities", value: "All" },
              { label: "ICU Beds Available", value: "ICU" },
              { label: "Ventilators Available", value: "Ventilator" },
              { label: "Oxygen Beds", value: "Oxygen" },
              { label: "Emergency Trauma Bays", value: "Emergency" },
            ].map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setSelectedBedType(pill.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedBedType === pill.value
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOSPITAL CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <div className="p-16 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-on-surface-variant font-medium">Fetching real-time hospital bed telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-error-container text-on-error-container rounded-xl text-xs font-medium">
            {error}
          </div>
        ) : hospitals.length === 0 ? (
          <div className="p-16 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high space-y-3">
            <Building className="w-10 h-10 text-on-surface-variant mx-auto opacity-50" />
            <p className="text-sm font-bold text-on-surface">No hospitals match your search filters.</p>
            <p className="text-xs text-on-surface-variant">Try expanding your radius or selecting "All Cities".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => {
              const icuCount = hospital.icu_available ?? 0;
              const generalBeds = hospital.total_available_beds ?? 0;

              return (
                <div
                  key={hospital.id}
                  className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-on-surface">
                            {hospital.name}
                          </h3>
                        </div>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{hospital.address}, {hospital.city}</span>
                        </p>
                      </div>

                      {hospital.distance_km != null && typeof hospital.distance_km === "number" && (
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-bold text-[11px] shrink-0">
                          {hospital.distance_km.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    {/* Bed Telemetry Badges */}
                    <div className="my-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high">
                        <span className="text-[11px] text-on-surface-variant block">ICU Critical Beds</span>
                        <span className={`text-base font-bold ${icuCount > 0 ? "text-secondary" : "text-on-surface-variant"}`}>
                          {icuCount} Free
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high">
                        <span className="text-[11px] text-on-surface-variant block">General Ward Beds</span>
                        <span className="text-base font-bold text-primary">
                          {generalBeds} Free
                        </span>
                      </div>
                    </div>

                    {/* Facility Attributes */}
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-on-surface-variant mb-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container border border-surface-container-high">
                        Ambulances: {hospital.available_ambulances ?? hospital.ambulance_count ?? 1}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container border border-surface-container-high">
                        Cap: {hospital.total_capacity}
                      </span>
                      {hospital.verification_status === "APPROVED" && (
                        <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> State Approved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-surface-container-high flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => prefillHospitalComplaint(hospital)}
                      className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-colors text-center"
                    >
                      Request Bed
                    </button>

                    <button
                      type="button"
                      onClick={() => openHospitalDetail(hospital.id)}
                      className="py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 font-semibold text-xs transition-colors"
                    >
                      Details
                    </button>

                    <a
                      href={`tel:${hospital.emergency_phone}`}
                      className="p-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors"
                      title="Call Emergency Desk"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. HOSPITAL DETAILS MODAL */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-start justify-between pb-3 border-b border-surface-container-high">
              <div>
                <h3 className="text-lg font-bold text-on-surface">{selectedHospital.name}</h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state} - {selectedHospital.pincode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHospital(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contacts Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-container rounded-lg">
                <span className="text-on-surface-variant block font-medium">Emergency Desk Phone:</span>
                <a href={`tel:${selectedHospital.emergency_phone}`} className="font-bold text-secondary text-sm hover:underline">
                  {selectedHospital.emergency_phone}
                </a>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <span className="text-on-surface-variant block font-medium">Official Email:</span>
                <span className="font-semibold text-on-surface">{selectedHospital.email}</span>
              </div>
            </div>

            {/* Bed breakdown */}
            {selectedHospital.beds && selectedHospital.beds.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Real-Time Bed Availability
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedHospital.beds.map((b) => (
                    <div key={b.id} className="p-2.5 rounded-lg border border-surface-container-high bg-surface-container-low text-xs">
                      <span className="block font-semibold text-on-surface">{b.category}</span>
                      <span className="text-primary font-bold">{b.available_beds} Free</span>
                      <span className="text-[10px] text-on-surface-variant block">of {b.total_beds} total</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resource Inventory */}
            {selectedHospital.resources && selectedHospital.resources.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Critical Supplies & Inventory
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedHospital.resources.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-lg border border-surface-container-high bg-surface-container-low text-xs flex justify-between items-center">
                      <span className="font-medium text-on-surface">{r.resource_name}</span>
                      <span className="font-bold text-on-surface">{r.quantity_available} {r.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-surface-container-high flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedHospital(null)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 text-xs font-semibold hover:bg-surface-container-high transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  prefillHospitalComplaint(selectedHospital);
                  setSelectedHospital(null);
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors"
              >
                File Emergency Complaint at this Hospital
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
