"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  HeartPulse,
  PhoneCall,
  Search,
  Building2,
  Shield,
  LogOut,
  User,
  ArrowLeft,
  FileText,
  Droplets
} from "lucide-react";
import { getStoredSession, clearSession, UserSession } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getStoredSession());
    const handleStorageChange = () => setSession(getStoredSession());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname]);

  const handleLogout = (redirectPath: string) => {
    clearSession();
    setSession(null);
    router.push(redirectPath);
  };

  // Hide generic navbar on full-screen Dashboards (Hospital, Admin, Blood Bank)
  if (
    pathname?.startsWith("/hospital/dashboard") ||
    pathname?.startsWith("/admin/dashboard") ||
    pathname?.startsWith("/bloodbank/dashboard")
  ) {
    return null;
  }

  // Auth navbar for blood bank login/register
  if (pathname === "/login/bloodbank" || pathname === "/register/bloodbank") {
    return (
      <header className="sticky top-0 z-50 w-full bg-surface-container-lowest border-b border-surface-container-high shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-on-surface">
                SmartCare Blood Network
              </span>
              <p className="text-xs text-on-surface-variant">Regional Blood Bank Registry & Emergency Dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Citizen Portal</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Auth navbar for hospital login/register
  if (pathname === "/login/hospital" || pathname === "/register/hospital") {
    return (
      <header className="sticky top-0 z-50 w-full bg-surface-container-lowest border-b border-surface-container-high shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-on-surface">
                SmartCare Clinical Operations
              </span>
              <p className="text-xs text-on-surface-variant">Hospital Facility Portal & Dispatch Access</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-primary hover:text-primary-container flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-outline-variant/40 hover:bg-surface-container transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Citizen Portal</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Standard Citizen & Public Navigation Bar
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-container-high bg-surface-container-lowest/95 backdrop-blur-md shadow-sm">
      {/* Top Clinical Telemetry Strip */}
      <div className="bg-surface-container-low text-on-surface-variant text-xs px-4 py-1.5 border-b border-surface-container-high">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            <span className="font-bold text-tertiary uppercase tracking-wider text-[11px]">
              Regional Health Mesh Active
            </span>
            <span className="hidden md:inline text-outline-variant">•</span>
            <span className="hidden md:inline text-xs text-on-surface-variant font-normal">
              Real-Time ICU Bed Telemetry & Trauma Triage Grid
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="tel:108"
              className="flex items-center gap-1.5 bg-secondary hover:bg-secondary-container text-on-secondary px-3 py-0.5 rounded-full font-bold transition-all shadow-sm text-[11px]"
            >
              <PhoneCall className="w-3 h-3" />
              <span>108 Ambulance Hotline</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-on-surface tracking-tight">
                SmartCare
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed uppercase tracking-wider">
                Live
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-normal">
              Hospital Resource & Triage Portal
            </p>
          </div>
        </Link>

        {/* Navigation links & Portals */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span>Find Hospitals</span>
          </Link>

          <a
            href="#emergency-complaint"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:bg-secondary-fixed/30 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-secondary" />
            <span>Emergency Complaint</span>
          </a>

          {/* User auth status */}
          {session?.role === "BLOOD_BANK" ? (
            <div className="flex items-center gap-2">
              <Link
                href="/bloodbank/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold hover:bg-rose-100 transition-colors"
              >
                <Droplets className="w-4 h-4 text-rose-600" />
                <span>{session.blood_bank_name || "Blood Bank Center"}</span>
              </Link>
              <button
                onClick={() => handleLogout("/login/bloodbank")}
                className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : session?.role === "PATIENT" ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-high text-xs">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-[11px]">
                  {session.name.charAt(0)}
                </div>
                <span className="font-semibold text-on-surface">{session.name.split(" ")[0]}</span>
              </div>
              <button
                onClick={() => handleLogout("/")}
                className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login/patient"
              className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Patient Sign In</span>
            </Link>
          )}

          {/* Hospital Staff, Blood Bank & SuperAdmin Links */}
          <div className="hidden md:flex items-center pl-3 border-l border-surface-container-high gap-2">
            <Link
              href="/login/hospital"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary-fixed/20 border border-primary/20 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital Staff</span>
            </Link>
            <Link
              href="/login/bloodbank"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <Droplets className="w-3.5 h-3.5 text-rose-600" />
              <span>Blood Bank</span>
            </Link>
            <Link
              href="/login/admin"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/30 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Gateway</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
