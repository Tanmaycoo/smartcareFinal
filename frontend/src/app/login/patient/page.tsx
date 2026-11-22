"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  HeartPulse,
  Lock,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  ArrowLeft
} from "lucide-react";
import { loginUser, registerPatient, trackEmergencyRequest, PatientRequest } from "@/lib/api";

export default function PatientLoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Ticket tracking shortcut
  const [ticketQuery, setTicketQuery] = useState("");
  const [trackedTicket, setTrackedTicket] = useState<PatientRequest | null>(null);
  const [ticketError, setTicketError] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await registerPatient(name, email, password, phone);
      } else {
        await loginUser(email, password, "PATIENT");
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketQuery.trim()) return;
    setTicketError("");
    setTrackedTicket(null);
    setTrackingLoading(true);

    try {
      const data = await trackEmergencyRequest(ticketQuery.trim().toUpperCase());
      setTrackedTicket(data);
    } catch (err: any) {
      setTicketError(err.message || "Ticket code not found.");
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans text-on-surface">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Patient Reassurance & Ticket Quick-Tracker */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold mb-4">
              <HeartPulse className="w-4 h-4 text-primary" />
              <span>Citizen Portal</span>
            </div>
            <h1 className="text-xl font-bold text-on-surface tracking-tight">
              Rapid Care When Every Second Matters
            </h1>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Find live ICU beds, check arrival times, and coordinate urgent admissions across all certified network hospitals.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-on-surface-variant">
                <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                <span>Zero login needed to view live bed counts or dial emergency lines.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-on-surface-variant">
                <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                <span>Real-time digital tracking code issued with every emergency bed request.</span>
              </div>
            </div>
          </div>

          {/* Quick Ticket Tracker Card */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-surface-container-high shadow-sm">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4" />
              <span>Emergency Code Tracker</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface mb-1">
              Track Live Admission Status
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Enter your ticket (e.g. <span className="font-mono text-primary font-bold">SC-EMG-1042</span>) to see triage and bed assignment:
            </p>

            <form onSubmit={handleTrackTicket} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SC-EMG-1042"
                value={ticketQuery}
                onChange={(e) => setTicketQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                {trackingLoading ? "..." : <Search className="w-3.5 h-3.5" />}
              </button>
            </form>

            {ticketError && (
              <p className="text-xs text-secondary mt-2 font-medium">⚠️ {ticketError}</p>
            )}

            {trackedTicket && (
              <div className="mt-4 p-3.5 bg-surface-container-lowest rounded-lg border border-surface-container-high text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-primary">{trackedTicket.ticket_code}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                    trackedTicket.status === "BED_ALLOCATED" || trackedTicket.status === "ADMITTED"
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : trackedTicket.status === "TRIAGED"
                      ? "bg-primary-fixed text-on-primary-fixed"
                      : "bg-surface-container-high text-on-surface"
                  }`}>
                    {trackedTicket.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-on-surface">
                  <strong className="text-on-surface-variant">Patient:</strong> {trackedTicket.patient_name} ({trackedTicket.patient_age}y)
                </p>
                <p className="text-on-surface">
                  <strong className="text-on-surface-variant">Hospital:</strong> {trackedTicket.hospital_name || "Regional Grid"}
                </p>
                {trackedTicket.allocated_bed_category && (
                  <p className="text-tertiary font-semibold">
                    🛏️ Reserved Bed: {trackedTicket.allocated_bed_category}
                  </p>
                )}
                <p className="text-[11px] text-on-surface-variant">ETA: ~{trackedTicket.eta_minutes} mins</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Clean Patient Login / Register Card */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 sm:p-8 rounded-xl border border-surface-container-high shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                {isRegister ? "Create Patient Account" : "Patient & Family Sign In"}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {isRegister
                  ? "Register to save emergency contacts and view past admission tickets"
                  : "Access your emergency records and saved family profiles"}
              </p>
            </div>
            <div className="flex bg-surface-container p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`px-3 py-1.5 rounded transition-all ${
                  !isRegister ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`px-3 py-1.5 rounded transition-all ${
                  isRegister ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-error" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohan Kulkarni"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? "Processing..." : isRegister ? "Create Account" : "Sign In to Portal"}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-surface-container-high flex items-center justify-between text-xs">
            <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <Link href="/login/hospital" className="text-primary hover:underline font-semibold">
              Hospital Staff Portal →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
