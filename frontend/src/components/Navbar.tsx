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
  Droplets,
  Receipt,
  CheckCircle2,
  Clock,
  X,
  Printer,
  RefreshCw
} from "lucide-react";
import { getStoredSession, clearSession, getPatientBills, PatientBill, UserSession } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);

  // Patient Bills Modal State
  const [showPatientBillsModal, setShowPatientBillsModal] = useState(false);
  const [patientBills, setPatientBills] = useState<PatientBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedPatientBill, setSelectedPatientBill] = useState<PatientBill | null>(null);

  useEffect(() => {
    setSession(getStoredSession());
    const handleStorageChange = () => setSession(getStoredSession());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname]);

  const loadPatientBillsData = async () => {
    setLoadingBills(true);
    try {
      const data = await getPatientBills();
      setPatientBills(data);
    } catch (err) {
      console.error("Failed to load patient bills:", err);
    } finally {
      setLoadingBills(false);
    }
  };

  const openBillsModal = () => {
    setShowPatientBillsModal(true);
    loadPatientBillsData();
  };

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
              <button
                type="button"
                onClick={openBillsModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all shadow-xs"
                title="View My Hospital Invoices & Bills"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>My Hospital Bills</span>
              </button>

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

      {/* Patient Bills & Invoices Modal */}
      {showPatientBillsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">My Hospital Bills & Invoices</h3>
                  <p className="text-[11px] text-on-surface-variant">View itemized medical charges, tax receipts, and payment receipts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadPatientBillsData}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBills ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPatientBillsModal(false);
                    setSelectedPatientBill(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-surface-container"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {loadingBills ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <span>Loading your issued medical invoices...</span>
                </div>
              ) : patientBills.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant max-w-sm mx-auto">
                  <Receipt className="w-10 h-10 text-outline/40 mx-auto mb-2" />
                  <div className="font-bold text-sm text-on-surface">No Hospital Bills Found</div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    When your attending hospital issues an in-patient or discharge bill linked to your registered profile ({session?.email || session?.name}), it will be securely displayed here.
                  </p>
                </div>
              ) : selectedPatientBill ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientBill(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to All Invoices</span>
                  </button>

                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{selectedPatientBill.hospital_name || "Hospital Facility"}</h4>
                      <div className="text-[11px] text-on-surface-variant">{selectedPatientBill.hospital_address}</div>
                      <div className="text-[11px] text-on-surface-variant">Emergency Phone: {selectedPatientBill.hospital_phone}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-primary text-xs">{selectedPatientBill.bill_number}</span>
                      <div className="text-[11px] text-on-surface-variant">
                        {new Date(selectedPatientBill.bill_date).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low font-bold uppercase text-[10px] text-outline">
                        <tr>
                          <th className="p-2.5">Service / Charge</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Unit Rate (₹)</th>
                          <th className="p-2.5 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {selectedPatientBill.items.map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td className="p-2.5 font-semibold text-on-surface">{it.service_name}</td>
                            <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                            <td className="p-2.5 text-right font-mono">₹{it.unit_price.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 text-right font-mono font-bold">₹{it.total_price.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Subtotal:</span>
                        <span className="font-mono font-semibold">₹{selectedPatientBill.subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      {selectedPatientBill.tax_amount > 0 && (
                        <div className="flex justify-between text-on-surface-variant">
                          <span>GST / Taxes:</span>
                          <span className="font-mono font-semibold">₹{selectedPatientBill.tax_amount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {selectedPatientBill.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount:</span>
                          <span className="font-mono font-semibold">-₹{selectedPatientBill.discount_amount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-outline-variant/30 flex justify-between font-bold text-sm text-on-surface">
                        <span>Total Amount:</span>
                        <span className="text-primary">₹{selectedPatientBill.total_amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-emerald-600">
                        <span>Paid:</span>
                        <span>₹{selectedPatientBill.amount_paid.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="pt-1.5 border-t border-outline-variant/30 flex justify-between font-extrabold text-sm text-on-surface">
                        <span>Balance Due:</span>
                        <span className={selectedPatientBill.balance_due > 0 ? "text-amber-600" : "text-emerald-600"}>
                          ₹{selectedPatientBill.balance_due.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary text-xs">{bill.bill_number}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              bill.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : bill.status === "PARTIALLY_PAID"
                                ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {bill.status}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-on-surface mt-1">
                          {bill.hospital_name || "Specialty Hospital Facility"}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          Date: {new Date(bill.bill_date).toLocaleDateString("en-IN")}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <div className="font-extrabold text-sm text-on-surface">
                            ₹{bill.total_amount.toLocaleString("en-IN")}
                          </div>
                          {bill.balance_due > 0 ? (
                            <div className="text-[11px] font-bold text-amber-600">
                              Due: ₹{bill.balance_due.toLocaleString("en-IN")}
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Fully Paid
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPatientBill(bill)}
                          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-105 transition-all shadow-xs"
                        >
                          View Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => {
                  setShowPatientBillsModal(false);
                  setSelectedPatientBill(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
