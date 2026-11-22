"use client";

import React, { useState, useEffect } from "react";
import {
  Droplets,
  Search,
  PhoneCall,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Send,
  X,
  Users,
  Building2,
  HeartPulse,
  Calendar
} from "lucide-react";
import {
  getNearbyBloodBanks,
  getNearbyBloodDonors,
  createBloodRequest,
  getBloodRequests,
  BloodBank,
  BloodDonor,
  BloodRequest
} from "@/lib/api";

const ALL_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface BloodManagementTabProps {
  hospitalId: number;
  hospitalName: string;
  hospitalLat?: number;
  hospitalLng?: number;
}

export default function BloodManagementTab({
  hospitalId,
  hospitalName,
  hospitalLat = 18.5204,
  hospitalLng = 73.8567,
}: BloodManagementTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"banks" | "donors" | "requests">("banks");

  // Data
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedRadius, setSelectedRadius] = useState<number | undefined>(25);

  // Emergency Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    patient_name: "",
    blood_group: "O+",
    component_type: "Whole Blood",
    units_needed: 2,
    urgency: "CRITICAL" as "CRITICAL" | "HIGH" | "MODERATE",
    contact_phone: "+91-8799881418",
    notes: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedGroup, selectedRadius]);

  const loadData = async () => {
    try {
      setLoading(true);
      const bgFilter = selectedGroup !== "All" ? selectedGroup : undefined;

      // 1. Nearby Blood Banks
      const banks = await getNearbyBloodBanks({
        blood_group: bgFilter,
        lat: hospitalLat,
        lng: hospitalLng,
        radius_km: selectedRadius,
      });
      setBloodBanks(banks);

      // 2. Nearby Donors
      const donorList = await getNearbyBloodDonors({
        blood_group: bgFilter,
        lat: hospitalLat,
        lng: hospitalLng,
        radius_km: selectedRadius,
        only_available: true,
      });
      setDonors(donorList);

      // 3. Hospital requests
      const hospitalReqs = await getBloodRequests({ hospital_id: hospitalId });
      setRequests(hospitalReqs);
    } catch (err) {
      console.error("Failed to load blood management data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      await createBloodRequest({
        requester_type: "HOSPITAL",
        requester_id: hospitalId,
        requester_name: hospitalName,
        hospital_id: hospitalId,
        hospital_name: hospitalName,
        patient_name: requestForm.patient_name,
        blood_group: requestForm.blood_group,
        component_type: requestForm.component_type,
        units_needed: requestForm.units_needed,
        urgency: requestForm.urgency,
        contact_phone: requestForm.contact_phone,
        latitude: hospitalLat,
        longitude: hospitalLng,
        notes: requestForm.notes,
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSuccess(false);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert("Failed to submit blood request: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Emergency Action */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Droplets className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-on-surface">Emergency Blood Coordination & Donors</h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time blood stock across accredited centers and GPS-proximity matching for compatible voluntary donors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Emergency Blood SOS</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedGroup("All")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedGroup === "All"
                ? "bg-red-600 text-white"
                : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All Groups
          </button>
          {ALL_BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              onClick={() => setSelectedGroup(bg)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedGroup === bg
                  ? "bg-red-600 text-white"
                  : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {bg}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>Radius:</span>
            <select
              value={selectedRadius || ""}
              onChange={(e) => setSelectedRadius(e.target.value ? Number(e.target.value) : undefined)}
              className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="">Any distance</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="p-1.5 bg-surface-container-lowest rounded-lg text-on-surface hover:text-primary transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab("banks")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "banks"
              ? "bg-surface-container-highest text-red-600"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Accredited Blood Banks ({bloodBanks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("donors")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "donors"
              ? "bg-surface-container-highest text-red-600"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Nearby Voluntary Donors ({donors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("requests")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "requests"
              ? "bg-surface-container-highest text-red-600"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Hospital Blood Orders ({requests.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: NEARBY ACCREDITED BLOOD BANKS */}
      {activeSubTab === "banks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bloodBanks.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/40">
              <Droplets className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-on-surface">No Blood Banks Found in this Range</p>
              <p className="text-xs text-on-surface-variant mt-1">Try expanding search radius or clearing blood group filter.</p>
            </div>
          ) : (
            bloodBanks.map((bank) => (
              <div
                key={bank.id}
                className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold mb-1.5">
                        <Droplets className="w-3 h-3" />
                        <span>{bank.type}</span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface">{bank.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span>{bank.address}, {bank.city}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-red-600">{bank.total_units}</span>
                      <span className="text-[10px] text-on-surface-variant block font-bold uppercase">Units Ready</span>
                    </div>
                  </div>

                  {bank.distance_km !== null && bank.distance_km !== undefined && (
                    <div className="mt-3 inline-block px-2.5 py-1 rounded-lg bg-surface-container-low text-xs font-bold text-primary">
                      📍 {bank.distance_km.toFixed(1)} km from your hospital
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <a
                    href={`tel:${bank.emergency_phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Helpline: {bank.emergency_phone}</span>
                  </a>

                  <button
                    onClick={() => {
                      setRequestForm((prev) => ({
                        ...prev,
                        notes: `Requested from ${bank.name} (License: ${bank.license_number})`,
                      }));
                      setShowRequestModal(true);
                    }}
                    className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                  >
                    Request Blood Supply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 2: NEARBY VOLUNTARY DONORS */}
      {activeSubTab === "donors" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.length === 0 ? (
            <div className="col-span-3 text-center py-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/40">
              <Users className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-on-surface">No Donors Found for {selectedGroup}</p>
              <p className="text-xs text-on-surface-variant mt-1">Try expanding distance radius or checking compatible donor groups.</p>
            </div>
          ) : (
            donors.map((donor) => (
              <div
                key={donor.id}
                className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">{donor.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {donor.gender || "Citizen"}, {donor.age ? `${donor.age} yrs` : "Age 20+"} • {donor.city}
                      </p>
                    </div>

                    <span className="w-10 h-10 rounded-2xl bg-red-100 text-red-800 font-extrabold text-sm flex items-center justify-center border border-red-200 shadow-xs">
                      {donor.blood_group}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-on-surface-variant">
                    <p className="flex items-center gap-1.5 font-bold text-primary">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {donor.distance_km !== null && donor.distance_km !== undefined
                          ? `${donor.distance_km.toFixed(1)} km from hospital`
                          : donor.address || donor.city}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-tertiary" />
                      <span>Last Donated: {donor.last_donation_date || "Eligible"}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                    Ready for Emergency
                  </span>

                  <a
                    href={`tel:${donor.phone}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Donor</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 3: HOSPITAL BLOOD REQUEST ORDERS */}
      {activeSubTab === "requests" && (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-on-surface mb-3">Your Hospital's Emergency Blood Demands</h3>

          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-on-surface-variant">No active blood orders submitted by this hospital.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold border-b border-outline-variant/30">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Blood Group</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Urgency</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-on-surface">{r.request_number}</td>
                      <td className="py-2.5 px-3 font-semibold">{r.patient_name}</td>
                      <td className="py-2.5 px-3 font-extrabold text-red-600">{r.blood_group}</td>
                      <td className="py-2.5 px-3">{r.units_needed} units</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.urgency === "CRITICAL" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-800"}`}>
                          {r.urgency}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "FULFILLED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "Today"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: RAISE EMERGENCY BLOOD SOS */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Raise Emergency Blood SOS</h3>
                  <p className="text-[11px] text-on-surface-variant">Broadcasts demand to nearby blood centers & donors</p>
                </div>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-on-surface text-sm">Emergency Blood Request Broadcasted!</p>
                <p className="text-xs text-on-surface-variant mt-1">Nearby blood banks and donors have been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={requestForm.patient_name}
                    onChange={(e) => setRequestForm({ ...requestForm, patient_name: e.target.value })}
                    placeholder="e.g. Anand Deshmukh"
                    className="w-full px-3 py-2 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Blood Group Needed *</label>
                    <select
                      value={requestForm.blood_group}
                      onChange={(e) => setRequestForm({ ...requestForm, blood_group: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none font-bold text-red-600"
                    >
                      {ALL_BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg} Group
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Units Needed *</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={requestForm.units_needed}
                      onChange={(e) => setRequestForm({ ...requestForm, units_needed: Number(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Component Type</label>
                    <select
                      value={requestForm.component_type}
                      onChange={(e) => setRequestForm({ ...requestForm, component_type: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                    >
                      <option value="Whole Blood">Whole Blood</option>
                      <option value="PRBC">Packed Red Blood Cells (PRBC)</option>
                      <option value="Platelets">Platelets / RDP / SDP</option>
                      <option value="FFP">Fresh Frozen Plasma (FFP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Urgency Level *</label>
                    <select
                      value={requestForm.urgency}
                      onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none font-bold text-error"
                    >
                      <option value="CRITICAL">CRITICAL (Immediate &lt; 30m)</option>
                      <option value="HIGH">HIGH (Needed within 2 hours)</option>
                      <option value="MODERATE">MODERATE (Elective / Next 6 hours)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Hospital Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={requestForm.contact_phone}
                    onChange={(e) => setRequestForm({ ...requestForm, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Clinical Notes</label>
                  <input
                    type="text"
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                    placeholder="e.g. Severe trauma surgery in OT 2, active bleeding"
                    className="w-full px-3 py-2 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-outline-variant/30 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {submittingRequest ? "Broadcasting..." : "Confirm & Send SOS"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
