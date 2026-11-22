"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Server,
  FileCheck2,
  AlertCircle,
  KeyRound,
  Zap,
  Activity
} from "lucide-react";
import { loginUser } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@smartcare.org");
  const [password, setPassword] = useState("adminpassword123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password, "ADMIN");
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Admin authorization rejected. Please verify SuperAdmin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans text-white">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Regulatory Oversight & Security Protocol */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-fixed text-xs font-bold border border-primary/30 mb-6">
              <Shield className="w-4 h-4 text-primary-fixed" />
              <span>State Healthcare Directorate</span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Central Command & Accreditation Control
            </h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              SuperAdmin access point for inspecting hospital registrations, auditing medical establishment licenses, approving clinical mesh onboarding, and overseeing emergency triage routing.
            </p>

            <div className="mt-8 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">License Verification</p>
                  <p className="text-slate-400">Review clinical certificates & fire safety NOCs</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-primary-fixed shrink-0 border border-slate-700">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Platform Audit Stream</p>
                  <p className="text-slate-400">Track all bed changes and emergency allocations</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Regulatory Gateway v1.0</span>
            <span className="font-mono text-emerald-400 font-bold">256-Bit TLS Secured</span>
          </div>
        </div>

        {/* Right Side: Admin Authentication Form */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">SuperAdmin Authorization</h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide central authority master key credentials to manage healthcare operations.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">SuperAdmin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartcare.org"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Master Key / Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter authority key"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
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
                  <span>Authorizing Node...</span>
                </>
              ) : (
                <>
                  <span>Authorize & Launch Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Master Key Pre-fill Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@smartcare.org");
                setPassword("adminpassword123");
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-primary-fixed text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Zap className="w-3.5 h-3.5 text-primary-fixed" />
              <span>Fill SuperAdmin Master Key (admin@smartcare.org)</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Link href="/login/hospital" className="text-primary-fixed font-bold hover:underline">
              Hospital Operations Staff
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Citizen Emergency Care
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
