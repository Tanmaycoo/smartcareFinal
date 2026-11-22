"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplets,
  Building2,
  Mail,
  Lock,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LocateFixed,
  Award
} from "lucide-react";
import { registerBloodBank } from "@/lib/api";

export default function RegisterBloodBankPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    type: "Government / Red Cross",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "",
    latitude: 18.5204,
    longitude: 73.8567,
    phone: "",
    emergency_phone: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          }));
        },
        () => {
          alert("Could not retrieve GPS coordinates. Defaulting to regional coordinates.");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerBloodBank(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login/bloodbank");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to register blood bank. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface">
      <div className="max-w-3xl mx-auto">
        {/* Header Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-bold mb-3 shadow-xs">
            <Droplets className="w-4 h-4 text-red-600" />
            <span>SmartCare National Blood Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Register Blood Bank Center
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 max-w-lg mx-auto leading-relaxed">
            Onboard your blood transfusion service, blood storage unit, or component center to connect with regional hospitals and emergency triage ambulances.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 sm:p-10 shadow-sm">
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/30 text-primary flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Registration Successful!</p>
                <p className="mt-0.5">Redirecting to Blood Bank login portal...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-error-container/40 border border-error/30 text-error flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Registration Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Facility Information */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-red-600" />
                <span>1. Facility Identification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Blood Bank / Center Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Solapur Red Cross Regional Blood Center"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    State Drug Controller License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="e.g. BB-MH-2026-88124"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Facility Category *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    <option value="Government / Red Cross">Government / Red Cross</option>
                    <option value="Private Hospital Attached">Private Hospital Attached</option>
                    <option value="Trust / Charitable">Trust / Charitable Center</option>
                    <option value="Standalone Regional Center">Standalone Regional Center</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Address & Location Coordinates */}
            <div className="pt-4 border-t border-outline-variant/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>2. Location & Geographic Positioning</span>
                </h2>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-semibold text-primary transition-all cursor-pointer"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>Auto-Detect GPS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Station Road, Opposite Civil Hospital"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Pune, Solapur, Barshi"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="413001"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Authentication */}
            <div className="pt-4 border-t border-outline-variant/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>3. Contact & Security Credentials</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    General Reception Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-217-2741100"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    24/7 Emergency Transfusion Helpline *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                    placeholder="+91-9881122334"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Official Email (Login User ID) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="bloodbank@center.org"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/login/bloodbank"
                className="text-xs text-on-surface-variant hover:text-on-surface font-semibold"
              >
                ← Back to Blood Bank Login
              </Link>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering Center...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Blood Bank Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
