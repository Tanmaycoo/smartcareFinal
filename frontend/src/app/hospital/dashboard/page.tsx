"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  BedDouble,
  Activity,
  Ambulance,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Edit,
  Save,
  X,
  Trash2,
  PlusCircle,
  Radio,
  Sliders,
  Shield,
  LogOut,
  ArrowRightLeft,
  FileText,
  UserCheck,
  Send,
  Eye,
  Check,
  Award,
  Zap,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  Tag,
  CreditCard,
  Receipt,
  Droplets,
  Share2
} from "lucide-react";
import PricingManagementTab from "@/components/hospital/PricingManagementTab";
import BillingManagementTab from "@/components/hospital/BillingManagementTab";
import BloodManagementTab from "@/components/hospital/BloodManagementTab";
import ReferralBookingTab from "@/components/hospital/ReferralBookingTab";
import {
  getStoredSession,
  clearSession,
  getHospitalBeds,
  adjustBedCount,
  updateBed,
  createBedCategory,
  deleteBedCategory,
  getHospitalResources,
  adjustResourceCount,
  updateResource,
  createResource,
  deleteResource,
  getHospitalRequests,
  updateRequestStatus,
  getHospitalTransfers,
  createTransfer,
  updateTransferStatus,
  getHospitals,
  subscribeToDataChanges,
  BedCategory,
  ResourceInventory,
  PatientRequest,
  TransferRequest,
  Hospital,
  UserSession
} from "@/lib/api";

const ALL_BED_PRESETS = [
  { group: "Critical Care", label: "ICU (Intensive Care Unit) Bed", price: 5000 },
  { group: "Critical Care", label: "HDU (High Dependency Unit) Bed", price: 3500 },
  { group: "Critical Care", label: "PICU (Pediatric Intensive Care) Bed", price: 4500 },
  { group: "Critical Care", label: "NICU (Neonatal Intensive Care) Bed", price: 5000 },
  { group: "Critical Care", label: "CCU / ICCU (Coronary Care) Bed", price: 5500 },
  { group: "Critical Care", label: "Ventilator Supported Critical Bed", price: 6000 },
  { group: "General Wards", label: "General Ward Bed (Male)", price: 1000 },
  { group: "General Wards", label: "General Ward Bed (Female)", price: 1000 },
  { group: "General Wards", label: "General Ward Bed (Common / Mixed)", price: 1000 },
  { group: "General Wards", label: "Semi-Private Room (Twin Sharing) Bed", price: 2200 },
  { group: "General Wards", label: "Private Single Deluxe Room Bed", price: 3800 },
  { group: "General Wards", label: "Super Deluxe / Suite Ward Bed", price: 6500 },
  { group: "Emergency & Specialty", label: "Emergency / Trauma Bay Bed", price: 1500 },
  { group: "Emergency & Specialty", label: "Oxygen Supported Ward Bed", price: 1800 },
  { group: "Emergency & Specialty", label: "Isolation Ward Bed (Infectious Diseases)", price: 2800 },
  { group: "Emergency & Specialty", label: "Post-Operative Recovery Bed (PACU)", price: 2500 },
  { group: "Emergency & Specialty", label: "Dialysis Unit Bed / Station", price: 2000 },
  { group: "Emergency & Specialty", label: "Maternity & Labour Delivery Bed (LDR)", price: 3000 },
  { group: "Emergency & Specialty", label: "Day Care / Chemotherapy Bed", price: 1800 },
  { group: "Emergency & Specialty", label: "Burns Unit Specialized Bed", price: 4000 },
  { group: "Emergency & Specialty", label: "Pediatric General Ward Bed", price: 1500 },
];

export default function HospitalDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "beds" | "resources" | "requests" | "transfers" | "pricing" | "billing" | "blood" | "referrals" | "profile">("dashboard");
  // Admitted patients for billing
  const [admittedPatients, setAdmittedPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Data states
  const [beds, setBeds] = useState<BedCategory[]>([]);
  const [resources, setResources] = useState<ResourceInventory[]>([]);
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter in transfer/request queue
  const [queueFilter, setQueueFilter] = useState<"ALL" | "CRITICAL" | "ACTIVE" | "COMPLETED" | "DIVERTED">("ALL");

  // New Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    patient_name: "",
    target_hospital_id: 0,
    required_service: "",
    priority: "P1 - Immediate (Within 30m)",
    owner_doctor: "",
    deadline: "30 mins",
    notes: "",
    ambulance_assigned: ""
  });

  // Triage Modal State
  const [triageRequest, setTriageRequest] = useState<PatientRequest | null>(null);
  const [selectedBedCategory, setSelectedBedCategory] = useState("ICU (Intensive Care)");

  // Add Bed Modal State
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [addBedForm, setAddBedForm] = useState({
    category: "",
    total_beds: 10,
    available_beds: 10,
    price_per_day: 2000
  });

  // Add Resource Modal State
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [addResourceForm, setAddResourceForm] = useState({
    resource_name: "",
    category: "Oxygen",
    quantity_available: 20,
    unit: "cylinders"
  });

  useEffect(() => {
    const s = getStoredSession();
    if (!s || (s.role !== "HOSPITAL" && s.role !== "ADMIN")) {
      router.push("/login/hospital");
      return;
    }
    setSession(s);
    loadAllData(s.hospital_id || undefined);

    // Instant real-time cross-tab sync when requests, beds, or pricing mutate
    const unsubscribe = subscribeToDataChanges(() => {
      loadAllData(s.hospital_id || undefined, true);
    });

    // Background live telemetry polling every 4 seconds for emergency complaints & bed telemetry
    const interval = setInterval(() => {
      loadAllData(s.hospital_id || undefined, true);
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadAllData = async (hospId?: number, silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const [bedsData, resData, reqData, trfData, hospData] = await Promise.all([
        getHospitalBeds(hospId),
        getHospitalResources(hospId),
        getHospitalRequests(undefined, hospId),
        getHospitalTransfers("ALL", hospId),
        getHospitals()
      ]);
      setBeds(bedsData);
      setResources(resData);
      setRequests(reqData);
      setTransfers(trfData);
      setAllHospitals(hospData);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData(session?.hospital_id || undefined, false);
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login/hospital");
  };

  // Bed Adjustments
  const handleBedDelta = async (bedId: number, delta: number) => {
    try {
      const updated = await adjustBedCount(bedId, delta);
      setBeds((prev) => prev.map((b) => (b.id === bedId ? updated : b)));
    } catch (err: any) {
      alert(err.message || "Could not adjust bed count.");
    }
  };

  // Resource Adjustments
  const handleResourceDelta = async (resId: number, delta: number) => {
    try {
      const updated = await adjustResourceCount(resId, delta);
      setResources((prev) => prev.map((r) => (r.id === resId ? updated : r)));
    } catch (err: any) {
      alert(err.message || "Could not adjust resource.");
    }
  };

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBedForm.category.trim()) {
      alert("Please enter a category name (e.g. ICU, General, Pediatric).");
      return;
    }
    try {
      const created = await createBedCategory(addBedForm);
      setBeds((prev) => [...prev, created]);
      setShowAddBedModal(false);
      setAddBedForm({ category: "", total_beds: 10, available_beds: 10, price_per_day: 2000 });
    } catch (err: any) {
      alert(err.message || "Failed to add bed category.");
    }
  };

  const handleDeleteBed = async (bedId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to remove bed category "${categoryName}"?`)) return;
    try {
      await deleteBedCategory(bedId);
      setBeds((prev) => prev.filter((b) => b.id !== bedId));
    } catch (err: any) {
      alert(err.message || "Failed to delete bed category.");
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addResourceForm.resource_name.trim()) {
      alert("Please enter a resource name (e.g. Oxygen Cylinders, Blood Unit O+).");
      return;
    }
    try {
      const created = await createResource(addResourceForm);
      setResources((prev) => [...prev, created]);
      setShowAddResourceModal(false);
      setAddResourceForm({ resource_name: "", category: "Oxygen", quantity_available: 20, unit: "cylinders" });
    } catch (err: any) {
      alert(err.message || "Failed to add resource.");
    }
  };

  const handleDeleteResource = async (resId: number, resName: string) => {
    if (!confirm(`Are you sure you want to remove resource "${resName}"?`)) return;
    try {
      await deleteResource(resId);
      setResources((prev) => prev.filter((r) => r.id !== resId));
    } catch (err: any) {
      alert(err.message || "Failed to delete resource.");
    }
  };

  // Open Triage Modal with preselection matching real bed inventory
  const openTriageModal = (req: PatientRequest) => {
    setTriageRequest(req);
    if (req.allocated_bed_category && beds.some((b) => b.category.toLowerCase() === req.allocated_bed_category?.toLowerCase())) {
      setSelectedBedCategory(req.allocated_bed_category);
    } else if (beds.length > 0) {
      const avail = beds.find((b) => b.available_beds > 0) || beds[0];
      setSelectedBedCategory(avail.category);
    }
  };

  // Request Triage & Allocation
  const handleTriageSubmit = async () => {
    if (!triageRequest) return;
    try {
      // Find matching bed category to decrement
      const targetBed = beds.find(
        (b) =>
          b.category.toLowerCase() === selectedBedCategory.toLowerCase() ||
          b.category.toLowerCase().includes(selectedBedCategory.toLowerCase()) ||
          selectedBedCategory.toLowerCase().includes(b.category.toLowerCase())
      ) || beds.find((b) => b.available_beds > 0);

      // Optimistic instant UI update
      if (targetBed) {
        setBeds((prev) =>
          prev.map((b) =>
            b.id === targetBed.id
              ? {
                  ...b,
                  available_beds: Math.max(0, b.available_beds - 1),
                  occupied_beds: (b.occupied_beds || 0) + 1,
                }
              : b
          )
        );
      }

      const updated = await updateRequestStatus(triageRequest.id, {
        status: "BED_ALLOCATED",
        allocated_bed_category: targetBed ? targetBed.category : selectedBedCategory,
      });

      // Explicitly decrement bed count on backend database to guarantee sync
      if (targetBed && targetBed.available_beds > 0) {
        try {
          await adjustBedCount(targetBed.id, -1);
        } catch (e) {
          console.warn("adjustBedCount fallback:", e);
        }
      }

      setRequests((prev) => prev.map((r) => (r.id === triageRequest.id ? updated : r)));
      setTriageRequest(null);
      await loadAllData(session?.hospital_id || undefined, true);
    } catch (err: any) {
      alert(err.message || "Failed to triage request.");
      await loadAllData(session?.hospital_id || undefined, true);
    }
  };

  const handleAdmitRequest = async (requestId: number) => {
    try {
      const targetReq = requests.find((r) => r.id === requestId);
      const isPriorAllocated = targetReq?.status === "BED_ALLOCATED";

      // If admitting directly without prior allocation, find a bed to decrement
      let bedToDecrement: BedCategory | undefined;
      if (!isPriorAllocated) {
        bedToDecrement = beds.find(
          (b) =>
            (targetReq?.allocated_bed_category &&
              (b.category.toLowerCase() === targetReq.allocated_bed_category.toLowerCase() ||
               b.category.toLowerCase().includes(targetReq.allocated_bed_category.toLowerCase()))) ||
            b.available_beds > 0
        ) || beds[0];

        if (bedToDecrement) {
          // Optimistic UI update
          setBeds((prev) =>
            prev.map((b) =>
              b.id === bedToDecrement!.id
                ? {
                    ...b,
                    available_beds: Math.max(0, b.available_beds - 1),
                    occupied_beds: (b.occupied_beds || 0) + 1,
                  }
                : b
            )
          );
        }
      }

      const updated = await updateRequestStatus(requestId, {
        status: "ADMITTED",
        allocated_bed_category: targetReq?.allocated_bed_category || bedToDecrement?.category,
      });

      // If direct admit, ensure bed count is adjusted on backend
      if (!isPriorAllocated && bedToDecrement && bedToDecrement.available_beds > 0) {
        try {
          await adjustBedCount(bedToDecrement.id, -1);
        } catch (e) {
          console.warn("adjustBedCount fallback on admit:", e);
        }
      }

      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      await loadAllData(session?.hospital_id || undefined, true);
    } catch (err: any) {
      alert(err.message || "Failed to admit patient.");
      await loadAllData(session?.hospital_id || undefined, true);
    }
  };

  const handleCompleteRequest = async (requestId: number) => {
    if (!confirm("Confirm patient care completed / discharge? This will release the bed back to available inventory.")) return;
    try {
      const targetReq = requests.find((r) => r.id === requestId);
      const updated = await updateRequestStatus(requestId, { status: "COMPLETED" });

      // Release bed back to inventory if allocated
      if (targetReq?.allocated_bed_category) {
        const matchingBed = beds.find(
          (b) =>
            b.category.toLowerCase() === targetReq.allocated_bed_category?.toLowerCase() ||
            b.category.toLowerCase().includes(targetReq.allocated_bed_category?.toLowerCase() || "") ||
            (targetReq.allocated_bed_category?.toLowerCase() || "").includes(b.category.toLowerCase())
        );
        if (matchingBed) {
          try {
            await adjustBedCount(matchingBed.id, 1);
          } catch (e) {
            console.warn("adjustBedCount fallback on complete:", e);
          }
        }
      }

      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      await loadAllData(session?.hospital_id || undefined, true);
    } catch (err: any) {
      alert(err.message || "Failed to mark care completed.");
      await loadAllData(session?.hospital_id || undefined, true);
    }
  };

  const handleDivertRequest = async (requestId: number) => {
    const reason = prompt(
      "Enter reason for diversion / rerouting (e.g. ICU at capacity, specialized surgery needed):",
      "Facility at capacity, rerouted to nearest trauma center"
    );
    if (reason === null) return;
    try {
      const targetReq = requests.find((r) => r.id === requestId);
      const updated = await updateRequestStatus(requestId, {
        status: "DIVERTED",
        notes: reason ? `${targetReq?.notes ? targetReq.notes + " • " : ""}[Diverted: ${reason}]` : targetReq?.notes,
      });

      // If bed was allocated, release back to available beds
      if (targetReq?.status === "BED_ALLOCATED" || targetReq?.status === "ADMITTED") {
        if (targetReq.allocated_bed_category) {
          const matchingBed = beds.find(
            (b) =>
              b.category.toLowerCase() === targetReq.allocated_bed_category?.toLowerCase() ||
              b.category.toLowerCase().includes(targetReq.allocated_bed_category?.toLowerCase() || "") ||
              (targetReq.allocated_bed_category?.toLowerCase() || "").includes(b.category.toLowerCase())
          );
          if (matchingBed) {
            try {
              await adjustBedCount(matchingBed.id, 1);
            } catch (e) {
              console.warn("adjustBedCount fallback on divert:", e);
            }
          }
        }
      }

      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      await loadAllData(session?.hospital_id || undefined, true);
    } catch (err: any) {
      alert(err.message || "Failed to divert request.");
      await loadAllData(session?.hospital_id || undefined, true);
    }
  };

  const renderRequestStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "COMPLETED" || s === "DISCHARGED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Care Completed
        </span>
      );
    }
    if (s === "REJECTED" || s === "CANCELLED" || s === "DIVERTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-bold border border-error/30">
          <XCircle className="w-3 h-3 text-error" />
          Rerouted / Diverted
        </span>
      );
    }
    if (s === "ADMITTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-[11px] font-bold border border-teal-300/40">
          <BedDouble className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          Admitted to Bay
        </span>
      );
    }
    if (s === "BED_ALLOCATED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
          <CheckCircle2 className="w-3 h-3 text-primary" />
          Bed Allocated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-bold">
        <Clock className="w-3 h-3 text-on-surface-variant" />
        Pending Triage
      </span>
    );
  };

  // Transfer Submit
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.target_hospital_id) {
      alert("Please select a receiving destination hospital.");
      return;
    }
    try {
      const created = await createTransfer(transferForm);
      setTransfers([created, ...transfers]);
      setShowTransferModal(false);
      setTransferForm({
        patient_name: "",
        target_hospital_id: 0,
        required_service: "",
        priority: "P1 - Immediate (Within 30m)",
        owner_doctor: "",
        deadline: "30 mins",
        notes: "",
        ambulance_assigned: ""
      });
    } catch (err: any) {
      alert(err.message || "Failed to initiate transfer.");
    }
  };

  // Compute live aggregates
  const totalCapacity = beds.reduce((acc, b) => acc + (b.total_beds || 0), 0);
  const totalAvailable = beds.reduce((acc, b) => acc + (b.available_beds || 0), 0);
  const totalOccupied = totalCapacity - totalAvailable;
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const generalBed = beds.find((b) => !b.category.toUpperCase().includes("ICU") && !b.category.toUpperCase().includes("ER")) || beds[0];
  const icuBed = beds.find((b) => b.category.toUpperCase().includes("ICU"));
  const erBed = beds.find((b) => b.category.toUpperCase().includes("ER") || b.category.toUpperCase().includes("EMERGENCY") || b.category.toUpperCase().includes("TRIAGE"));

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const criticalRequests = requests.filter((r) => r.severity === "CRITICAL" || r.severity === "URGENT");
  const activeRequests = requests.filter((r) => r.status === "PENDING" || r.status === "BED_ALLOCATED" || r.status === "ADMITTED");
  const completedRequests = requests.filter((r) => r.status === "COMPLETED" || r.status === "DISCHARGED");
  const divertedRequests = requests.filter((r) => r.status === "DIVERTED" || r.status === "REJECTED" || r.status === "CANCELLED");

  const filteredRequests = queueFilter === "CRITICAL"
    ? criticalRequests
    : queueFilter === "ACTIVE"
    ? activeRequests
    : queueFilter === "COMPLETED"
    ? completedRequests
    : queueFilter === "DIVERTED"
    ? divertedRequests
    : requests;

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex">
      {/* ===================== FIXED LEFT SIDEBAR (288px) ===================== */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 border-r border-outline-variant/30">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Clinical Ops Header */}
          <div className="h-16 flex items-center px-6 gap-3 bg-surface-container-low border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-on-surface leading-tight tracking-tight">SmartCare</span>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wide">Clinical Ops</span>
            </div>
          </div>

          {/* Mode Switcher: Operations vs Admin */}
          <div className="px-5 py-3">
            <div className="p-1 bg-surface-container rounded-lg flex items-center justify-between text-center">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="flex-1 py-1 px-2 rounded text-xs font-bold bg-surface-container-lowest text-primary shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                Operations
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="flex-1 py-1 px-2 rounded text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3 py-2">
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">
              Hospital Operations
            </div>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "dashboard"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("beds")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "beds"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <BedDouble className="w-4 h-4" />
                <span>Bed Management</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-surface text-[10px] font-bold text-primary">
                {totalAvailable}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("resources")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "resources"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4" />
                <span>Resource Inventory</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-surface text-[10px] font-bold text-on-surface-variant">
                {resources.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "requests"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <Ambulance className="w-4 h-4" />
                <span>Requests & Transfers</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("pricing")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "pricing"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Pricing & Services</span>
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
              <span>Patient Billing</span>
            </button>

            <button
              onClick={() => setActiveTab("blood")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "blood"
                  ? "bg-rose-50 text-rose-700 font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Droplets className="w-4 h-4 text-rose-600" />
              <span>Blood & Donors</span>
            </button>

            <button
              onClick={() => setActiveTab("referrals")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "referrals"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Share2 className="w-4 h-4 text-primary" />
              <span>Referrals & Booking</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === "profile"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Hospital Profile</span>
            </button>

            <div className="px-3 pt-4 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">
              Platform Admin
            </div>

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Approvals</span>
            </Link>

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Hospitals Directory</span>
            </Link>

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
              <span className="text-xs font-bold text-on-surface">Mesh Synced: Live</span>
            </div>
            <span className="text-[11px] text-tertiary font-mono font-bold">#SC-LIVE</span>
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
              <span>Sign Out</span>
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
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-on-surface">
                {session?.hospital_name || "Apollo Super Specialty Hospital"}
              </span>
              <span className="text-[11px] text-on-surface-variant font-mono">
                ID: SC-HOSP-{session?.hospital_id ? String(session.hospital_id).padStart(4, "0") : "4491"}
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span>Live Dispatch / Synced</span>
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
              {pendingRequests.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary"></span>
              )}
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-outline-variant/40">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-on-surface">{session?.name || "Dr. Marcus Vance"}</div>
                <div className="text-[10px] text-on-surface-variant font-medium">Operations Lead</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {(session?.name || "M").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* ===================== WORKSPACE CONTENT (pt-16) ===================== */}
        <main className="w-full pt-16 bg-surface flex-1">
          {activeTab === "dashboard" && (
            <div className="flex flex-col w-full">
              {/* TOP TELEMETRY STRIP & URGENT BROADCAST BANNER */}
              <div className="p-8 pb-0 space-y-6">
                {/* Welcome Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                        Welcome back, Clinical Operations Team 👋
                      </h1>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                        Live Node Sync
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
                      <span className="font-semibold text-primary">{session?.hospital_name || "Apollo Super Specialty Hospital"}</span>
                      <span>•</span>
                      <span>Verified Multi-Specialty Facility</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-tertiary font-semibold">
                        <Radio className="w-3.5 h-3.5" />
                        GPS Mesh Synced: Active (Lat 18.5204° N, Long 73.8567° E)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshing ? "animate-spin" : ""}`} />
                      <span>Force Network Broadcast</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("requests")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Fast Triage Intake</span>
                    </button>
                  </div>
                </div>

                {/* Onboarding Notice when Beds are Empty */}
                {beds.length === 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                        <BedDouble className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-on-surface">No Wards or Beds Configured Yet</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Your facility currently has 0 beds published. As hospital staff, you can manually add your wards, ICU units, and real bed capacities below.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("beds");
                        setShowAddBedModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Bed Category</span>
                    </button>
                  </div>
                )}


                {/* Urgent ER Access & Critical Triage Bar */}
                <div className="relative overflow-hidden rounded-xl bg-error-container/40 p-5 shadow-sm border border-error/20">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-white shrink-0 shadow-md">
                        <AlertCircle className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-white text-[11px] font-bold uppercase tracking-wider">
                            Level 1 Trauma Active
                          </span>
                          <span className="font-bold text-sm text-on-surface">Emergency Triage Status: Acute Code Red</span>
                          <span className="text-secondary font-bold text-xs">• Regional Mass Casualty Protocol Standby</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {erBed ? `Emergency triage slots: ${erBed.available_beds} of ${erBed.total_beds} slots unallocated.` : "Emergency trauma and ICU slots can be configured and updated in real time by hospital staff."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab("beds")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Broadcast Emergency Bed Alert</span>
                      </button>
                      <a
                        href="tel:911"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-secondary text-xs font-bold shadow-sm transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-secondary" />
                        <span>Open County Triage Line (911 Direct)</span>
                      </a>
                    </div>
                  </div>
                </div>

              </div>

              {/* 4-COLUMN TELEMETRY KPI TILES */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Card 1: Reported Bed Telemetry */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                      <BedDouble className="w-4 h-4 text-primary" />
                      <span>Reported Bed Telemetry</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                      {occupancyPercent}% Occ
                    </span>
                  </div>
                  <div className="my-2 space-y-2">
                    {/* General */}
                    <div>
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                          General Beds
                        </span>
                        <span className="font-bold text-on-surface">
                          {generalBed ? generalBed.total_beds - generalBed.available_beds : 0}{" "}
                          <span className="text-outline font-normal">/ {generalBed?.total_beds ?? 0}</span>{" "}
                          <span className="text-tertiary font-bold">({generalBed?.available_beds ?? 0} Avail)</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-tertiary h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${generalBed && generalBed.total_beds > 0 ? Math.round(((generalBed.total_beds - generalBed.available_beds) / generalBed.total_beds) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* ICU */}
                    <div>
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                          ICU Critical Beds
                        </span>
                        <span className="font-bold text-secondary">
                          {icuBed ? icuBed.total_beds - icuBed.available_beds : 0}{" "}
                          <span className="text-outline font-normal">/ {icuBed?.total_beds ?? 0}</span>{" "}
                          <span className="text-secondary font-bold">({icuBed?.available_beds ?? 0} Avail)</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-secondary h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${icuBed && icuBed.total_beds > 0 ? Math.round(((icuBed.total_beds - icuBed.available_beds) / icuBed.total_beds) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* ER Trauma */}
                    <div>
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Emergency ER Slots
                        </span>
                        <span className="font-bold text-on-surface">
                          {erBed ? erBed.total_beds - erBed.available_beds : 0}{" "}
                          <span className="text-outline font-normal">/ {erBed?.total_beds ?? 0}</span>{" "}
                          <span className="text-error font-bold">({erBed?.available_beds ?? 0} Left)</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${erBed && erBed.total_beds > 0 ? Math.round(((erBed.total_beds - erBed.available_beds) / erBed.total_beds) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                    <span>{beds.length > 0 ? `${beds.length} Wards Active` : "No Wards Configured"}</span>
                    <span className="text-primary font-bold">{totalOccupied} Total Inpatients</span>
                  </div>
                </div>


                {/* Card 2: Critical Life Support & Oxygen */}
                {(() => {
                  const o2 = resources.find(r => r.category.toLowerCase().includes("oxygen") || r.resource_name.toLowerCase().includes("oxygen"));
                  const vent = resources.find(r => r.resource_name.toLowerCase().includes("ventilator"));
                  return (
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                          <Activity className="w-4 h-4 text-tertiary" />
                          <span>Life Support & Oxygen</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                          {o2 ? o2.status : "Default (0)"}
                        </span>
                      </div>
                      <div className="my-2 space-y-2">
                        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-on-surface-variant">Medical O2 Supply</div>
                            <div className="text-base font-bold text-tertiary">
                              {o2 ? `${o2.quantity_available} ${o2.unit}` : "0 Units"} <span className="text-xs text-on-surface-variant font-normal">({o2 ? o2.status : "Not Added"})</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-on-surface-variant">Invasive Ventilators</div>
                            <div className="text-base font-bold text-on-surface">
                              {vent ? `${vent.quantity_available} ${vent.unit}` : "0 Units"} <span className="text-xs text-outline font-normal">Available</span>
                            </div>
                          </div>
                          {vent && (
                            <span className="px-2 py-0.5 rounded bg-tertiary-container/15 text-tertiary text-[11px] font-bold">
                              {vent.quantity_available} Standby
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                        <span>Items Tracked: {resources.length}</span>
                        <button onClick={() => setActiveTab("resources")} className="text-primary font-bold hover:underline">
                          + Add Resource
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Card 3: Emergency Dispatch & Transit */}
                {(() => {
                  const currentHosp = allHospitals.find(h => h.id === session?.hospital_id);
                  const readyAmbs = currentHosp?.available_ambulances ?? currentHosp?.ambulance_count ?? 0;
                  const totalAmbs = currentHosp?.ambulance_count ?? 0;
                  return (
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                          <Ambulance className="w-4 h-4 text-primary" />
                          <span>Dispatch & Fleet</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                          {totalAmbs > 0 ? "Fleet Synced" : "0 Units"}
                        </span>
                      </div>
                      <div className="my-2 grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-surface-container-low text-center">
                          <div className="text-lg font-bold text-tertiary">{readyAmbs} / {totalAmbs}</div>
                          <div className="text-[11px] text-on-surface-variant">Ambulances Ready</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container-low text-center">
                          <div className="text-lg font-bold text-primary">{beds.length}</div>
                          <div className="text-[11px] text-on-surface-variant">Configured Wards</div>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                        <span>Hospital Fleet Status</span>
                        <span className="text-primary font-bold">{readyAmbs > 0 ? "Active" : "Idle"}</span>
                      </div>
                    </div>
                  );
                })()}


                {/* Card 4: Active Requests & Transfers */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                      <ArrowRightLeft className="w-4 h-4 text-secondary" />
                      <span>Transfers & Requests</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                      {pendingRequests.length + transfers.length} Live Queue
                    </span>
                  </div>
                  <div className="my-2 space-y-1.5">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-xs">
                      <span className="text-on-surface font-medium">Inbound Citizen Tickets</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[10px]">
                        {pendingRequests.length} New
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-xs">
                      <span className="text-on-surface font-medium">Outbound ICU Evacuation</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[10px]">
                        {transfers.length} Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-error-container/30 text-xs">
                      <span className="text-error font-medium">Emergency Triage Pending</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-white font-bold text-[10px]">
                        {pendingRequests.length} Urgent
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                    <span>Priority Route 1 Active</span>
                    <button onClick={() => setActiveTab("requests")} className="text-primary font-bold hover:underline">
                      Open Triage Hub
                    </button>
                  </div>
                </div>

              </div>

              {/* ===================== 12-COLUMN MAIN WORKSPACE ===================== */}
              <div className="px-8 pb-12 grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* LEFT 8-COLS: INTERACTIVE BED MESH SYNC & TRANSFER PIPELINE */}
                <div className="xl:col-span-8 space-y-6">
                  {/* Interactive Bed Telemetry Quick-Update Panel */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-primary" />
                          <h2 className="text-lg font-bold text-on-surface">Interactive Bed Telemetry Synchronizer</h2>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Live counter adjustments sync in real-time across city dispatchers, emergency services, and ambulance terminals.
                        </p>
                      </div>
                      <span className="text-[11px] text-tertiary bg-tertiary-fixed/60 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span> Auto-Sync: Active
                      </span>
                    </div>

                    {/* Bed Quick-Toggle Cards Grid (Dynamic from Staff Configuration) */}
                    {beds.length === 0 ? (
                      <div className="p-8 rounded-xl bg-surface-container-low border border-dashed border-outline-variant text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <BedDouble className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-on-surface">No Bed Categories Configured Yet</div>
                          <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                            Your facility has 0 active bed wards. Click below to add your first bed category (e.g. ICU, General Ward, Emergency Trauma, Pediatric) and specify your exact capacity.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddBedModal(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Bed Category</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {beds.map((b) => (
                          <div key={b.id} className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/30">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-on-surface">{b.category}</span>
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                b.category.toUpperCase().includes("ICU") ? "bg-secondary animate-pulse" :
                                b.category.toUpperCase().includes("ER") || b.category.toUpperCase().includes("EMERGENCY") ? "bg-error animate-ping" : "bg-tertiary"
                              }`}></span>
                            </div>
                            <div className="py-4 flex items-center justify-between">
                              <div>
                                <div className="text-[11px] text-on-surface-variant font-medium">Available Slots</div>
                                <div className={`text-3xl font-extrabold ${b.available_beds > 0 ? "text-primary" : "text-secondary"}`}>
                                  {String(b.available_beds).padStart(2, "0")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] text-on-surface-variant font-medium">Total Capacity</div>
                                <div className="text-xl font-bold text-on-surface">{b.total_beds}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleBedDelta(b.id, -1)}
                                className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-sm flex items-center justify-center transition-colors shadow-sm"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBedDelta(b.id, 1)}
                                className="flex-1 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-sm flex items-center justify-center transition-colors shadow-sm"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-surface-container-high/40 p-3 rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <Radio className="w-4 h-4 text-primary" />
                        <span>All updates broadcast cryptographically to state health mesh via HL7 / FHIR connector.</span>
                      </div>
                      <span className="text-[11px] text-on-surface font-mono font-bold">Sync Hash: #9A24-F6B</span>
                    </div>
                  </div>

                  {/* Recent Inbound & Outbound Emergency Transfer Queue */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Ambulance className="w-5 h-5 text-primary" />
                          <h2 className="text-lg font-bold text-on-surface">Emergency Transfer & Triage Pipeline</h2>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Live admissions, inbound sirens, and cross-facility transport permits requiring immediate authorization.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Queue:</span>
                        <button
                          type="button"
                          onClick={() => setQueueFilter("ALL")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            queueFilter === "ALL"
                              ? "bg-primary text-white"
                              : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          All ({requests.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueFilter("ACTIVE")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            queueFilter === "ACTIVE"
                              ? "bg-secondary text-white"
                              : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          Active ({activeRequests.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueFilter("CRITICAL")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            queueFilter === "CRITICAL"
                              ? "bg-error text-white"
                              : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          Critical ({criticalRequests.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueFilter("COMPLETED")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            queueFilter === "COMPLETED"
                              ? "bg-emerald-600 text-white"
                              : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          Care Completed ({completedRequests.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueFilter("DIVERTED")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            queueFilter === "DIVERTED"
                              ? "bg-red-600 text-white"
                              : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          Rerouted / Diverted ({divertedRequests.length})
                        </button>
                      </div>
                    </div>

                    {/* High-Density Transfer Table */}
                    <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Priority / Case</th>
                            <th className="py-3 px-4">Patient & Condition</th>
                            <th className="py-3 px-4">Emergency Category</th>
                            <th className="py-3 px-4">ETA & Contact</th>
                            <th className="py-3 px-4 text-right">Operational Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                          {filteredRequests.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-on-surface-variant text-xs">
                                No triage requests in queue. Ready for incoming ambulance dispatches.
                              </td>
                            </tr>
                          ) : (
                            filteredRequests.slice(0, 5).map((req) => (
                              <tr key={req.id} className="hover:bg-surface-container-low/60 transition-colors">
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                        req.severity === "CRITICAL"
                                          ? "bg-error-container text-on-error-container"
                                          : req.severity === "URGENT"
                                          ? "bg-secondary-fixed text-on-secondary-fixed"
                                          : "bg-primary-fixed text-on-primary-fixed"
                                      }`}
                                    >
                                      {req.severity === "CRITICAL" && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                                      )}
                                      {req.severity}
                                    </span>
                                    <span className="font-mono text-xs text-outline font-bold">#{req.ticket_code}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-sm text-on-surface">
                                    {req.patient_name} ({req.patient_age} {req.patient_gender.charAt(0)})
                                  </div>
                                  <div className="text-xs text-secondary font-medium">
                                    {req.notes || "Emergency admission requested via citizen portal"}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-on-surface font-semibold">{req.emergency_type}</div>
                                  <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-1">
                                    {renderRequestStatusBadge(req.status)}
                                  </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="text-error font-bold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    ETA {req.eta_minutes ?? 15} mins
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant font-mono">{req.contact_phone}</div>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    {req.status === "PENDING" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openTriageModal(req)}
                                          className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-bold shadow-sm transition-all"
                                        >
                                          Review & Allocate
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDivertRequest(req.id)}
                                          className="px-2.5 py-1.5 rounded-lg border border-error/50 text-error hover:bg-error-container hover:text-on-error-container text-xs font-bold transition-all"
                                          title="Reroute / Divert to another facility"
                                        >
                                          Divert
                                        </button>
                                      </>
                                    )}
                                    {req.status === "BED_ALLOCATED" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleAdmitRequest(req.id)}
                                          className="px-3 py-1.5 rounded-lg bg-tertiary hover:bg-tertiary-container text-white text-xs font-bold shadow-sm transition-all"
                                        >
                                          Admit to Bay
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDivertRequest(req.id)}
                                          className="px-2.5 py-1.5 rounded-lg border border-error/50 text-error hover:bg-error-container hover:text-on-error-container text-xs font-bold transition-all"
                                          title="Reroute / Divert to another facility"
                                        >
                                          Divert
                                        </button>
                                      </>
                                    )}
                                    {req.status === "ADMITTED" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleCompleteRequest(req.id)}
                                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1"
                                          title="Mark care completed and discharge"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Care Completed
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDivertRequest(req.id)}
                                          className="px-2.5 py-1.5 rounded-lg border border-error/50 text-error hover:bg-error-container hover:text-on-error-container text-xs font-bold transition-all"
                                          title="Reroute / Divert to another facility"
                                        >
                                          Divert
                                        </button>
                                      </>
                                    )}
                                    {(req.status === "COMPLETED" || req.status === "DISCHARGED") && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300/40">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        Care Completed
                                      </span>
                                    )}
                                    {(req.status === "DIVERTED" || req.status === "REJECTED" || req.status === "CANCELLED") && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-bold border border-error/30">
                                        <XCircle className="w-3 h-3 text-error" />
                                        Rerouted / Diverted
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bed Occupancy by Ward Analytics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <h3 className="font-bold text-sm text-on-surface">Bed Occupancy By Ward</h3>
                        </div>
                        <span className="text-[11px] text-outline font-medium">Live 24h</span>
                      </div>
                      <div className="space-y-2 pt-1 text-xs">
                        <div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-on-surface font-medium">Trauma Intensive Care (TICU)</span>
                            <span className="font-bold text-secondary">96% (Critical)</span>
                          </div>
                          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                            <div className="bg-secondary h-1.5 rounded-full" style={{ width: "96%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-on-surface font-medium">Cardiothoracic Ward (CTW)</span>
                            <span className="font-bold text-primary">82%</span>
                          </div>
                          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: "82%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-on-surface font-medium">Pediatric Care (PICU)</span>
                            <span className="font-bold text-tertiary">64% (Adequate)</span>
                          </div>
                          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                            <div className="bg-tertiary h-1.5 rounded-full" style={{ width: "64%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Regional Mesh Connectivity */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-tertiary" />
                            <h3 className="font-bold text-sm text-on-surface">Metro Triage Mesh Grid</h3>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                            5 Nodes Synced
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          Neighboring facility telemetry feeds synced for mutual emergency diversion.
                        </p>
                        <div className="space-y-1.5 mt-2.5 text-xs">
                          <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                            <span className="text-on-surface font-medium">Metro General (4.2 km)</span>
                            <span className="text-secondary font-bold text-[11px]">ICU Full (Diverting)</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                            <span className="text-on-surface font-medium">St. Jude Trauma (6.8 km)</span>
                            <span className="text-tertiary font-bold text-[11px]">8 ICU Beds Open</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-outline border-t border-outline-variant/20">
                        <span>Latency: 42ms (Fiber Ring)</span>
                        <span className="text-primary font-bold hover:underline cursor-pointer">View Network Topology</span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* RIGHT 4-COLS: REAL-TIME AUDIT FEED & IMMEDIATE HOTLINES */}
                <div className="xl:col-span-4 space-y-6">
                  {/* Real-time Activity Feed Timeline */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-on-surface">Real-Time Audit Feed</h2>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" title="Connected"></span>
                    </div>

                    <div className="relative border-l-2 border-surface-container ml-3 space-y-4">
                      {/* Item 1 */}
                      <div className="relative pl-4">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-secondary text-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-secondary">Trauma Alert Active</span>
                          <span className="text-outline font-mono text-[10px]">1m ago</span>
                        </div>
                        <p className="text-xs text-on-surface mt-0.5">
                          Trauma Bay 1 occupied by incoming AMI patient. Emergency team notified.
                        </p>
                      </div>

                      {/* Item 2 */}
                      <div className="relative pl-4">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-primary">Bed Telemetry Sync</span>
                          <span className="text-outline font-mono text-[10px]">4m ago</span>
                        </div>
                        <p className="text-xs text-on-surface mt-0.5">
                          General ward census confirmed. Live beds capacity auto-broadcasted to mesh.
                        </p>
                      </div>

                      {/* Item 3 */}
                      <div className="relative pl-4">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-tertiary text-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-tertiary">Mesh Heartbeat Pulse</span>
                          <span className="text-outline font-mono text-[10px]">8m ago</span>
                        </div>
                        <p className="text-xs text-on-surface mt-0.5">
                          State dispatch handshake verified. Zero checksum discrepancies detected.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("requests")}
                      className="w-full py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary text-xs font-bold transition-colors text-center"
                    >
                      View Complete Operational Queue
                    </button>
                  </div>

                  {/* Real-time Critical Resource Telemetry Card */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-base text-on-surface">Critical Resource Stock</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab("resources")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Manage
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {resources.slice(0, 4).map((r) => (
                        <div key={r.id} className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
                          <div>
                            <div className="font-bold text-on-surface">{r.resource_name}</div>
                            <div className="text-[11px] text-on-surface-variant">{r.category}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-primary">
                              {r.quantity_available} <span className="text-[10px] text-outline">{r.unit}</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === "CRITICAL"
                                  ? "bg-error-container text-on-error-container"
                                  : r.status === "LOW"
                                  ? "bg-secondary-fixed text-on-secondary-fixed"
                                  : "bg-tertiary-fixed text-on-tertiary-fixed"
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rapid Medical Direct Lines */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-primary-container to-primary text-white shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Rapid Medical Direct Lines</span>
                      <PhoneCall className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-on-primary-container">
                      Immediate priority intercom channels to clinical department leads:
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href="tel:911"
                        className="p-2 rounded bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-xs text-left flex items-center gap-1.5 transition-colors font-medium"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        ICU Charge Nurse
                      </a>
                      <a
                        href="tel:911"
                        className="p-2 rounded bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-xs text-left flex items-center gap-1.5 transition-colors font-medium"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Blood Bank Core
                      </a>
                      <a
                        href="tel:911"
                        className="p-2 rounded bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-xs text-left flex items-center gap-1.5 transition-colors font-medium"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Anesthesia On-Duty
                      </a>
                      <a
                        href="tel:911"
                        className="p-2 rounded bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-xs text-left flex items-center gap-1.5 transition-colors font-medium"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        County Dispatch
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ===================== VIEW 1: BED MANAGEMENT ===================== */}
          {activeTab === "beds" && (
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
                <div>
                  <h1 className="text-2xl font-bold text-on-surface">Bed Capacity & Ward Management</h1>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Configure wards, emergency slots, and real-time available capacity published to citizen apps.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddBedModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Bed Category</span>
                </button>
              </div>

              {/* Beds Table */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Ward / Bed Category</th>
                      <th className="py-3.5 px-4">Total Capacity</th>
                      <th className="py-3.5 px-4">Available Slots</th>
                      <th className="py-3.5 px-4">Occupied Slots</th>
                      <th className="py-3.5 px-4">Daily Tariff</th>
                      <th className="py-3.5 px-4">Quick Adjust</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {beds.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                          <BedDouble className="w-8 h-8 text-outline mx-auto mb-2 opacity-50" />
                          <div className="font-bold text-sm text-on-surface">No Bed Categories Found</div>
                          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-3">
                            You have not configured any bed wards yet. Click &quot;Add Bed Category&quot; to manually add your ICU, General Ward, or Emergency beds.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddBedModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Bed Category</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      beds.map((b) => (
                      <tr key={b.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-sm text-on-surface">
                          {b.category}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface">{b.total_beds}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-sm text-primary">{b.available_beds}</span>
                        </td>
                        <td className="py-3.5 px-4 text-outline">{b.total_beds - b.available_beds}</td>
                        <td className="py-3.5 px-4 font-medium">₹{b.price_per_day}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleBedDelta(b.id, -1)}
                              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface font-bold text-xs"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBedDelta(b.id, 1)}
                              className="w-7 h-7 rounded bg-primary hover:bg-primary-container text-white flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteBed(b.id, b.category)}
                            className="p-1.5 rounded hover:bg-error-container text-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== VIEW 2: RESOURCE MANAGEMENT ===================== */}
          {activeTab === "resources" && (
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
                <div>
                  <h1 className="text-2xl font-bold text-on-surface">Critical Resource & Inventory Telemetry</h1>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Maintain live stocks of oxygen, blood units, ventilators, and emergency medication.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Resource</span>
                </button>
              </div>

              {/* Resource Table */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Resource Item</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Available Qty</th>
                      <th className="py-3.5 px-4">Status Classification</th>
                      <th className="py-3.5 px-4">Adjust Stock</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {resources.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                          <Activity className="w-8 h-8 text-outline mx-auto mb-2 opacity-50" />
                          <div className="font-bold text-sm text-on-surface">No Resource Inventory Items</div>
                          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-3">
                            No critical equipment or supplies recorded yet. Click &quot;Add Resource Item&quot; to log your oxygen cylinders, ventilators, or blood units.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddResourceModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Resource Item</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      resources.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-sm text-on-surface">
                          {r.resource_name}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">{r.category}</td>
                        <td className="py-3.5 px-4 font-bold text-sm text-primary">
                          {r.quantity_available} <span className="text-xs font-normal text-outline">{r.unit}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === "CRITICAL"
                                ? "bg-error-container text-on-error-container"
                                : r.status === "LOW"
                                ? "bg-secondary-fixed text-on-secondary-fixed"
                                : "bg-tertiary-fixed text-on-tertiary-fixed"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleResourceDelta(r.id, -1)}
                              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface font-bold text-xs"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResourceDelta(r.id, 1)}
                              className="w-7 h-7 rounded bg-primary hover:bg-primary-container text-white flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(r.id, r.resource_name)}
                            className="p-1.5 rounded hover:bg-error-container text-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== VIEW 3: REQUESTS & TRANSFERS ===================== */}
          {activeTab === "requests" && (
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
                <div>
                  <h1 className="text-2xl font-bold text-on-surface">Emergency Requests & Inter-Hospital Transfers</h1>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Review inbound citizen emergency tickets and coordinate cross-facility ambulance patient routing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-bold shadow-sm transition-all"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Initiate Outbound Transfer</span>
                </button>
              </div>

              {/* Inbound Citizen Emergency Requests */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 space-y-4">
                <h3 className="font-bold text-base text-on-surface">Inbound Citizen Emergency Admission Tickets</h3>
                <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Ticket Code</th>
                        <th className="py-3 px-4">Patient Name & Age</th>
                        <th className="py-3 px-4">Emergency Type</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {requests.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-primary">#{r.ticket_code}</td>
                          <td className="py-3 px-4 font-bold text-on-surface">
                            {r.patient_name} ({r.patient_age} {r.patient_gender})
                          </td>
                          <td className="py-3 px-4">{r.emergency_type}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.severity === "CRITICAL"
                                  ? "bg-error-container text-on-error-container"
                                  : "bg-primary-fixed text-on-primary-fixed"
                              }`}
                            >
                              {r.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-primary">
                            {renderRequestStatusBadge(r.status)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {r.status === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openTriageModal(r)}
                                    className="px-3 py-1 rounded bg-secondary hover:bg-secondary-container text-white font-bold text-xs"
                                  >
                                    Allocate Bed
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDivertRequest(r.id)}
                                    className="px-2 py-1 rounded border border-error/50 text-error hover:bg-error-container hover:text-on-error-container font-bold text-xs"
                                  >
                                    Divert
                                  </button>
                                </>
                              )}
                              {r.status === "BED_ALLOCATED" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAdmitRequest(r.id)}
                                    className="px-3 py-1 rounded bg-tertiary hover:bg-tertiary-container text-white font-bold text-xs"
                                  >
                                    Mark Admitted
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDivertRequest(r.id)}
                                    className="px-2 py-1 rounded border border-error/50 text-error hover:bg-error-container hover:text-on-error-container font-bold text-xs"
                                  >
                                    Divert
                                  </button>
                                </>
                              )}
                              {r.status === "ADMITTED" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteRequest(r.id)}
                                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1"
                                    title="Mark care completed"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Care Completed
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDivertRequest(r.id)}
                                    className="px-2 py-1 rounded border border-error/50 text-error hover:bg-error-container hover:text-on-error-container font-bold text-xs"
                                  >
                                    Divert
                                  </button>
                                </>
                              )}
                              {(r.status === "COMPLETED" || r.status === "DISCHARGED") && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300/40">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Care Completed
                                </span>
                              )}
                              {(r.status === "DIVERTED" || r.status === "REJECTED" || r.status === "CANCELLED") && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-bold border border-error/30">
                                  <XCircle className="w-3 h-3 text-error" />
                                  Rerouted / Diverted
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inter-Hospital Transfers List */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 space-y-4">
                <h3 className="font-bold text-base text-on-surface">Inter-Hospital Evacuations & Transfers</h3>
                <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Transfer ID</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Origin / Receiving Facility</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {transfers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-on-surface-variant text-xs">
                            No active inter-hospital transfers logged.
                          </td>
                        </tr>
                      ) : (
                        transfers.map((t) => (
                          <tr key={t.id} className="hover:bg-surface-container-low/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-primary">#TRF-{t.id}</td>
                            <td className="py-3 px-4 font-bold text-on-surface">{t.patient_name}</td>
                            <td className="py-3 px-4">{t.target_hospital_name || `Hospital #${t.target_hospital_id}`}</td>
                            <td className="py-3 px-4 font-bold text-secondary">{t.priority}</td>
                            <td className="py-3 px-4 font-bold text-tertiary">{t.transfer_status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 4: HOSPITAL PROFILE ===================== */}
          {activeTab === "profile" && (
            <div className="p-8 space-y-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-on-surface">Hospital Operational Node Profile</h1>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Official state health accreditation records, emergency lines, and GPS coordinates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wider">Facility Name</label>
                      <div className="text-base font-bold text-on-surface mt-1">
                        {session?.hospital_name || "Apollo Super Specialty Hospital"}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wider">License Number</label>
                      <div className="text-sm font-mono font-bold text-primary mt-1">
                        MH-MED-REG-2026-9812
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wider">Accreditation Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs">
                          NABH Level-1 Certified
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">Valid through 2029</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wider">Emergency Hotline</label>
                      <div className="text-base font-bold text-error mt-1">+91-98765-43210</div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wider">Physical Coordinates</label>
                      <div className="text-sm text-on-surface font-mono mt-1">
                        Lat: 18.5204° N, Long: 73.8567° E (Pune Metro Corridor)
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wider">Regulatory Compliance</label>
                      <div className="text-xs text-on-surface-variant mt-1">
                        Audited by State Health Directorate. All fire safety NOCs and oxygen reserves inspected.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ===================== VIEW 5: PRICING & SERVICES ===================== */}
          {activeTab === "pricing" && (
            <PricingManagementTab session={session} />
          )}

          {/* ===================== VIEW 6: PATIENT BILLING & PAYMENTS ===================== */}
          {activeTab === "billing" && (
            <BillingManagementTab
              session={session}
              allRequests={requests}
              onRefreshRequests={() => loadAllData(session?.hospital_id || undefined)}
            />
          )}

          {/* ===================== VIEW 7: BLOOD BANK & DONORS ===================== */}
          {activeTab === "blood" && (
            <BloodManagementTab
              hospitalId={session?.hospital_id || 1}
              hospitalName={session?.hospital_name || "Hospital"}
            />
          )}

          {/* ===================== VIEW 8: REFERRALS & RESOURCE BOOKING ===================== */}
          {activeTab === "referrals" && (
            <ReferralBookingTab session={session} />
          )}
        </main>
      </div>

      {/* ===================== MODAL: TRIAGE & ALLOCATE BED ===================== */}
      {triageRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">Allocate Bed Bay</h3>
              </div>
              <button onClick={() => setTriageRequest(null)} className="p-1 rounded hover:bg-surface-container">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
                <div className="font-bold text-sm text-on-surface">
                  {triageRequest.patient_name} ({triageRequest.patient_age} {triageRequest.patient_gender})
                </div>
                <div className="text-secondary font-semibold">
                  {triageRequest.emergency_type} • {triageRequest.severity}
                </div>
                <div className="text-on-surface-variant font-mono">Contact: {triageRequest.contact_phone}</div>
              </div>

              <div>
                <label className="font-bold text-xs text-on-surface">Select Ward / Bed Category</label>
                <select
                  value={selectedBedCategory}
                  onChange={(e) => setSelectedBedCategory(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-xs text-on-surface font-semibold"
                >
                  {beds.map((b) => (
                    <option key={b.id} value={b.category}>
                      {b.category} ({b.available_beds} beds available)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setTriageRequest(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriageSubmit}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm"
              >
                Confirm Allocation & Alert ER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD BED CATEGORY ===================== */}
      {showAddBedModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddBed}
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">Add Bed Category & Ward</h3>
                  <p className="text-[11px] text-on-surface-variant">Select standard clinical bed types or create a custom ward</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddBedModal(false)} className="p-1 rounded-lg hover:bg-surface-container">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Preset Selector Dropdown */}
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Choose Standard Bed Type Preset <span className="text-primary font-normal">(Auto-fills category & tariff)</span>
                </label>
                <select
                  value={ALL_BED_PRESETS.some((p) => p.label === addBedForm.category) ? addBedForm.category : ""}
                  onChange={(e) => {
                    const found = ALL_BED_PRESETS.find((p) => p.label === e.target.value);
                    if (found) {
                      setAddBedForm({
                        ...addBedForm,
                        category: found.label,
                        price_per_day: found.price
                      });
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface text-on-surface focus:outline-none focus:border-primary font-medium"
                >
                  <option value="">-- Or pick from all standard hospital bed types --</option>
                  <optgroup label="Critical Care (ICU / HDU / PICU / NICU)">
                    {ALL_BED_PRESETS.filter((p) => p.group === "Critical Care").map((p) => (
                      <option key={p.label} value={p.label}>
                        {p.label} — ₹{p.price.toLocaleString("en-IN")}/day
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="General & In-Patient Wards">
                    {ALL_BED_PRESETS.filter((p) => p.group === "General Wards").map((p) => (
                      <option key={p.label} value={p.label}>
                        {p.label} — ₹{p.price.toLocaleString("en-IN")}/day
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Emergency & Specialized Units">
                    {ALL_BED_PRESETS.filter((p) => p.group === "Emergency & Specialty").map((p) => (
                      <option key={p.label} value={p.label}>
                        {p.label} — ₹{p.price.toLocaleString("en-IN")}/day
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1.5">
                  Popular Bed Quick-Select:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: "ICU Bed", full: "ICU (Intensive Care Unit) Bed", price: 5000 },
                    { name: "HDU Bed", full: "HDU (High Dependency Unit) Bed", price: 3500 },
                    { name: "NICU Bed", full: "NICU (Neonatal Intensive Care) Bed", price: 5000 },
                    { name: "General Ward", full: "General Ward Bed (Common / Mixed)", price: 1000 },
                    { name: "Oxygen Ward", full: "Oxygen Supported Ward Bed", price: 1800 },
                    { name: "Semi-Private", full: "Semi-Private Room (Twin Sharing) Bed", price: 2200 },
                    { name: "Deluxe Single", full: "Private Single Deluxe Room Bed", price: 3800 },
                    { name: "Trauma Bay", full: "Emergency / Trauma Bay Bed", price: 1500 },
                    { name: "Isolation", full: "Isolation Ward Bed (Infectious Diseases)", price: 2800 },
                  ].map((chip) => (
                    <button
                      key={chip.name}
                      type="button"
                      onClick={() => setAddBedForm({
                        ...addBedForm,
                        category: chip.full,
                        price_per_day: chip.price
                      })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        addBedForm.category === chip.full
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-surface hover:bg-surface-container border-outline-variant/40 text-on-surface"
                      }`}
                    >
                      {chip.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Category Name input */}
              <div>
                <label className="font-bold text-on-surface">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. ICU (Intensive Care Unit) Bed or Custom Ward"
                  value={addBedForm.category}
                  onChange={(e) => setAddBedForm({ ...addBedForm, category: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface text-on-surface focus:outline-none focus:border-primary font-medium"
                  required
                />
              </div>

              {/* Total & Available Beds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-on-surface">Total Beds *</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setAddBedForm({ ...addBedForm, total_beds: Math.max(1, addBedForm.total_beds + 5) })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-primary font-bold"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddBedForm({ ...addBedForm, total_beds: Math.max(1, addBedForm.total_beds + 10) })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-primary font-bold"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={addBedForm.total_beds}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setAddBedForm({
                        ...addBedForm,
                        total_beds: val,
                        available_beds: Math.min(addBedForm.available_beds, val)
                      });
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface">Available Free Beds *</label>
                  <input
                    type="number"
                    min="0"
                    max={addBedForm.total_beds}
                    value={addBedForm.available_beds}
                    onChange={(e) => setAddBedForm({ ...addBedForm, available_beds: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Daily Tariff */}
              <div>
                <label className="font-bold text-on-surface">Daily Tariff Rate (₹ per day)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={addBedForm.price_per_day}
                    onChange={(e) => setAddBedForm({ ...addBedForm, price_per_day: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-semibold"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Published daily tariff helps patients and referral networks calculate estimates transparently.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setShowAddBedModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all"
              >
                Create Bed Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL: ADD RESOURCE ===================== */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddResource}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <h3 className="font-bold text-lg text-on-surface">Add Critical Resource</h3>
              <button type="button" onClick={() => setShowAddResourceModal(false)} className="p-1 rounded hover:bg-surface-container">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface">Resource Name</label>
                <input
                  type="text"
                  placeholder="e.g. Invasive Ventilators, Blood Unit O+"
                  value={addResourceForm.resource_name}
                  onChange={(e) => setAddResourceForm({ ...addResourceForm, resource_name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-on-surface">Category</label>
                <select
                  value={addResourceForm.category}
                  onChange={(e) => setAddResourceForm({ ...addResourceForm, category: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                >
                  <option value="Oxygen">Oxygen</option>
                  <option value="Critical Equipment">Critical Equipment</option>
                  <option value="Blood Bank">Blood Bank</option>
                  <option value="Staff">Specialist Staff</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface">Quantity Available</label>
                  <input
                    type="number"
                    value={addResourceForm.quantity_available}
                    onChange={(e) => setAddResourceForm({ ...addResourceForm, quantity_available: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface">Unit</label>
                  <input
                    type="text"
                    value={addResourceForm.unit}
                    onChange={(e) => setAddResourceForm({ ...addResourceForm, unit: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setShowAddResourceModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm"
              >
                Save Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL: INITIATE OUTBOUND TRANSFER ===================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTransfer}
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-secondary" />
                <h3 className="font-bold text-lg text-on-surface">Initiate Outbound Patient Transfer</h3>
              </div>
              <button type="button" onClick={() => setShowTransferModal(false)} className="p-1 rounded hover:bg-surface-container">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface">Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Karthik Narayanan"
                  value={transferForm.patient_name}
                  onChange={(e) => setTransferForm({ ...transferForm, patient_name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-on-surface">Destination Hospital</label>
                <select
                  value={transferForm.target_hospital_id}
                  onChange={(e) => setTransferForm({ ...transferForm, target_hospital_id: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                  required
                >
                  <option value={0}>-- Select Receiving Hospital --</option>
                  {allHospitals
                    .filter((h) => h.id !== session?.hospital_id)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.city})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface">Priority</label>
                  <select
                    value={transferForm.priority}
                    onChange={(e) => setTransferForm({ ...transferForm, priority: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                  >
                    <option value="P1 - Immediate (Within 30m)">P1 - Immediate (Within 30m)</option>
                    <option value="P2 - Urgent (Within 2h)">P2 - Urgent (Within 2h)</option>
                    <option value="P3 - Routine Transfer">P3 - Routine Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-on-surface">Required Service / Bed</label>
                  <input
                    type="text"
                    placeholder="e.g. ECMO, Cardiac ICU"
                    value={transferForm.required_service}
                    onChange={(e) => setTransferForm({ ...transferForm, required_service: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface">Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Patient clinical reason for cross-facility transfer..."
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-lg border border-outline-variant/50 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-white text-xs font-bold shadow-sm"
              >
                Dispatch Transfer Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
