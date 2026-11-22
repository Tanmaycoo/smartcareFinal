"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, PhoneCall, ShieldCheck, Activity, Building2, Shield } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/hospital/dashboard") || pathname?.startsWith("/admin/dashboard") || pathname?.startsWith("/bloodbank/dashboard")) {
    return null;
  }
  return (
    <footer className="bg-surface-container-low text-on-surface-variant border-t border-surface-container-high text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-on-surface tracking-tight">
                SmartCare
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Regional hospital resource & emergency triage grid connecting citizens with live bed telemetry and ambulance dispatch.
            </p>
            <div className="flex items-center gap-2 text-xs text-tertiary font-semibold">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              99.98% Health Mesh Verified
            </div>
          </div>

          {/* Quick Care Access */}
          <div>
            <h4 className="text-on-surface font-bold text-xs uppercase tracking-wider mb-3">
              Citizen Emergency
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Find Nearest ICU & Beds
                </Link>
              </li>
              <li>
                <a href="#emergency-complaint" className="hover:text-primary transition-colors">
                  Submit Emergency Complaint
                </a>
              </li>
              <li>
                <a href="#ticket-tracker" className="hover:text-primary transition-colors">
                  Track Admission Ticket
                </a>
              </li>
              <li>
                <Link href="/login/patient" className="hover:text-primary transition-colors">
                  Patient & Family Login
                </Link>
              </li>
              <li>
                <a href="tel:108" className="text-secondary font-bold hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3 h-3" /> Dial 108 Emergency Ambulance
                </a>
              </li>
            </ul>
          </div>

          {/* Medical Providers */}
          <div>
            <h4 className="text-on-surface font-bold text-xs uppercase tracking-wider mb-3">
              Hospital Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login/hospital" className="hover:text-primary transition-colors flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Hospital Staff Login
                </Link>
              </li>
              <li>
                <Link href="/register/hospital" className="hover:text-primary transition-colors">
                  Register New Hospital Facility
                </Link>
              </li>
              <li>
                <Link href="/hospital/dashboard" className="hover:text-primary transition-colors">
                  Bed Telemetry Controller
                </Link>
              </li>
              <li>
                <Link href="/hospital/dashboard/transfers" className="hover:text-primary transition-colors">
                  Inter-Hospital Transfers
                </Link>
              </li>
              <li className="pt-2 border-t border-surface-container-high/60">
                <Link href="/login/bloodbank" className="hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold text-rose-600">
                  <span>Blood Bank Portal Login</span>
                </Link>
              </li>
              <li>
                <Link href="/register/bloodbank" className="hover:text-rose-600 transition-colors">
                  Register Blood Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Admin */}
          <div>
            <h4 className="text-on-surface font-bold text-xs uppercase tracking-wider mb-3">
              Platform Administration
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                  <Shield className="w-3 h-3" /> State Admin Gateway
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-primary transition-colors">
                  Facility Approvals & Verification
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard/telemetry" className="hover:text-primary transition-colors">
                  Regional Capacity Telemetry
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard/audit" className="hover:text-primary transition-colors">
                  Security & Audit Log Trail
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-on-surface-variant">
          <p>© 2026 SmartCare Health Emergency Grid. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-tertiary" />
              HIPAA & Health Protocol Compliant
            </span>
            <span>•</span>
            <span>Emergency Operations Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
