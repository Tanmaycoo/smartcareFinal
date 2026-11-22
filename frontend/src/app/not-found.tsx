import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-on-surface mb-2">404 - Page Not Found</h1>
      <p className="text-xs text-on-surface-variant max-w-sm mb-6">
        The requested medical page, dashboard view, or resource does not exist or has been relocated.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-105 transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Citizen Portal</span>
      </Link>
    </div>
  );
}
