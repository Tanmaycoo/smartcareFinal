"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileCheck,
  PhoneCall,
  MapPin,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Ambulance,
  BedDouble,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  Eye,
  Clock
} from "lucide-react";
import { registerHospital } from "@/lib/api";

interface UploadedDoc {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: string;
  file_data: string;
  uploaded_at: string;
}

export default function RegisterHospitalPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    license_number: "",
    type: "Multispecialty",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "",
    latitude: 18.5204,
    longitude: 73.8567,
    emergency_phone: "",
    reception_phone: "",
    website: "",
    total_capacity: 120,
    ambulance_count: 4,
    documents_summary: "Clinical Establishment License, State Fire NOC, NABH Accreditation",
  });

  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [docTitle, setDocTitle] = useState("Medical Establishment License");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedApplication, setSubmittedApplication] = useState<any | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          }));
        },
        () => alert("Unable to retrieve GPS coordinates.")
      );
    }
  };

  // Handle Document File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const newDoc: UploadedDoc = {
        id: `doc-${Date.now()}`,
        title: docTitle,
        file_name: file.name,
        file_type: file.type || "application/pdf",
        file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        file_data: base64Data,
        uploaded_at: new Date().toISOString(),
      };
      setDocuments([...documents, newDoc]);
      // Reset title to next standard doc
      if (docTitle === "Medical Establishment License") {
        setDocTitle("NABH Accreditation Certificate");
      } else if (docTitle === "NABH Accreditation Certificate") {
        setDocTitle("Fire Safety Clearance NOC");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (documents.length === 0) {
      setError("Please attach at least one medical establishment license or certification PDF for SuperAdmin verification.");
      return;
    }

    setLoading(true);

    try {
      const res = await registerHospital({
        ...formData,
        total_capacity: Number(formData.total_capacity),
        ambulance_count: Number(formData.ambulance_count),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        documents_summary: documents.map((d) => `${d.title} (${d.file_name})`).join(", "),
        uploaded_documents: documents,
      });

      setSubmittedApplication(res);
    } catch (err: any) {
      setError(err.message || "Failed to submit hospital application.");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS CONFIRMATION STATE (Pending SuperAdmin Approval)
  if (submittedApplication) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-teal-500/30 overflow-hidden text-center p-8 sm:p-10 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wider border border-amber-200">
            Application Submitted • SuperAdmin Review Pending
          </span>

          <h2 className="text-2xl font-black text-slate-900 mt-4">
            Registration Queued for Verification
          </h2>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your application for <strong>{submittedApplication.hospital_name}</strong> (License: <span className="font-mono text-teal-700 font-bold">{submittedApplication.license_number}</span>) has been submitted to the State Health Regulatory Authority.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs space-y-2 text-amber-900">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Security Protocol Notice:
            </p>
            <p className="text-[11px] leading-relaxed">
              In accordance with state healthcare regulations, hospital administrator accounts are kept <strong>inactive</strong> until the SuperAdmin inspects and approves your uploaded license documents.
            </p>
            <p className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-amber-200/60">
              📁 {documents.length} document(s) uploaded for verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/login/hospital")}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-md shadow-teal-600/20"
            >
              Go to Hospital Login
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
            >
              Return to Citizen Grid
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-8 py-8 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-3">
            <Building2 className="w-4 h-4" />
            Healthcare Provider Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Register Your Hospital to SmartCare Network
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            Upload your medical establishment license, NABH accreditations, and fire safety clearances for SuperAdmin review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Institution Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              1. Institutional Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Medical Center Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. LifeSpring Memorial Specialty Hospital"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Hospital License Number *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomNum = Math.floor(100000 + Math.random() * 900000);
                      setFormData((prev) => ({ ...prev, license_number: `HOSP-MH-2026-${randomNum}` }));
                    }}
                    className="text-[11px] text-teal-600 hover:text-teal-700 font-bold hover:underline"
                  >
                    ⚡ Auto-Generate License No.
                  </button>
                </div>
                <input
                  type="text"
                  name="license_number"
                  required
                  placeholder="e.g. HOSP-MH-2026-8812"
                  value={formData.license_number}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter your hospital&apos;s registration certificate/license number — not your state name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Classification *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Multispecialty">Multispecialty Hospital</option>
                  <option value="Level 1 Trauma Center">Level 1 Trauma Center</option>
                  <option value="Tertiary Care">Tertiary Care Hospital</option>
                  <option value="Specialty Pediatric & Maternity">Specialty Pediatric & Maternity</option>
                  <option value="Cardiac & Critical Care">Cardiac & Critical Care Center</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Account Credentials & Emergency Hotline */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-teal-600" />
              2. Emergency Contacts & Staff Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email (Login User) *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@lifespring.org"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Portal Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">24x7 Emergency Phone Line *</label>
                <input
                  type="tel"
                  name="emergency_phone"
                  required
                  placeholder="+91-20-8800-1122"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reception / Desk Phone</label>
                <input
                  type="tel"
                  name="reception_phone"
                  placeholder="+91-20-8800-1100"
                  value={formData.reception_phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Physical Address & Geolocation */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                3. Facility Address & Geolocation
              </h3>
              <button
                type="button"
                onClick={handleUseLocation}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
              >
                📍 Auto-Detect GPS Coords
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Plot 18, Health City Campus, Aundh"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN / Postal Code *</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  placeholder="411007"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Document Uploads for SuperAdmin Review */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              4. Upload License Documents for SuperAdmin Review
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload official PDFs or scanned certificates. SuperAdmin will inspect these documents in the verification desk before granting login access.
            </p>

            {/* Upload Selector Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                  <select
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Medical Establishment License">Medical Establishment License</option>
                    <option value="NABH Accreditation Certificate">NABH Accreditation Certificate</option>
                    <option value="Fire Safety Clearance NOC">Fire Safety Clearance NOC</option>
                    <option value="Biomedical Waste Clearance">Biomedical Waste Clearance</option>
                    <option value="Blood Bank License">Blood Bank License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF / Image)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Sample Preset Shortcut */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>Want to test with sample certificate?</span>
                <button
                  type="button"
                  onClick={() => {
                    const sampleDoc: UploadedDoc = {
                      id: `doc-${Date.now()}`,
                      title: docTitle,
                      file_name: `${docTitle.toLowerCase().replace(/\s+/g, "_")}_verified.pdf`,
                      file_type: "application/pdf",
                      file_size: "1.85 MB",
                      file_data: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJzT10/Oz8srzs9NzEst4uWq5UrNzMnLL9ZHKs7ILEtNTsxT0FXwSM3JyU9PzUvNAQB0gA9eCmVuZHN0cmVhbQplbmRvYmoK",
                      uploaded_at: new Date().toISOString(),
                    };
                    setDocuments([...documents, sampleDoc]);
                  }}
                  className="font-bold text-teal-700 hover:underline"
                >
                  + Add Preset Sample Document
                </button>
              </div>
            </div>

            {/* List of Attached Documents */}
            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-slate-700">Attached Documents ({documents.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-teal-700 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{doc.file_name} • {doc.file_size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1 text-red-500 hover:text-red-700 shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/login/hospital")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Submitting Application & Uploading Docs...</span>
              ) : (
                <>
                  <span>Submit Application for Review</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
