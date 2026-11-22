"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  X,
  IndianRupee,
  RefreshCw,
  Trash2,
  DollarSign,
  User,
  Calendar,
  ShieldCheck,
  Receipt,
  ArrowRight
} from "lucide-react";
import {
  getHospitalBillingMetrics,
  getHospitalBills,
  createPatientBill,
  getHospitalBillDetail,
  cancelHospitalBill,
  recordBillPayment,
  getHospitalServices,
  PatientBill,
  HospitalBillingMetrics,
  HospitalService,
  UserSession
} from "@/lib/api";

interface Props {
  session: UserSession | null;
}

export default function BillingManagementTab({ session }: Props) {
  const [metrics, setMetrics] = useState<HospitalBillingMetrics | null>(null);
  const [bills, setBills] = useState<PatientBill[]>([]);
  const [catalogueServices, setCatalogueServices] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createBillForm, setCreateBillForm] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    admission_date: "",
    discharge_date: "",
    due_date: "",
    tax_amount: 0,
    discount_amount: 0,
    notes: "",
    items: [
      { service_id: undefined as number | undefined, service_name: "", category: "Room and Bed Charges", quantity: 1, unit_price: 1500, notes: "" }
    ]
  });

  // Record Payment Modal
  const [paymentBill, setPaymentBill] = useState<PatientBill | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: "UPI",
    transaction_reference: "",
    notes: ""
  });

  // Invoice Print View Modal
  const [selectedInvoice, setSelectedInvoice] = useState<PatientBill | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    loadBillingData();
    loadCatalogue();
  }, [statusFilter]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [metricsData, billsData] = await Promise.all([
        getHospitalBillingMetrics(),
        getHospitalBills({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          search: search.trim() ? search.trim() : undefined
        })
      ]);
      setMetrics(metricsData);
      setBills(billsData);
    } catch (err) {
      console.error("Error loading billing data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCatalogue = async () => {
    try {
      const services = await getHospitalServices({ status_filter: "PUBLISHED" });
      setCatalogueServices(services);
    } catch (err) {
      console.error("Error loading catalogue services:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBillingData();
  };

  const openCreateBill = () => {
    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const initialItem = catalogueServices.length > 0 && catalogueServices[0].current_price
      ? {
          service_id: catalogueServices[0].id,
          service_name: catalogueServices[0].name,
          category: catalogueServices[0].category,
          quantity: 1,
          unit_price: catalogueServices[0].current_price.price,
          notes: ""
        }
      : {
          service_id: undefined,
          service_name: "General Ward Admission",
          category: "Room and Bed Charges",
          quantity: 1,
          unit_price: 1500,
          notes: ""
        };

    setCreateBillForm({
      patient_name: "",
      patient_phone: "",
      patient_email: "",
      admission_date: today,
      discharge_date: today,
      due_date: due,
      tax_amount: 0,
      discount_amount: 0,
      notes: "Standard hospital discharge and care invoice.",
      items: [initialItem]
    });
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    setCreateBillForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { service_id: undefined, service_name: "", category: "Other Services", quantity: 1, unit_price: 500, notes: "" }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (createBillForm.items.length <= 1) return;
    setCreateBillForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCatalogueSelect = (index: number, serviceId: number) => {
    const srv = catalogueServices.find((s) => s.id === serviceId);
    if (!srv) return;

    setCreateBillForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        service_id: srv.id,
        service_name: srv.name,
        category: srv.category,
        unit_price: srv.current_price?.price || 0
      };
      return { ...prev, items: newItems };
    });
  };

  const calculateSubtotal = () => {
    return createBillForm.items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return Math.max(0, sub + (Number(createBillForm.tax_amount) || 0) - (Number(createBillForm.discount_amount) || 0));
  };

  const handleCreateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBillForm.patient_name.trim()) {
      alert("Please enter patient name.");
      return;
    }

    try {
      await createPatientBill({
        patient_name: createBillForm.patient_name,
        patient_phone: createBillForm.patient_phone || undefined,
        patient_email: createBillForm.patient_email || undefined,
        admission_date: createBillForm.admission_date ? new Date(createBillForm.admission_date).toISOString() : undefined,
        discharge_date: createBillForm.discharge_date ? new Date(createBillForm.discharge_date).toISOString() : undefined,
        due_date: createBillForm.due_date ? new Date(createBillForm.due_date).toISOString() : undefined,
        tax_amount: Number(createBillForm.tax_amount) || 0,
        discount_amount: Number(createBillForm.discount_amount) || 0,
        notes: createBillForm.notes || undefined,
        items: createBillForm.items.map((it) => ({
          service_id: it.service_id,
          service_name: it.service_name || "Custom Service",
          category: it.category,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          notes: it.notes || undefined
        }))
      });

      setShowCreateModal(false);
      loadBillingData();
    } catch (err: any) {
      alert(err.message || "Failed to create patient bill.");
    }
  };

  const openPaymentModal = (bill: PatientBill) => {
    setPaymentBill(bill);
    setPaymentForm({
      amount: bill.balance_due,
      payment_method: "UPI",
      transaction_reference: "",
      notes: "Counter collection"
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBill) return;
    if (paymentForm.amount <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    try {
      await recordBillPayment(paymentBill.id, {
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        transaction_reference: paymentForm.transaction_reference || undefined,
        notes: paymentForm.notes || undefined
      });

      setPaymentBill(null);
      loadBillingData();
    } catch (err: any) {
      alert(err.message || "Failed to record payment.");
    }
  };

  const openInvoiceView = async (billId: number) => {
    setInvoiceLoading(true);
    try {
      const fullBill = await getHospitalBillDetail(billId);
      setSelectedInvoice(fullBill);
    } catch (err) {
      console.error("Error fetching invoice details:", err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCancelBill = async (billId: number) => {
    if (!confirm("Are you sure you want to cancel this bill? This cannot be undone.")) return;
    try {
      await cancelHospitalBill(billId);
      loadBillingData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel bill.");
    }
  };

  const formatINR = (val?: number) => {
    if (val === undefined || val === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface tracking-tight">Patient Billing & Invoicing</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Generate itemized hospital bills from the catalogue, process payments, and issue printable GST invoices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateBill}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Patient Bill</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">Total Billed</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-on-surface">
              {formatINR(metrics?.total_billed)}
            </span>
            <div className="text-[11px] text-on-surface-variant font-medium mt-1">
              Across {metrics?.total_bills ?? 0} invoices
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Total Collected
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatINR(metrics?.total_collected)}
            </span>
            <div className="text-[11px] text-on-surface-variant font-medium mt-1">
              {metrics?.paid_bills ?? 0} fully paid, {metrics?.partially_paid_bills ?? 0} partial
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Outstanding Balance
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatINR(metrics?.total_outstanding)}
            </span>
            <div className="text-[11px] text-on-surface-variant font-medium mt-1">
              Pending patient settlement
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Overdue Invoices
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {metrics?.overdue_bills ?? 0}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Past due date</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bill number, patient name, contact phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs text-on-surface font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">Issued</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={() => {
              setRefreshing(true);
              loadBillingData();
            }}
            className="p-2 rounded-xl border border-outline-variant/50 hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-on-surface">
            <thead className="bg-surface-container-low text-outline font-bold uppercase tracking-wider border-b border-outline-variant/30 text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Bill # / Date</th>
                <th className="px-5 py-3.5">Patient Details</th>
                <th className="px-5 py-3.5 text-right">Total Amount</th>
                <th className="px-5 py-3.5 text-right">Amount Paid</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      <span>Loading patient bills...</span>
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-outline/50" />
                      <span className="font-semibold text-sm text-on-surface">No billing records found</span>
                      <span className="text-xs">
                        Click "Create Patient Bill" to issue a new medical bill for an admitted or outpatient individual.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  return (
                    <tr key={bill.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sm font-mono text-primary">{bill.bill_number}</div>
                        <div className="text-[11px] text-on-surface-variant">
                          {new Date(bill.bill_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sm text-on-surface">{bill.patient_name}</div>
                        <div className="text-[11px] font-mono text-on-surface-variant">
                          {bill.patient_phone || "No phone"} • {bill.patient_email || "No email"}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-sm text-on-surface">
                        {formatINR(bill.total_amount)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(bill.amount_paid)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-sm text-on-surface">
                        {bill.balance_due > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">{formatINR(bill.balance_due)}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">₹0.00</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {bill.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        ) : bill.status === "PARTIALLY_PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            Partial
                          </span>
                        ) : bill.status === "OVERDUE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Overdue
                          </span>
                        ) : bill.status === "CANCELLED" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-outline">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            Issued
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openInvoiceView(bill.id)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="View / Print Official Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {bill.balance_due > 0 && bill.status !== "CANCELLED" && (
                            <button
                              onClick={() => openPaymentModal(bill)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:brightness-105 transition-all shadow-xs"
                            >
                              Record Payment
                            </button>
                          )}

                          {bill.amount_paid === 0 && bill.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancelBill(bill.id)}
                              className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                              title="Cancel Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL: CREATE PATIENT BILL ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBillSubmit}
            className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">Generate Patient Invoice</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Patient Basic Information */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-outline">Patient Details</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-on-surface">Patient Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Chandra Sharma"
                      value={createBillForm.patient_name}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, patient_name: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={createBillForm.patient_phone}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, patient_phone: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface">Patient Email</label>
                    <input
                      type="email"
                      placeholder="e.g. patient@gmail.com"
                      value={createBillForm.patient_email}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, patient_email: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="font-bold text-on-surface">Admission Date</label>
                    <input
                      type="date"
                      value={createBillForm.admission_date}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, admission_date: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface">Discharge Date</label>
                    <input
                      type="date"
                      value={createBillForm.discharge_date}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, discharge_date: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface">Due Date</label>
                    <input
                      type="date"
                      value={createBillForm.due_date}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, due_date: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-outline">Itemized Medical Services</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {createBillForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 grid grid-cols-12 gap-2.5 items-end"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <label className="font-bold text-[11px] text-on-surface">Catalogue Service</label>
                        <select
                          value={item.service_id || ""}
                          onChange={(e) => handleCatalogueSelect(idx, parseInt(e.target.value))}
                          className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                        >
                          <option value="">-- Custom Item or Pick Catalogue --</option>
                          {catalogueServices.map((cs) => (
                            <option key={cs.id} value={cs.id}>
                              {cs.name} ({formatINR(cs.current_price?.price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-12 sm:col-span-3">
                        <label className="font-bold text-[11px] text-on-surface">Item Description *</label>
                        <input
                          type="text"
                          value={item.service_name}
                          onChange={(e) => {
                            const newItems = [...createBillForm.items];
                            newItems[idx].service_name = e.target.value;
                            setCreateBillForm({ ...createBillForm, items: newItems });
                          }}
                          placeholder="e.g. ICU Bay Monitoring"
                          className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                          required
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="font-bold text-[11px] text-on-surface">Qty / Days</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...createBillForm.items];
                            newItems[idx].quantity = parseFloat(e.target.value) || 1;
                            setCreateBillForm({ ...createBillForm, items: newItems });
                          }}
                          className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface font-semibold"
                          required
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-2">
                        <label className="font-bold text-[11px] text-on-surface">Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => {
                            const newItems = [...createBillForm.items];
                            newItems[idx].unit_price = parseFloat(e.target.value) || 0;
                            setCreateBillForm({ ...createBillForm, items: newItems });
                          }}
                          className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface font-semibold"
                          required
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={createBillForm.items.length <= 1}
                          className="p-2 rounded-lg text-outline hover:text-error disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculations */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-on-surface">Subtotal (₹)</label>
                    <div className="text-base font-extrabold text-on-surface mt-1.5">
                      {formatINR(calculateSubtotal())}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-on-surface">Taxes / GST (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createBillForm.tax_amount}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, tax_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface">Concession / Discount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createBillForm.discount_amount}
                      onChange={(e) => setCreateBillForm({ ...createBillForm, discount_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                  <span className="font-bold text-sm text-on-surface">Total Payable (INR)</span>
                  <span className="text-xl font-extrabold text-primary">
                    {formatINR(calculateTotal())}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface">Clinical / Billing Notes</label>
                <textarea
                  rows={2}
                  value={createBillForm.notes}
                  onChange={(e) => setCreateBillForm({ ...createBillForm, notes: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg border border-outline-variant/50 text-xs bg-surface"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm"
              >
                Issue Official Bill
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL: RECORD PAYMENT ===================== */}
      {paymentBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-on-surface">Record Patient Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentBill(null)}
                className="p-1 rounded-lg hover:bg-surface-container"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low text-xs space-y-1">
              <div className="font-bold text-sm text-on-surface">{paymentBill.patient_name}</div>
              <div className="font-mono text-primary font-bold">{paymentBill.bill_number}</div>
              <div className="flex justify-between pt-1">
                <span className="text-on-surface-variant">Outstanding Balance:</span>
                <span className="font-extrabold text-amber-600 text-sm">{formatINR(paymentBill.balance_due)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={paymentBill.balance_due}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-sm font-bold bg-surface"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-on-surface">Payment Mode</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-semibold"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash Collection</option>
                  <option value="INSURANCE">TPA / Health Insurance Claim</option>
                  <option value="NET_BANKING">Net Banking / NEFT / RTGS</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-on-surface">Transaction Ref / UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-TXN-9812458921"
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface">Collection Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Counter deposit by patient's guardian"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-outline-variant/50 text-xs bg-surface"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setPaymentBill(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL: PRINTABLE OFFICIAL INVOICE ===================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-outline-variant/40 space-y-6 animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-bold text-base text-on-surface">Official Medical Invoice</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-105 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-xs">
              {/* Hospital Letterhead */}
              <div className="flex items-start justify-between pb-4 border-b border-outline-variant/40">
                <div>
                  <h2 className="text-xl font-bold text-on-surface tracking-tight">
                    {selectedInvoice.hospital_name || session?.hospital_name || "SmartCare Specialty Hospital"}
                  </h2>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {selectedInvoice.hospital_address || "Clinical Operations Corridor"}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    Emergency: {selectedInvoice.hospital_phone || "+91-98765-43210"}
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-primary-container text-on-primary-container">
                    {selectedInvoice.status}
                  </span>
                  <div className="font-mono font-bold text-sm text-on-surface mt-2">
                    {selectedInvoice.bill_number}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    Date: {new Date(selectedInvoice.bill_date).toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Patient & Hospital Reference Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low">
                <div>
                  <div className="text-[11px] font-bold uppercase text-outline">Billed To</div>
                  <div className="font-bold text-sm text-on-surface mt-0.5">{selectedInvoice.patient_name}</div>
                  <div className="text-xs text-on-surface-variant">Phone: {selectedInvoice.patient_phone || "N/A"}</div>
                  <div className="text-xs text-on-surface-variant">Email: {selectedInvoice.patient_email || "N/A"}</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase text-outline">Treatment Period</div>
                  <div className="text-xs text-on-surface mt-0.5">
                    Admission: {selectedInvoice.admission_date ? new Date(selectedInvoice.admission_date).toLocaleDateString("en-IN") : "Day Care"}
                  </div>
                  <div className="text-xs text-on-surface">
                    Discharge: {selectedInvoice.discharge_date ? new Date(selectedInvoice.discharge_date).toLocaleDateString("en-IN") : "Ongoing"}
                  </div>
                  <div className="text-xs text-error font-semibold mt-1">
                    Payment Due: {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString("en-IN") : "Immediate"}
                  </div>
                </div>
              </div>

              {/* Itemized Services Breakdown */}
              <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low font-bold uppercase text-[11px] text-outline border-b border-outline-variant/30">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Item / Service</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Rate (₹)</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {selectedInvoice.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-3 font-mono text-on-surface-variant">{idx + 1}</td>
                        <td className="p-3 font-semibold text-on-surface">{it.service_name}</td>
                        <td className="p-3 text-on-surface-variant">{it.category || "General"}</td>
                        <td className="p-3 text-center font-mono">{it.quantity}</td>
                        <td className="p-3 text-right font-mono">{formatINR(it.unit_price)}</td>
                        <td className="p-3 text-right font-mono font-bold">{formatINR(it.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Calculations */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{formatINR(selectedInvoice.subtotal)}</span>
                  </div>

                  {selectedInvoice.tax_amount > 0 && (
                    <div className="flex justify-between text-on-surface-variant">
                      <span>GST / Service Tax:</span>
                      <span className="font-mono font-semibold">{formatINR(selectedInvoice.tax_amount)}</span>
                    </div>
                  )}

                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Concession / Discount:</span>
                      <span className="font-mono font-semibold">-{formatINR(selectedInvoice.discount_amount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-outline-variant/30 flex justify-between font-bold text-sm text-on-surface">
                    <span>Total Amount:</span>
                    <span className="text-primary">{formatINR(selectedInvoice.total_amount)}</span>
                  </div>

                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Paid to Date:</span>
                    <span>{formatINR(selectedInvoice.amount_paid)}</span>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/30 flex justify-between font-extrabold text-base text-on-surface">
                    <span>Balance Due:</span>
                    <span className={selectedInvoice.balance_due > 0 ? "text-amber-600" : "text-emerald-600"}>
                      {formatINR(selectedInvoice.balance_due)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Receipts History */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-outline">Recorded Payment Receipts</div>
                  <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low text-[10px] uppercase font-bold text-outline">
                        <tr>
                          <th className="p-2.5">Receipt #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Method</th>
                          <th className="p-2.5">Reference</th>
                          <th className="p-2.5 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {selectedInvoice.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2.5 font-mono font-bold text-primary">{p.receipt_number}</td>
                            <td className="p-2.5 text-on-surface-variant">
                              {new Date(p.payment_date).toLocaleDateString("en-IN")}
                            </td>
                            <td className="p-2.5 font-semibold text-on-surface">{p.payment_method}</td>
                            <td className="p-2.5 font-mono text-on-surface-variant">{p.transaction_reference || "Counter Cash"}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                              {formatINR(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Hospital Certification Stamp */}
              <div className="pt-6 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-on-surface-variant">
                <div>
                  <div>Computer Generated Healthcare Invoice. Valid without physical signature.</div>
                  <div className="font-mono mt-0.5">SmartCare Network Hash: #SC-INV-{selectedInvoice.id}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-on-surface">Accounts & Billing Directorate</div>
                  <div>SmartCare Healthcare Federation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
