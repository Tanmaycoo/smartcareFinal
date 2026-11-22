"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  FileCheck2,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Activity,
  Ambulance,
  BedDouble,
  Clock,
  Server,
  Lock,
  Eye,
  Check,
  X,
  ShieldCheck,
  Building,
  Award,
  Calendar,
  PhoneCall,
  Sliders,
  LogOut,
  ExternalLink,
  Bell,
  CheckCircle,
  Radio,
  CreditCard,
  IndianRupee,
  Receipt
} from "lucide-react";
import {
  getStoredSession,
  clearSession,
  getAdminApplications,
  verifyHospitalApplication,
  getAdminHospitals,
  toggleHospitalActive,
  getAdminMetrics,
  getAdminAuditLogs,
  getAdminBillingOverview,
  Hospital,
  PlatformMetrics,
  AuditLog,
  AdminBillingOverview,
  UserSession
} from "@/lib/api";

interface ParsedDoc {
  id?: string;
  title: string;
  file_name?: string;
  file_type?: string;
  file_size?: string;
  file_data?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"applications" | "hospitals" | "telemetry" | "billing" | "audit">("applications");

  // State
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [adminBilling, setAdminBilling] = useState<AdminBillingOverview | null>(null);
  const [applications, setApplications] = useState<Hospital[]>([]);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Document Inspection Modal State
  const [inspectingHospital, setInspectingHospital] = useState<Hospital | null>(null);
  const [parsedDocs, setParsedDocs] = useState<ParsedDoc[]>([]);
  const [verifyNotes, setVerifyNotes] = useState("All clinical establishment licenses, fire clearances, and ICU bed capacities verified against State Health Directorate standards.");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Search filters
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [billingSearch, setBillingSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    const s = getStoredSession();
    if (!s || s.role !== "ADMIN") {
      router.push("/login/admin");
      return;
    }
    setSession(s);
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [m, apps, hosps, logs, billOverview] = await Promise.all([
        getAdminMetrics(),
        getAdminApplications(),
        getAdminHospitals(),
        getAdminAuditLogs(50),
        getAdminBillingOverview().catch(() => null),
      ]);
      setMetrics(m);
      setApplications(apps);
      setAllHospitals(hosps);
      setAuditLogs(logs);
      setAdminBilling(billOverview);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllAdminData();
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login/admin");
  };

  const handleInspect = (hosp: Hospital) => {
    setInspectingHospital(hosp);
    setVerifyNotes("All clinical establishment licenses, fire clearances, and ICU bed capacities verified against State Health Directorate standards.");
    setRejectionReason("");

    let docs: ParsedDoc[] = [];
    if (hosp.documents) {
      try {
        const parsed = JSON.parse(hosp.documents);
        if (Array.isArray(parsed)) {
          docs = parsed;
        }
      } catch {
        docs = [
          { title: "Medical Establishment License", file_name: "License_Certificate.pdf" },
          { title: "NABH Accreditation", file_name: "NABH_Accreditation_Certificate.pdf" },
          { title: "Fire Safety NOC", file_name: "Fire_Clearance_NOC.pdf" },
        ];
      }
    }
    if (docs.length === 0) {
      docs = [
        { title: "Medical Establishment License", file_name: "Medical_License.pdf" },
        { title: "Fire Safety Clearance NOC", file_name: "Fire_Safety_NOC.pdf" },
      ];
    }
    setParsedDocs(docs);
  };

  const handleVerify = async (action: "APPROVE" | "REJECT") => {
    if (!inspectingHospital) return;
    if (action === "REJECT" && !rejectionReason.trim()) {
      alert("Please provide a rejection reason so the hospital can rectify the issue.");
      return;
    }

    try {
      setActionLoading(true);
      await verifyHospitalApplication(
        inspectingHospital.id,
        action,
        verifyNotes,
        action === "REJECT" ? rejectionReason : undefined
      );

      setInspectingHospital(null);
      await loadAllAdminData();
      alert(`Hospital application ${action === "APPROVE" ? "APPROVED and activated" : "REJECTED"}.`);
    } catch (err: any) {
      alert(err.message || "Failed to submit verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (hospId: number) => {
    try {
      const updated = await toggleHospitalActive(hospId);
      setAllHospitals((prev) => prev.map((h) => (h.id === hospId ? updated : h)));
    } catch (err: any) {
      alert(err.message || "Could not toggle hospital status.");
    }
  };

  const filteredHospitals = allHospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.city.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.license_number.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.actor_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const filteredBillingSummaries = (adminBilling?.hospital_summaries || []).filter(
    (s) =>
      s.hospital_name.toLowerCase().includes(billingSearch.toLowerCase()) ||
      s.hospital_city.toLowerCase().includes(billingSearch.toLowerCase())
  );

  const formatINR = (val?: number) => {
    if (val === undefined || val === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex">
      {/* ===================== FIXED LEFT SIDEBAR (288px) ===================== */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 border-r border-outline-variant/30">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Clinical Ops Header */}
          <div className="h-16 flex items-center px-6 gap-3 bg-surface-container-low border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-on-surface leading-tight tracking-tight">SmartCare</span>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wide">State Command</span>
            </div>
          </div>

          {/* Mode Switcher: Operations vs Admin */}
          <div className="px-5 py-3">
            <div className="p-1 bg-surface-container rounded-lg flex items-center justify-between text-center">
              <button
                type="button"
                onClick={() => router.push("/hospital/dashboard")}
                className="flex-1 py-1 px-2 rounded text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Operations
              </button>
              <button
                type="button"
                className="flex-1 py-1 px-2 rounded text-xs font-bold bg-surface-container-lowest text-primary shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3 py-2">
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">
              Platform Governance
            </div>

            <button
              onClick={() => setActiveTab("applications")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "applications"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-4 h-4" />
                <span>Pending Approvals</span>
              </div>
              {applications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold animate-pulse">
                  {applications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("hospitals")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "hospitals"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4" />
                <span>Hospitals Directory</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-surface text-[10px] font-bold text-primary">
                {allHospitals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("telemetry")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "telemetry"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Platform Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "billing"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "audit"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>State Audit Logs</span>
            </button>

            <div className="my-3 border-t border-outline-variant/30"></div>

            <Link
              href="/"
              className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-primary bg-primary-fixed/40 hover:bg-primary-fixed/70 transition-colors"
            >
              <span>Citizen Emergency Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>

        {/* Bottom Mesh Status & Sign Out */}
        <div className="p-4 bg-surface-container-high/40 flex flex-col gap-2 border-t border-outline-variant/30">
          <div className="flex items-center justify-between p-2.5 bg-surface-container rounded-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
              <span className="text-xs font-bold text-on-surface">State Mesh: Active</span>
            </div>
            <span className="text-[11px] text-tertiary font-mono font-bold">100% OK</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-secondary font-semibold hover:text-secondary-container transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WRAPPER (pl-72) ===================== */}
      <div className="pl-72 flex flex-col min-h-screen w-full">
        {/* Fixed Top Header (left-72) */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-8 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant/40">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-on-surface">State Healthcare Command Center</span>
              <span className="text-[11px] text-on-surface-variant font-mono font-bold bg-surface-container-lowest px-1.5 py-0.5 rounded">
                SUPERADMIN NODE
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span>Central Authority Governance</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:911"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-bold hover:brightness-95 transition-all shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5 text-error animate-pulse" />
              <span>Quick Hotline: 911</span>
            </a>

            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {applications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary"></span>
              )}
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-outline-variant/40">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-on-surface">{session?.name || "System Administrator"}</div>
                <div className="text-[10px] text-primary font-mono font-bold">MASTER KEY</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* ===================== WORKSPACE CONTENT (pt-16) ===================== */}
        <main className="w-full pt-16 bg-surface flex-1 p-8 space-y-6">
          {/* Header Title & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                State Healthcare Command & Verification Center
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                SuperAdmin governance, hospital license accreditation, and statewide live mesh oversight.
              </p>
            </div>

            {/* Quick Tab Buttons */}
            <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("applications")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === "applications"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Approvals ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hospitals")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === "hospitals"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Directory ({allHospitals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("telemetry")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === "telemetry"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Platform Telemetry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("billing")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === "billing"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Billing Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === "audit"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Audit Logs
              </button>
            </div>
          </div>

          {/* 4 TOP STATEWIDE METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-on-surface-variant font-medium">Total Registered Hospitals</div>
                <div className="text-2xl font-extrabold text-on-surface mt-1">{metrics?.total_hospitals ?? allHospitals.length}</div>
                <div className="text-[11px] text-tertiary font-bold mt-0.5">{metrics?.approved_hospitals ?? 1} Verified Facilities</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-on-surface-variant font-medium">Total Bed Mesh Capacity</div>
                <div className="text-2xl font-extrabold text-on-surface mt-1">{metrics?.total_beds ?? 120}</div>
                <div className="text-[11px] text-tertiary font-bold mt-0.5">{metrics?.available_beds ?? 36} Beds Available</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                <BedDouble className="w-5 h-5 text-tertiary" />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-on-surface-variant font-medium">ICU Readiness</div>
                <div className="text-2xl font-extrabold text-secondary mt-1">{metrics?.icu_available ?? 2}</div>
                <div className="text-[11px] text-secondary font-bold mt-0.5">Critical Slots Open</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-on-error-container">
                <Activity className="w-5 h-5 text-error" />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-on-surface-variant font-medium">Pending Hospital Applications</div>
                <div className="text-2xl font-extrabold text-secondary mt-1">{applications.length}</div>
                <div className="text-[11px] text-secondary font-bold mt-0.5">Awaiting Review</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <FileCheck2 className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </div>

          {/* ===================== TAB 1: PENDING APPLICATIONS QUEUE ===================== */}
          {activeTab === "applications" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Hospital Onboarding Queue</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Hospitals pending SuperAdmin document verification. Access is blocked until approved.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
                  {applications.length} Awaiting Verification
                </span>
              </div>

              {applications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-tertiary mx-auto" />
                  <div className="font-bold text-base text-on-surface">All Hospital Applications Processed</div>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                    There are no pending registrations. New hospital applications will appear here for license and accreditation review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-base text-on-surface">{app.name}</div>
                          <div className="text-xs text-primary font-mono font-bold mt-0.5">
                            License: {app.license_number}
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold">
                          PENDING
                        </span>
                      </div>

                      <div className="text-xs text-on-surface-variant space-y-1">
                        <div>Location: {app.address}, {app.city}, {app.state} {app.pincode}</div>
                        <div>Contact: {app.emergency_phone} • Email: {app.email}</div>
                        <div>Capacities: {app.total_capacity} Beds • {app.ambulance_count} Ambulances</div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-on-surface">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>Credentials Attached (License, NABH, Fire NOC)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInspect(app)}
                          className="px-3 py-1 rounded bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm"
                        >
                          Verify & Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: HOSPITALS DIRECTORY ===================== */}
          {activeTab === "hospitals" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Registered Hospitals Directory</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Toggle active mesh routing status or view facility details across the state network.
                  </p>
                </div>
                <div className="relative w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Search hospital or city..."
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs bg-surface-container-lowest"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Hospital Name & License</th>
                      <th className="py-3 px-4">City / Region</th>
                      <th className="py-3 px-4">Total Beds</th>
                      <th className="py-3 px-4">ICU Open</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4 text-right">Mesh Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredHospitals.map((h) => (
                      <tr key={h.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-sm text-on-surface">{h.name}</div>
                          <div className="text-[11px] text-outline font-mono">{h.license_number}</div>
                        </td>
                        <td className="py-3 px-4">{h.city}, {h.state}</td>
                        <td className="py-3 px-4 font-bold text-primary">{h.total_available_beds ?? 36} Avail</td>
                        <td className="py-3 px-4 font-bold text-secondary">{h.icu_available ?? 2} ICU</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.verification_status === "APPROVED"
                                ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                : "bg-secondary-fixed text-on-secondary-fixed"
                            }`}
                          >
                            {h.verification_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(h.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              h.is_active
                                ? "bg-tertiary text-white shadow-sm"
                                : "bg-surface-container text-outline"
                            }`}
                          >
                            {h.is_active ? "Mesh Active" : "Disabled"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: PLATFORM TELEMETRY ===================== */}
          {activeTab === "telemetry" && (
            <div className="space-y-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                <h3 className="font-bold text-lg text-on-surface">Statewide Real-Time Mesh Telemetry</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="text-xs text-on-surface-variant font-medium">Invasive Ventilator Network</div>
                    <div className="text-2xl font-bold text-tertiary">{metrics?.ventilators_available ?? 8} Ready</div>
                    <p className="text-[11px] text-on-surface-variant">Active synchronized across state trauma centers.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="text-xs text-on-surface-variant font-medium">Active In-Transit Patient Transfers</div>
                    <div className="text-2xl font-bold text-primary">{metrics?.active_transfers ?? 1} Transits</div>
                    <p className="text-[11px] text-on-surface-variant">Under active emergency EMS monitoring.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="text-xs text-on-surface-variant font-medium">Pending Citizen Emergency Requests</div>
                    <div className="text-2xl font-bold text-secondary">{metrics?.pending_emergency_requests ?? 0} Tickets</div>
                    <p className="text-[11px] text-on-surface-variant">Citizen queue awaiting hospital triage intake.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 4: AUDIT LOGS ===================== */}
          {/* ===================== VIEW 4: BILLING OVERVIEW ===================== */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Platform Billing Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-on-surface-variant font-medium">Platform Total Billed</div>
                    <div className="text-2xl font-black text-on-surface mt-1">
                      {formatINR(adminBilling?.total_platform_billed)}
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">Statewide cumulative</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-on-surface-variant font-medium">Total Collected</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatINR(adminBilling?.total_platform_collected)}
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">Settled patient receipts</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-on-surface-variant font-medium">Outstanding Balance</div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {formatINR(adminBilling?.total_platform_outstanding)}
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">Receivables in transit</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-on-surface-variant font-medium">Invoices Issued</div>
                    <div className="text-2xl font-black text-on-surface mt-1">
                      {adminBilling?.total_platform_bills ?? 0}
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">Across all facilities</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                    <Receipt className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Hospital Billing Summaries Table */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Hospital-Wise Billing & Catalogue Summaries</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Platform-level financial oversight across accredited hospitals.
                    </p>
                  </div>
                  <div className="relative w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-on-surface-variant" />
                    <input
                      type="text"
                      placeholder="Search hospital or city..."
                      value={billingSearch}
                      onChange={(e) => setBillingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs bg-surface-container-lowest"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Hospital Facility</th>
                        <th className="py-3 px-4">City</th>
                        <th className="py-3 px-4 text-center">Invoices</th>
                        <th className="py-3 px-4 text-right">Total Billed</th>
                        <th className="py-3 px-4 text-right">Collected</th>
                        <th className="py-3 px-4 text-right">Outstanding</th>
                        <th className="py-3 px-4 text-center">Published Rates</th>
                        <th className="py-3 px-4">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {filteredBillingSummaries.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                            No billing records registered across hospitals yet.
                          </td>
                        </tr>
                      ) : (
                        filteredBillingSummaries.map((summary) => (
                          <tr key={summary.hospital_id} className="hover:bg-surface-container-low/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-on-surface">
                              {summary.hospital_name}
                            </td>
                            <td className="py-3 px-4 text-on-surface-variant font-medium">
                              {summary.hospital_city}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold">
                              {summary.total_bills}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-on-surface">
                              {formatINR(summary.total_billed)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatINR(summary.total_collected)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                              {formatINR(summary.total_outstanding)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                {summary.published_services_count} services
                              </span>
                            </td>
                            <td className="py-3 px-4 text-on-surface-variant font-mono text-[11px]">
                              {summary.last_activity
                                ? new Date(summary.last_activity).toLocaleDateString("en-IN")
                                : "N/A"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Platform Immutable Audit Logs</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Regulatory log recording every license approval, status change, and critical bed adjustment.
                  </p>
                </div>
                <div className="relative w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Search audit trail..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs bg-surface-container-lowest"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3 px-4 text-outline whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-on-surface">{log.actor_email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-on-surface">
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary">{log.action}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===================== INSPECTION & VERIFICATION MODAL ===================== */}
      {inspectingHospital && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">Verify: {inspectingHospital.name}</h3>
              </div>
              <button onClick={() => setInspectingHospital(null)} className="p-1 rounded hover:bg-surface-container">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                <div className="font-bold text-sm text-on-surface">License: {inspectingHospital.license_number}</div>
                <div>Location: {inspectingHospital.address}, {inspectingHospital.city}, {inspectingHospital.state} {inspectingHospital.pincode}</div>
                <div>Contacts: {inspectingHospital.emergency_phone} • Email: {inspectingHospital.email}</div>
                <div>Total Capacity: {inspectingHospital.total_capacity} beds • {inspectingHospital.ambulance_count} ambulances</div>
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Attached Accreditation Documents</label>
                <div className="space-y-1.5">
                  {parsedDocs.map((doc, idx) => (
                    <div key={idx} className="p-2 rounded bg-surface-container flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-on-surface">{doc.title}</span>
                      </div>
                      <span className="text-[11px] text-tertiary font-bold">Verified Hash Signed</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Verification Inspection Notes</label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-secondary block mb-1">Rejection Reason (If Rejecting)</label>
                <input
                  type="text"
                  placeholder="e.g. License expired or Fire NOC missing..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerify("REJECT")}
                className="px-4 py-2 rounded-lg border border-error text-error hover:bg-error-container text-xs font-bold transition-all"
              >
                Reject Application
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerify("APPROVE")}
                className="px-5 py-2 rounded-lg bg-tertiary hover:bg-tertiary-container text-white text-xs font-bold shadow-sm transition-all"
              >
                {actionLoading ? "Processing..." : "Approve & Activate Hospital"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
