"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplets,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  PhoneCall,
  Activity,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users
} from "lucide-react";
import { loginUser } from "@/lib/api";

export default function BloodBankLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("bloodbank@smartcare.org");
  const [password, setPassword] = useState("bloodbank123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password, "BLOOD_BANK");
      router.push("/bloodbank/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid Blood Bank credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans text-on-surface">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Blood Bank Operations Briefing */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-container-low border border-outline-variant/30 p-8 rounded-3xl shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold mb-6">
              <Droplets className="w-4 h-4 text-red-600" />
              <span>SmartCare Blood Network</span>
            </div>

            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Blood Bank Command & Donor Dispatch
            </h1>
            <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
              Real-time synchronization of blood components (Whole Blood, PRBC, Platelets, FFP), emergency hospital SOS alerts, and nearby voluntary donor coordination.
            </p>

            <div className="mt-8 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Real-Time Blood Stock Telemetry</p>
                  <p className="text-on-surface-variant">Live units tracking across all 8 blood groups (A+, B+, O+, AB+, etc.)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Emergency Blood Dispatch</p>
                  <p className="text-on-surface-variant">Instant fulfillment of critical trauma surgery and transfusion orders</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-tertiary flex items-center justify-center text-white shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Geospatial Voluntary Donors</p>
                  <p className="text-on-surface-variant">Locate and contact compatible donors nearby for urgent mobilization</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>24/7 National Transfusion Grid</span>
            <span className="font-mono text-primary font-bold">SMARTCARE-HEMO</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/40 p-8 sm:p-10 rounded-3xl shadow-sm flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-on-surface">Blood Bank Portal Sign In</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Authorized credentials required for clinical blood bank and transfusion registry access.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-error-container/40 border border-error/30 text-error flex items-start gap-3 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Refused</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Official Blood Bank Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. bloodbank@smartcare.org"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-on-surface-variant">Encrypted SHA-256</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Blood Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <span>New blood bank or regional center?</span>
            <Link
              href="/register/bloodbank"
              className="font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              Register Blood Bank Facility →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
