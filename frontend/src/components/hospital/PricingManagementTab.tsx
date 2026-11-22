"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  History,
  Edit,
  X,
  IndianRupee,
  RefreshCw,
  Archive,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Sparkles
} from "lucide-react";
import {
  getPricingMetrics,
  getHospitalServices,
  createHospitalService,
  updateHospitalService,
  updateHospitalServicePrice,
  publishHospitalServicePrice,
  deactivateHospitalServicePrice,
  getHospitalPriceHistory,
  getHospitalRatePreview,
  subscribeToDataChanges,
  HospitalService,
  PriceHistory,
  PricingDashboardMetrics,
  PublicServicePriceItem,
  UserSession
} from "@/lib/api";

const CATEGORIES = [
  "Room and Bed Charges",
  "Emergency Services",
  "Ambulance Services",
  "Laboratory Services",
  "Diagnostic Services",
  "Other Services",
];

const BILLING_UNITS = [
  "per day",
  "per visit",
  "per trip",
  "per test",
  "per scan",
  "per procedure",
  "per hour"
];

const STANDARD_SERVICE_PRESETS = [
  { name: "ICU (Intensive Care) Day Charge", category: "Room and Bed Charges", billing_unit: "per day", price: 5000, code: "ICU-DAY-01", description: "Comprehensive multipara monitoring, intensivist supervision and central oxygen" },
  { name: "HDU (High Dependency) Day Charge", category: "Room and Bed Charges", billing_unit: "per day", price: 3500, code: "HDU-DAY-01", description: "Step-down critical care monitoring" },
  { name: "General Ward Bed Charge", category: "Room and Bed Charges", billing_unit: "per day", price: 1000, code: "GEN-WARD-01", description: "General in-patient ward accommodation including nursing service" },
  { name: "Semi-Private Room (Twin Sharing)", category: "Room and Bed Charges", billing_unit: "per day", price: 2200, code: "SEMI-PVT-01", description: "Twin sharing room with attendant facility" },
  { name: "Private Single Deluxe Room", category: "Room and Bed Charges", billing_unit: "per day", price: 3800, code: "PVT-DLX-01", description: "Single private room with air conditioning and TV" },
  { name: "Emergency Triage & Resuscitation", category: "Emergency Services", billing_unit: "per visit", price: 1500, code: "EMG-TRIAGE-01", description: "Urgent ER trauma bay evaluation and initial stabilization" },
  { name: "Senior Doctor Consultation (In-Patient)", category: "Emergency Services", billing_unit: "per visit", price: 800, code: "DOC-VISIT-01", description: "Specialist medical officer bedside review" },
  { name: "Advanced Life Support (ALS) Ambulance", category: "Ambulance Services", billing_unit: "per trip", price: 2500, code: "AMB-ALS-01", description: "Equipped with transport ventilator, monitor and paramedic" },
  { name: "Basic Life Support (BLS) Ambulance", category: "Ambulance Services", billing_unit: "per trip", price: 1500, code: "AMB-BLS-01", description: "Standard emergency transport with basic life support" },
  { name: "Complete Blood Count (CBC) with ESR", category: "Laboratory Services", billing_unit: "per test", price: 350, code: "LAB-CBC-01", description: "Full automated 5-part hematology profile" },
  { name: "Liver Function Test (LFT)", category: "Laboratory Services", billing_unit: "per test", price: 750, code: "LAB-LFT-01", description: "Bilirubin, SGOT, SGPT, Alkaline Phosphatase" },
  { name: "Kidney Function Test (KFT)", category: "Laboratory Services", billing_unit: "per test", price: 700, code: "LAB-KFT-01", description: "Blood Urea Nitrogen (BUN), Serum Creatinine, Electrolytes" },
  { name: "Digital Chest X-Ray (PA View)", category: "Diagnostic Services", billing_unit: "per scan", price: 750, code: "RAD-XRAY-01", description: "High resolution digital radiography of chest" },
  { name: "CT Scan (Brain / Head Plain)", category: "Diagnostic Services", billing_unit: "per scan", price: 4500, code: "RAD-CT-01", description: "128-slice rapid computed tomography" },
  { name: "MRI Scan (Brain / Spine)", category: "Diagnostic Services", billing_unit: "per scan", price: 6500, code: "RAD-MRI-01", description: "1.5 Tesla magnetic resonance imaging" },
  { name: "Ultrasonography (USG Whole Abdomen)", category: "Diagnostic Services", billing_unit: "per scan", price: 1200, code: "RAD-USG-01", description: "Diagnostic ultrasound with colour doppler evaluation" },
  { name: "Central Pipeline Oxygen Supply", category: "Other Services", billing_unit: "per hour", price: 150, code: "MED-O2-01", description: "High-flow medical oxygen via nasal cannula or mask" },
];

interface Props {
  session: UserSession | null;
}

export default function PricingManagementTab({ session }: Props) {
  const [metrics, setMetrics] = useState<PricingDashboardMetrics | null>(null);
  const [services, setServices] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingService, setEditingService] = useState<HospitalService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: CATEGORIES[0],
    customCategory: "",
    service_code: "",
    billing_unit: BILLING_UNITS[0],
    description: "",
    price: 0,
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
    change_reason: ""
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<PriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyServiceName, setHistoryServiceName] = useState("");

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItems, setPreviewItems] = useState<PublicServicePriceItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Confirmation dialogs
  const [confirmPublishService, setConfirmPublishService] = useState<HospitalService | null>(null);
  const [confirmDeactivateService, setConfirmDeactivateService] = useState<HospitalService | null>(null);

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [categoryFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, servicesData] = await Promise.all([
        getPricingMetrics(),
        getHospitalServices({
          category: categoryFilter !== "ALL" ? categoryFilter : undefined,
          status_filter: statusFilter !== "ALL" ? statusFilter : undefined,
          search: search.trim() ? search.trim() : undefined,
        })
      ]);
      setMetrics(metricsData);
      setServices(servicesData);
    } catch (err) {
      console.error("Error loading pricing data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingService(null);
    setServiceForm({
      name: "",
      category: CATEGORIES[0],
      customCategory: "",
      service_code: "",
      billing_unit: BILLING_UNITS[0],
      description: "",
      price: 1500,
      status: "DRAFT",
      change_reason: ""
    });
    setShowAddEditModal(true);
  };

  const openEditModal = (service: HospitalService) => {
    setEditingService(service);
    const isCustomCat = !CATEGORIES.includes(service.category);
    setServiceForm({
      name: service.name,
      category: isCustomCat ? "Other Services" : service.category,
      customCategory: isCustomCat ? service.category : "",
      service_code: service.service_code || "",
      billing_unit: service.billing_unit,
      description: service.description || "",
      price: service.current_price?.price || 0,
      status: (service.current_price?.status as any) || "DRAFT",
      change_reason: ""
    });
    setShowAddEditModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      alert("Please enter a service name.");
      return;
    }

    const resolvedCategory = serviceForm.customCategory.trim()
      ? serviceForm.customCategory.trim()
      : serviceForm.category;

    try {
      if (editingService) {
        // Update service metadata
        await updateHospitalService(editingService.id, {
          name: serviceForm.name,
          category: resolvedCategory,
          service_code: serviceForm.service_code || undefined,
          billing_unit: serviceForm.billing_unit,
          description: serviceForm.description || undefined
        });

        // Update price with change tracking
        if (
          editingService.current_price?.price !== serviceForm.price ||
          editingService.current_price?.status !== serviceForm.status
        ) {
          await updateHospitalServicePrice(editingService.id, {
            price: Number(serviceForm.price),
            status: serviceForm.status,
            change_reason: serviceForm.change_reason || "Price adjusted by hospital admin"
          });
        }
      } else {
        // Create new service
        await createHospitalService({
          name: serviceForm.name,
          category: resolvedCategory,
          service_code: serviceForm.service_code || undefined,
          billing_unit: serviceForm.billing_unit,
          description: serviceForm.description || undefined,
          initial_price: Number(serviceForm.price),
          status: serviceForm.status
        });
      }

      setShowAddEditModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save service price.");
    }
  };

  const handlePublishConfirm = async () => {
    if (!confirmPublishService) return;
    try {
      await publishHospitalServicePrice(confirmPublishService.id);
      setConfirmPublishService(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to publish service price.");
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!confirmDeactivateService) return;
    try {
      await deactivateHospitalServicePrice(confirmDeactivateService.id);
      setConfirmDeactivateService(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate service price.");
    }
  };

  const openHistory = async (serviceId?: number, serviceName?: string) => {
    setHistoryServiceName(serviceName || "All Hospital Services");
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const records = await getHospitalPriceHistory(serviceId);
      setHistoryRecords(records);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openPreview = async () => {
    setShowPreviewModal(true);
    setPreviewLoading(true);
    try {
      const items = await getHospitalRatePreview();
      setPreviewItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatINR = (val?: number) => {
    if (val === undefined || val === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface tracking-tight">Pricing & Services Management</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Configure published rates, hospital rate cards in Indian Rupees (₹), and maintain historical price audits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => openHistory()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/50 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History</span>
          </button>

          <button
            onClick={openPreview}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>Preview Patient View</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">Total Services</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-on-surface">{metrics?.total_services ?? 0}</span>
            <span className="text-[11px] text-on-surface-variant font-medium">Catalogue count</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Published
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {metrics?.published_services ?? 0}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Live on Patient App</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Draft
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {metrics?.draft_services ?? 0}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Internal Staging</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">
            Inactive
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-on-surface-variant">
              {metrics?.inactive_services ?? 0}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Unpublished</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recently Updated
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-primary">
              {metrics?.recently_updated_count ?? 0}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Last 7 Days</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name, code, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface font-semibold focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            className="p-2 rounded-xl border border-outline-variant/50 hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-on-surface">
            <thead className="bg-surface-container-low text-outline font-bold uppercase tracking-wider border-b border-outline-variant/30 text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Code / Service Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Billing Unit</th>
                <th className="px-5 py-3.5 text-right">Price (₹)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      <span>Loading catalogue prices...</span>
                    </div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="w-8 h-8 text-outline/50" />
                      <span className="font-semibold text-sm text-on-surface">No services found</span>
                      <span className="text-xs">
                        Click "Add Service" to configure hospital rates and publish them to patients.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const price = service.current_price;
                  const priceStatus = price?.status || "DRAFT";

                  return (
                    <tr key={service.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sm text-on-surface">{service.name}</div>
                        <div className="text-[11px] font-mono text-on-surface-variant">
                          {service.service_code || "SRV-GEN"}
                        </div>
                        {service.description && (
                          <div className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                            {service.description}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant">
                          {service.category}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-on-surface-variant">
                        {service.billing_unit}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-sm text-on-surface">
                        {formatINR(price?.price)}
                      </td>

                      <td className="px-5 py-3.5">
                        {priceStatus === "PUBLISHED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Published
                          </span>
                        ) : priceStatus === "DRAFT" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-[11px] text-on-surface-variant font-mono">
                        {price?.updated_at
                          ? new Date(price.updated_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : new Date(service.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openHistory(service.id, service.name)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                            title="Price Audit History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(service)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Edit Service & Price"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {priceStatus !== "PUBLISHED" ? (
                            <button
                              onClick={() => setConfirmPublishService(service)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:brightness-105 transition-all shadow-xs"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeactivateService(service)}
                              className="px-2 py-1 rounded-lg border border-outline-variant/60 text-outline text-[11px] font-medium hover:bg-surface-container transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL: ADD / EDIT SERVICE ===================== */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveService}
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">
                  {editingService ? "Edit Service & Rate" : "Add Service Catalogue Item"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Choose Standard Clinical Preset <span className="text-primary font-normal">(Auto-fills all fields)</span>
                </label>
                <select
                  value={STANDARD_SERVICE_PRESETS.some((p) => p.name === serviceForm.name) ? serviceForm.name : ""}
                  onChange={(e) => {
                    const found = STANDARD_SERVICE_PRESETS.find((p) => p.name === e.target.value);
                    if (found) {
                      setServiceForm({
                        ...serviceForm,
                        name: found.name,
                        category: found.category,
                        billing_unit: found.billing_unit,
                        price: found.price,
                        service_code: found.code,
                        description: found.description
                      });
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-semibold text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">-- Or pick from standard healthcare service presets --</option>
                  <optgroup label="Room and Bed Charges">
                    {STANDARD_SERVICE_PRESETS.filter((p) => p.category === "Room and Bed Charges").map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString("en-IN")} ({p.billing_unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Emergency & Consultations">
                    {STANDARD_SERVICE_PRESETS.filter((p) => p.category === "Emergency Services").map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString("en-IN")} ({p.billing_unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Ambulance Services">
                    {STANDARD_SERVICE_PRESETS.filter((p) => p.category === "Ambulance Services").map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString("en-IN")} ({p.billing_unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Laboratory Tests">
                    {STANDARD_SERVICE_PRESETS.filter((p) => p.category === "Laboratory Services").map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString("en-IN")} ({p.billing_unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Diagnostic Imaging & Scans">
                    {STANDARD_SERVICE_PRESETS.filter((p) => p.category === "Diagnostic Services").map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString("en-IN")} ({p.billing_unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Medical Services">
                    {STANDARD_SERVICE_PRESETS.filter((p) => p.category === "Other Services").map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString("en-IN")} ({p.billing_unit})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="font-bold text-on-surface">Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. ICU Bed with Ventilator, Cardiac Consultation, Complete Blood Count"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface">Billing Unit</label>
                  <select
                    value={serviceForm.billing_unit}
                    onChange={(e) => setServiceForm({ ...serviceForm, billing_unit: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface"
                  >
                    {BILLING_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface">Rate in INR (₹) *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-on-surface">Publication Status</label>
                  <select
                    value={serviceForm.status}
                    onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value as any })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-semibold"
                  >
                    <option value="DRAFT">Save as Draft (Internal)</option>
                    <option value="PUBLISHED">Publish to Patients</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface">Service Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ICU-001, LAB-CBC-02"
                    value={serviceForm.service_code}
                    onChange={(e) => setServiceForm({ ...serviceForm, service_code: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface"
                  />
                </div>

                {editingService && (
                  <div>
                    <label className="font-bold text-on-surface">Reason for Price Adjustment</label>
                    <input
                      type="text"
                      placeholder="e.g. Annual revision, upgraded equipment"
                      value={serviceForm.change_reason}
                      onChange={(e) => setServiceForm({ ...serviceForm, change_reason: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-on-surface">Clinical / Service Description</label>
                <textarea
                  rows={2}
                  placeholder="Includes 24/7 intensivist monitoring, bedside oxygen and vital tracking..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface"
                />
              </div>

              {serviceForm.status === "PUBLISHED" && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2 text-[11px] text-primary">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Setting status to <strong>Published</strong> makes this rate visible immediately across the Patient Mobile App and Cost Estimation Calculator.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm"
              >
                {editingService ? "Update Rate Card" : "Save Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== CONFIRMATION: PUBLISH ===================== */}
      {confirmPublishService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">Publish Service Price?</h3>
                <p className="text-xs text-on-surface-variant">
                  Confirm publishing to the SmartCare public network.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container text-xs space-y-1.5">
              <div className="font-bold text-on-surface">{confirmPublishService.name}</div>
              <div className="text-on-surface-variant">Category: {confirmPublishService.category}</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                Rate: {formatINR(confirmPublishService.current_price?.price)} / {confirmPublishService.billing_unit}
              </div>
            </div>

            <p className="text-xs text-on-surface-variant">
              Once published, patients can view this rate in hospital search and include it in cost estimation calculators.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPublishService(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishConfirm}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONFIRMATION: DEACTIVATE ===================== */}
      {confirmDeactivateService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">Deactivate Public Price?</h3>
                <p className="text-xs text-on-surface-variant">
                  This rate will no longer appear on the patient search.
                </p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant">
              Are you sure you want to withdraw <strong>{confirmDeactivateService.name}</strong> from public display? Historical billing records and audit logs will remain intact.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeactivateService(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateConfirm}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
              >
                Deactivate Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PRICE HISTORY AUDIT ===================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-base text-on-surface">Price Audit Trail</h3>
                  <div className="text-xs text-on-surface-variant">{historyServiceName}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1 text-xs">
              {historyLoading ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  <span className="mt-2 block">Loading audit trail...</span>
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <Clock className="w-8 h-8 text-outline/40 mx-auto" />
                  <span className="mt-2 block font-semibold">No price modification history recorded yet.</span>
                </div>
              ) : (
                historyRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-on-surface">{rec.service_name}</span>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        {new Date(rec.changed_at).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="text-on-surface-variant line-through">{formatINR(rec.previous_price || 0)}</span>
                        <span>→</span>
                        <span className="text-primary font-bold text-sm">{formatINR(rec.new_price)}</span>
                      </div>

                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface">
                        {rec.new_status}
                      </span>
                    </div>

                    {rec.change_reason && (
                      <div className="text-[11px] text-on-surface-variant italic">
                        "{rec.change_reason}"
                      </div>
                    )}

                    <div className="text-[10px] text-outline font-mono">
                      Modified by: {rec.changed_by_email || "Hospital Admin"}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PREVIEW PATIENT VIEW ===================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-base text-on-surface">Patient Rate Card Preview</h3>
                  <div className="text-xs text-on-surface-variant">
                    Live representation of this hospital's rates as viewed by patients.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
              <strong>Patient Disclaimer:</strong> Prices shown are published by the hospital and are for informational purposes. Actual charges may vary depending on the services provided, treatment requirements, length of stay, additional procedures and applicable fees.
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {previewLoading ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  <span className="mt-2 block">Loading published rates...</span>
                </div>
              ) : previewItems.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <Tag className="w-8 h-8 text-outline/40 mx-auto" />
                  <span className="mt-2 block font-semibold">No services have been published yet.</span>
                  <span className="text-xs">Publish draft rates in the catalogue table to make them visible here.</span>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30 overflow-hidden">
                  {previewItems.map((item) => (
                    <div
                      key={item.service_id}
                      className="p-4 bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-on-surface">{item.service_name}</div>
                        <div className="text-xs text-on-surface-variant">{item.category}</div>
                        {item.description && (
                          <div className="text-[11px] text-on-surface-variant/80">{item.description}</div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-base text-primary">{formatINR(item.price)}</div>
                        <div className="text-[11px] text-on-surface-variant font-medium">{item.billing_unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 text-xs">
              <span className="text-on-surface-variant font-mono">
                {previewItems.length} published rates active
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
