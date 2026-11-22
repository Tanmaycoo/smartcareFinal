"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplets,
  Activity,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Edit,
  Save,
  X,
  Radio,
  Sliders,
  Shield,
  LogOut,
  Send,
  Eye,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  Users,
  Building2,
  MapPin,
  HeartPulse,
  Share2,
  Calendar
} from "lucide-react";
import {
  getStoredSession,
  clearSession,
  getBloodBankDetail,
  updateBloodInventory,
  getNearbyBloodDonors,
  getBloodRequests,
  updateBloodRequestStatus,
  BloodBank,
  BloodInventoryItem,
  BloodDonor,
  BloodRequest,
  UserSession
} from "@/lib/api";

const ALL_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BloodBankDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"inventory" | "requests" | "donors" | "profile">("inventory");

  // Data states
  const [bank, setBank] = useState<BloodBank | null>(null);
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Donor Search Filters
  const [donorBloodGroup, setDonorBloodGroup] = useState("All");
  const [donorRadiusKm, setDonorRadiusKm] = useState<number | undefined>(25);

  // Request Filter
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");

  useEffect(() => {
    const s = getStoredSession();
    if (!s || (s.role !== "BLOOD_BANK" && s.role !== "ADMIN")) {
      router.push("/login/bloodbank");
      return;
    }
    setSession(s);
    loadData(s);
  }, []);

  const loadData = async (userSession: UserSession) => {
    try {
      setLoading(true);
      const bankId = userSession.blood_bank_id || 1;

      // 1. Fetch Blood Bank details with inventory
      const bankData = await getBloodBankDetail(bankId);
      setBank(bankData);

      // Normalize inventory
      const existingInv = bankData.inventory || [];
      const completeInv: BloodInventoryItem[] = ALL_BLOOD_GROUPS.map((group) => {
        const found = existingInv.find((i) => i.blood_group === group);
        return {
          blood_group: group,
          component_type: "Whole Blood",
          available_units: found ? found.available_units : 0,
          reserved_units: found ? found.reserved_units : 0,
          last_updated: found ? found.last_updated : undefined,
        };
      });
      setInventory(completeInv);

      // 2. Fetch Blood Requests
      const reqs = await getBloodRequests({ lat: bankData.latitude, lng: bankData.longitude });
      setRequests(reqs);

      // 3. Fetch Nearby Donors
      const donorList = await getNearbyBloodDonors({
        lat: bankData.latitude,
        lng: bankData.longitude,
        radius_km: 25,
      });
      setDonors(donorList);
    } catch (err: any) {
      console.error("Error loading blood bank dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!session) return;
    setRefreshing(true);
    await loadData(session);
    setRefreshing(false);
  };

  const handleAdjustUnit = async (group: string, delta: number) => {
    if (!bank) return;
    const updated = inventory.map((item) => {
      if (item.blood_group === group) {
        return {
          ...item,
          available_units: Math.max(0, item.available_units + delta),
        };
      }
      return item;
    });
    setInventory(updated);

    try {
      await updateBloodInventory(bank.id, updated);
    } catch (err) {
      console.error("Failed to update inventory unit:", err);
      // rollback
      loadData(session!);
    }
  };

  const handleRequestStatusChange = async (requestId: number, newStatus: string) => {
    if (!bank) return;
    try {
      await updateBloodRequestStatus(requestId, newStatus, bank.id);
      // update local
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus as any } : r))
      );
    } catch (err: any) {
      alert("Failed to update blood request: " + (err.message || "Unknown error"));
    }
  };

  const handleFilterDonors = async () => {
    if (!bank) return;
    try {
      const donorList = await getNearbyBloodDonors({
        blood_group: donorBloodGroup !== "All" ? donorBloodGroup : undefined,
        lat: bank.latitude,
        lng: bank.longitude,
        radius_km: donorRadiusKm,
      });
      setDonors(donorList);
    } catch (err) {
      console.error("Failed to filter donors:", err);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login/bloodbank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-on-surface-variant">Connecting to SmartCare Blood Center Network...</p>
        </div>
      </div>
    );
  }

  const totalAvailableUnits = inventory.reduce((sum, item) => sum + item.available_units, 0);
  const criticalGroups = inventory.filter((item) => item.available_units < 3);
  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-16">
      {/* Top Banner Navigation */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/40 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-xs">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
                    {bank?.name || "Blood Bank Center"}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant flex items-center gap-2">
                  <span>Lic: {bank?.license_number}</span>
                  <span>•</span>
                  <span>{bank?.city}, {bank?.state}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer border border-outline-variant/30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-red-600" : ""}`} />
                <span className="hidden sm:inline">Sync Live</span>
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Helpline: {bank?.emergency_phone}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-error hover:bg-error-container/20 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-outline-variant/20 pt-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "inventory"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Blood Inventory ({totalAvailableUnits} Units)</span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "requests"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Emergency Blood SOS ({pendingRequests.length} Pending)</span>
              {pendingRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("donors")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "donors"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nearby Voluntary Donors ({donors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "profile"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Center Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Total Units In Stock
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                {totalAvailableUnits}
              </span>
              <span className="text-xs font-semibold text-primary">Units Ready</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Critical Low Groups
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl sm:text-3xl font-extrabold ${criticalGroups.length > 0 ? "text-error" : "text-green-600"}`}>
                {criticalGroups.length}
              </span>
              <span className="text-xs text-on-surface-variant">Groups &lt; 3u</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Active Hospital SOS
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl sm:text-3xl font-extrabold ${pendingRequests.length > 0 ? "text-red-600" : "text-on-surface"}`}>
                {pendingRequests.length}
              </span>
              <span className="text-xs text-on-surface-variant">Pending Orders</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Registered Donors Nearby
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-tertiary">
                {donors.length}
              </span>
              <span className="text-xs text-on-surface-variant">Within 25 km</span>
            </div>
          </div>
        </div>

        {/* TAB 1: BLOOD INVENTORY */}
        {activeTab === "inventory" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface">Live Blood Stock Telemetry</h2>
                <p className="text-xs text-on-surface-variant">
                  Adjust unit counts with one click. Real-time updates reflect instantly across regional hospitals.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventory.map((item) => {
                const isCritical = item.available_units < 3;
                const isLow = item.available_units >= 3 && item.available_units < 10;
                return (
                  <div
                    key={item.blood_group}
                    className={`p-5 rounded-3xl bg-surface-container-lowest border transition-all ${
                      isCritical
                        ? "border-red-300 shadow-sm"
                        : "border-outline-variant/40 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-extrabold text-xl shadow-xs">
                          {item.blood_group}
                        </div>
                        <span className="text-[11px] font-bold text-on-surface-variant mt-2 block">
                          Whole Blood / PRBC
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? "bg-red-100 text-red-800"
                            : isLow
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {isCritical ? "Critical Low" : isLow ? "Moderate Stock" : "Adequate"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-3xl font-black text-on-surface">
                          {item.available_units}
                        </span>
                        <span className="text-xs text-on-surface-variant ml-1 font-semibold">
                          units
                        </span>
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
                        <button
                          onClick={() => handleAdjustUnit(item.blood_group, -1)}
                          disabled={item.available_units <= 0}
                          className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high disabled:opacity-30 text-on-surface flex items-center justify-center font-bold transition-all cursor-pointer shadow-xs"
                          title="Reduce 1 unit (used)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAdjustUnit(item.blood_group, 1)}
                          className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold transition-all cursor-pointer shadow-xs"
                          title="Add 1 unit (donated)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: EMERGENCY BLOOD REQUESTS */}
        {activeTab === "requests" && (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-on-surface">Emergency Blood Demands & Trauma Orders</h2>
                <p className="text-xs text-on-surface-variant">
                  Inbound blood supply requests raised by regional hospitals and emergency patients.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-bold">Filter Status:</span>
                <select
                  value={requestStatusFilter}
                  onChange={(e) => setRequestStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                >
                  <option value="ALL">All Requests</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="ACCEPTED">Accepted / In-Transit</option>
                  <option value="FULFILLED">Fulfilled</option>
                </select>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-on-surface">No Pending Blood Requests</p>
                <p className="text-xs text-on-surface-variant mt-1">All hospital blood requests are currently fulfilled.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold border-b border-outline-variant/30">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Hospital / Requester</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Units Needed</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {requests
                      .filter((r) => requestStatusFilter === "ALL" || r.status === requestStatusFilter)
                      .map((req) => (
                        <tr key={req.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-on-surface">
                            {req.request_number}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-on-surface">{req.hospital_name || req.requester_name}</p>
                            <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" />
                              <a href={`tel:${req.contact_phone}`} className="hover:underline text-primary">
                                {req.contact_phone}
                              </a>
                            </p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-on-surface">
                            {req.patient_name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-extrabold text-xs">
                              {req.blood_group}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-on-surface">
                            {req.units_needed} units
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                req.urgency === "CRITICAL"
                                  ? "bg-red-600 text-white animate-pulse"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {req.urgency}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                req.status === "FULFILLED"
                                  ? "bg-green-100 text-green-800"
                                  : req.status === "ACCEPTED" || req.status === "IN_TRANSIT"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {req.status === "PENDING" && (
                              <div className="inline-flex gap-1.5">
                                <button
                                  onClick={() => handleRequestStatusChange(req.id, "ACCEPTED")}
                                  className="px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
                                >
                                  Accept Order
                                </button>
                              </div>
                            )}
                            {req.status === "ACCEPTED" && (
                              <button
                                onClick={() => handleRequestStatusChange(req.id, "FULFILLED")}
                                className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all cursor-pointer"
                              >
                                Mark Dispatched
                              </button>
                            )}
                            {req.status === "FULFILLED" && (
                              <span className="text-[11px] text-green-700 font-bold flex items-center justify-end gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Dispatched
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NEARBY VOLUNTARY DONORS */}
        {activeTab === "donors" && (
          <div>
            {/* Filter Bar */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-5 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-on-surface">Voluntary Blood Donors Directory</h2>
                <p className="text-xs text-on-surface-variant">
                  Geospatial directory of registered citizens available for emergency mobilization and donation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <select
                    value={donorBloodGroup}
                    onChange={(e) => setDonorBloodGroup(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                  >
                    <option value="All">All Blood Groups</option>
                    {ALL_BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg} Group
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={donorRadiusKm || ""}
                    onChange={(e) => setDonorRadiusKm(e.target.value ? Number(e.target.value) : undefined)}
                    className="px-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                  >
                    <option value="10">Within 10 km</option>
                    <option value="25">Within 25 km</option>
                    <option value="50">Within 50 km</option>
                    <option value="">Any distance</option>
                  </select>
                </div>

                <button
                  onClick={handleFilterDonors}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all cursor-pointer"
                >
                  Search Donors
                </button>
              </div>
            </div>

            {/* Donor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors.map((donor) => (
                <div
                  key={donor.id}
                  className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-on-surface">{donor.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {donor.gender || "Citizen"}, {donor.age ? `${donor.age} yrs` : "Age 25+"} • {donor.city}
                        </p>
                      </div>

                      <span className="w-10 h-10 rounded-2xl bg-red-100 text-red-800 font-extrabold text-sm flex items-center justify-center border border-red-200 shadow-xs">
                        {donor.blood_group}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-on-surface-variant">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{donor.address || donor.city}</span>
                        {donor.distance_km !== null && donor.distance_km !== undefined && (
                          <span className="font-bold text-primary">
                            • {donor.distance_km.toFixed(1)} km away
                          </span>
                        )}
                      </p>

                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-tertiary" />
                        <span>Last Donated: {donor.last_donation_date || "Not recorded"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        donor.is_available
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {donor.is_available ? "Available for Emergency" : "Currently Unavailable"}
                    </span>

                    <a
                      href={`tel:${donor.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Donor</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CENTER PROFILE */}
        {activeTab === "profile" && bank && (
          <div className="max-w-2xl bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-on-surface mb-4">Blood Bank Facility Profile</h2>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Facility Name</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{bank.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">License Number</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{bank.license_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Center Category</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{bank.type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Verification State</span>
                  <p className="text-sm font-bold text-green-600 mt-0.5">{bank.verification_status}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Physical Location</span>
                <p className="text-sm text-on-surface mt-0.5">{bank.address}, {bank.city}, {bank.state} - {bank.pincode}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">24/7 Helpline</span>
                  <p className="text-sm font-bold text-red-600 mt-0.5">{bank.emergency_phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Official Email</span>
                  <p className="text-sm text-on-surface mt-0.5">{bank.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
