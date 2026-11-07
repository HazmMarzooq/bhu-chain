"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  Unlock,
  Layers,
  ArrowRight
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Parcel {
  id: string;
  ulpin: string;
  district: string;
  village: string;
  surveyNumber: string;
  currentOwnerName: string;
  encumbranceStatus: string;
  disputeStatus: string;
}

export default function BankPortal() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mortgage form state
  const [mortgageUlpin, setMortgageUlpin] = useState("");
  const [bankName, setBankName] = useState("State Bank of India");
  const [loanAccountNumber, setLoanAccountNumber] = useState("");
  const [sanctionAmount, setSanctionAmount] = useState("");
  const [submittingMortgage, setSubmittingMortgage] = useState(false);

  // Release pledge state
  const [releaseUlpin, setReleaseUlpin] = useState("");
  const [nocReference, setNocReference] = useState("");
  const [submittingRelease, setSubmittingRelease] = useState(false);

  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parcels");
      const data = await res.json();
      setParcels(data.parcels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMortgage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mortgageUlpin || !loanAccountNumber) return;

    setSubmittingMortgage(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: mortgageUlpin.trim(),
          workflowType: "MORTGAGE",
          bankName,
          loanAccountNumber,
          sanctionAmount: sanctionAmount || "INR 35,00,000",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record mortgage");
      }

      setFeedback({
        type: "success",
        text: `Mortgage charge recorded on ULPIN ${mortgageUlpin}. Encumbrance status updated on blockchain.`,
      });
      setMortgageUlpin("");
      setLoanAccountNumber("");
      setSanctionAmount("");
      fetchParcels();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to record mortgage",
      });
    } finally {
      setSubmittingMortgage(false);
    }
  };

  const handleReleasePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseUlpin || !nocReference) return;

    setSubmittingRelease(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: releaseUlpin.trim(),
          workflowType: "PLEDGE_RELEASE",
          bankName,
          nocReference,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to release pledge");
      }

      setFeedback({
        type: "success",
        text: `Charge satisfied. Encumbrance released on ULPIN ${releaseUlpin}. Parcel is now unencumbered on blockchain.`,
      });
      setReleaseUlpin("");
      setNocReference("");
      fetchParcels();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to release pledge",
      });
    } finally {
      setSubmittingRelease(false);
    }
  };

  const mortgagedParcels = parcels.filter((p) => p.encumbranceStatus === "MORTGAGED");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
            <Landmark className="w-3.5 h-3.5" />
            <span>Bank & Financial Institution Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Collateral Verification & Mortgage Charge Management
          </h1>
          <p className="text-xs text-slate-600">
            Institution: <strong>State Bank of India (SBI)</strong> • Multi-Mortgage Fraud Prevention Active
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/verify"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Instant Collateral Due-Diligence</span>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Two Column Forms: Record Mortgage vs Release Pledge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form 1: Record Mortgage */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <span>Record Bank Mortgage Lien</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Secure land parcel as collateral for housing or commercial loans. Blocks any sale deed registration until released.
            </p>
          </div>

          <form onSubmit={handleRecordMortgage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target Land Parcel ULPIN
              </label>
              <input
                type="text"
                required
                value={mortgageUlpin}
                onChange={(e) => setMortgageUlpin(e.target.value)}
                placeholder="e.g. 33-002-001-00101"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lending Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Loan Account Reference
                </label>
                <input
                  type="text"
                  required
                  value={loanAccountNumber}
                  onChange={(e) => setLoanAccountNumber(e.target.value)}
                  placeholder="e.g. SBI-HL-2024-998"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Sanctioned Loan Consideration Amount
              </label>
              <input
                type="text"
                value={sanctionAmount}
                onChange={(e) => setSanctionAmount(e.target.value)}
                placeholder="e.g. INR 45,00,000"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingMortgage || !mortgageUlpin || !loanAccountNumber}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{submittingMortgage ? "Recording Lien..." : "Record Mortgage on Blockchain"}</span>
            </button>
          </form>
        </div>

        {/* Form 2: Release Pledge */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Unlock className="w-5 h-5 text-emerald-600" />
              <span>Release Pledge (Satisfaction of Charge)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Issue an unencumbrance certificate after borrower has fully discharged loan liability.
            </p>
          </div>

          <form onSubmit={handleReleasePledge} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Mortgaged Parcel (ULPIN)
              </label>
              {mortgagedParcels.length > 0 ? (
                <select
                  value={releaseUlpin}
                  onChange={(e) => setReleaseUlpin(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Mortgaged Parcel --</option>
                  {mortgagedParcels.map((p) => (
                    <option key={p.ulpin} value={p.ulpin}>
                      {p.ulpin} ({p.currentOwnerName} • {p.district})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={releaseUlpin}
                  onChange={(e) => setReleaseUlpin(e.target.value)}
                  placeholder="e.g. 33-015-008-00620"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bank NOC / Loan Closure Certificate Reference
              </label>
              <input
                type="text"
                required
                value={nocReference}
                onChange={(e) => setNocReference(e.target.value)}
                placeholder="e.g. SBI-NOC-2024-PAID-IN-FULL"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRelease || !releaseUlpin || !nocReference}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{submittingRelease ? "Releasing Charge..." : "Release Pledge & Mark Freehold"}</span>
            </button>
          </form>

          {/* Currently Encumbered Parcels Preview */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Active Mortgages Monitored: {mortgagedParcels.length}
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {mortgagedParcels.map((p) => (
                <div
                  key={p.ulpin}
                  onClick={() => setReleaseUlpin(p.ulpin)}
                  className="p-2 rounded bg-slate-50 hover:bg-emerald-50 border border-slate-200 cursor-pointer text-xs flex justify-between items-center transition"
                >
                  <span className="font-mono font-bold text-slate-800">{p.ulpin}</span>
                  <span className="text-slate-500">{p.currentOwnerName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
