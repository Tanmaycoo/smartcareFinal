"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Activity,
  BedDouble,
  Shield,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Radio,
  FileCheck2
} from "lucide-react";
import { loginUser } from "@/lib/api";

export default function HospitalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("rector@gmail.com");
  const [password, setPassword] = useState("rectorpassword");
  const [error, setError] = useState("");
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [rejectedNotice, setRejectedNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPendingNotice(null);
    setRejectedNotice(null);
    setLoading(true);

    try {
      await loginUser(email, password, "HOSPITAL");
      router.push("/hospital/dashboard");
    } catch (err: any) {
      const msg = err.message || "Invalid hospital credentials.";
      if (msg.includes("APPLICATION PENDING")) {
        setPendingNotice(msg.replace("APPLICATION PENDING APPROVAL: ", "").replace("APPLICATION PENDING: ", ""));
      } else if (msg.includes("APPLICATION REJECTED")) {
        setRejectedNotice(msg.replace("APPLICATION REJECTED: ", ""));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans text-on-surface">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Clinical Operations Briefing */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-container-low border border-outline-variant/30 p-8 rounded-3xl shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold mb-6">
              <Building2 className="w-4 h-4 text-primary" />
              <span>SmartCare Clinical Ops</span>
            </div>

            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Hospital Operations & Bed Management
            </h1>
            <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
              Real-time synchronization of emergency beds, oxygen reserves, blood bank inventory, incoming triage sirens, and inter-hospital patient transfers.
            </p>

            <div className="mt-8 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Interactive Bed Telemetry</p>
                  <p className="text-on-surface-variant">Live + / − adjustments across regional emergency dispatch</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-tertiary flex items-center justify-center text-white shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Direct Emergency Intake</p>
                  <p className="text-on-surface-variant">One-click bay allocation for incoming critical trauma patients</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-white shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Accreditation Protected</p>
                  <p className="text-on-surface-variant">Direct oversight by State Health Regulatory Authority</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Clinical Node Status: Online</span>
            <span className="font-bold text-tertiary">HL7 / FHIR Active</span>
          </div>
        </div>

        {/* Right Side: Hospital Staff Login Form */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/40 p-8 sm:p-10 rounded-3xl shadow-sm flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">Hospital Staff Sign In</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Authenticate with your facility credentials to access your live bed & resource dashboard.
            </p>
          </div>

          {/* Pending Review Notice */}
          {pendingNotice && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Hospital Application Under Review</span>
              </div>
              <p className="text-amber-700 leading-relaxed">{pendingNotice}</p>
              <div className="pt-2 text-[11px] text-amber-800 font-semibold">
                SuperAdmin is currently inspecting your uploaded medical license and fire NOC.
              </div>
            </div>
          )}

          {/* Rejected Notice */}
          {rejectedNotice && (
            <div className="mb-6 p-4 rounded-xl bg-error-container border border-error/30 text-on-error-container text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-error">
                <AlertCircle className="w-4 h-4 text-error" />
                <span>Application Rejected by SuperAdmin</span>
              </div>
              <p className="leading-relaxed">{rejectedNotice}</p>
            </div>
          )}

          {/* Generic Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-error-container border border-error/30 text-on-error-container text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-error shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Hospital Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rector@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest text-on-surface font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest text-on-surface font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Clinical Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setEmail("rector@gmail.com");
                setPassword("rectorpassword");
              }}
              className="w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Use Approved Demo Hospital (rector@gmail.com)</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link href="/register/hospital" className="text-primary font-bold hover:underline">
              Register New Hospital
            </Link>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Link href="/login/admin" className="hover:text-primary transition-colors">
                SuperAdmin Portal
              </Link>
              <span>•</span>
              <Link href="/" className="hover:text-primary transition-colors">
                Citizen Care
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
