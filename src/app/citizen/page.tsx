"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ShieldCheck,
  Send,
  FileText,
  AlertCircle,
  CheckCircle2,
  QrCode,
  ArrowRight,
  Clock,
  Download
} from "lucide-react";
import { formatDate, truncateHash } from "@/lib/utils";

interface Parcel {
  id: string;
  ulpin: string;
  state: string;
  district: string;
  taluk: string;
  village: string;
  surveyNumber: string;
  subdivisionNumber: string;
  currentOwnerName: string;
  encumbranceStatus: string;
  disputeStatus: string;
  qrCodeUrl: string;
}

interface WorkflowItem {
  id: string;
  ulpin: string;
  workflowType: string;
  status: string;
  initiatorName: string;
  payload: string;
  createdAt: string;
}

export default function CitizenPortal() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initiate sale state
  const [selectedUlpin, setSelectedUlpin] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerIdentity, setBuyerIdentity] = useState("");
  const [deedText, setDeedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, wRes] = await Promise.all([
        fetch("/api/parcels?district=Chennai"),
        fetch("/api/workflows?status=PENDING_REGISTRAR"),
      ]);
      const pData = await pRes.json();
      const wData = await wRes.json();

      setParcels(pData.parcels || []);
      setWorkflows(wData.requests || []);
      if (pData.parcels && pData.parcels.length > 0) {
        setSelectedUlpin(pData.parcels[0].ulpin);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUlpin || !buyerName) return;

    setSubmitting(true);
    setActionMessage(null);

    try {
      const chosen = parcels.find((p) => p.ulpin === selectedUlpin);
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: selectedUlpin,
          workflowType: "SALE",
          sellerName: chosen?.currentOwnerName || "K. R. Sundaram",
          buyerName,
          buyerIdentity: buyerIdentity || `BUYER-ID-${Date.now()}`,
          documentContent: deedText || `SALE DEED FOR ${selectedUlpin} TO ${buyerName}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate sale deed");
      }

      setActionMessage({
        type: "success",
        text: `Sale deed draft for ULPIN ${selectedUlpin} submitted to Sub-Registrar queue. Tracking ID: ${data.workflow.id}`,
      });
      setBuyerName("");
      setBuyerIdentity("");
      setDeedText("");
      loadData();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to submit request",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded">
            <Users className="w-3.5 h-3.5" />
            <span>Citizen Property Locker</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Registered Property Portfolio
          </h1>
          <p className="text-xs text-slate-600">
            Citizen: <strong>K. R. Sundaram</strong> • Mylapore, Chennai • Digilocker & Bhu-Aadhaar Integrated
          </p>
        </div>

        <Link
          href="/verify"
          className="inline-flex items-center space-x-2 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg transition"
        >
          <Search className="w-4 h-4" />
          <span>Public Title Search</span>
        </Link>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Owned Parcels Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          Your Approved Land Parcels
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border">Loading parcels...</div>
        ) : parcels.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border">No registered parcels found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {parcels.map((parcel) => (
              <div
                key={parcel.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">ULPIN</span>
                      <h3 className="font-mono text-base font-bold text-slate-900">
                        {parcel.ulpin}
                      </h3>
                      <div className="text-xs text-slate-500">
                        {parcel.village}, {parcel.taluk}, {parcel.district}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        parcel.encumbranceStatus === "MORTGAGED"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}>
                        {parcel.encumbranceStatus}
                      </span>
                      {parcel.disputeStatus === "ACTIVE_DISPUTE" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-100 text-rose-800 border-rose-300">
                          DISPUTED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Survey No:</span>{" "}
                      <span className="font-mono font-semibold">{parcel.surveyNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Subdiv:</span>{" "}
                      <span className="font-mono font-semibold">{parcel.subdivisionNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Owner:</span>{" "}
                      <span className="font-semibold">{parcel.currentOwnerName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <Link
                    href={`/verify?ulpin=${parcel.ulpin}`}
                    className="flex-1 text-center py-2 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                  >
                    View Ledger & QR
                  </Link>
                  <button
                    onClick={() => setSelectedUlpin(parcel.ulpin)}
                    className="py-2 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition"
                  >
                    Draft Sale Deed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sale Deed Drafting Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Initiate Sale Deed Request</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Draft a sale agreement for your unencumbered, non-disputed parcel. The request will be submitted to the Sub-Registrar Office for legal identity check and blockchain deed registration.
          </p>
        </div>

        <form onSubmit={handleInitiateSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Your Parcel (ULPIN)
              </label>
              <select
                value={selectedUlpin}
                onChange={(e) => setSelectedUlpin(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {parcels.map((p) => (
                  <option key={p.ulpin} value={p.ulpin}>
                    {p.ulpin} ({p.village}, {p.surveyNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Purchaser / Buyer Full Name
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. S. Meenakshi Sundaram"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Buyer Identification Code / Aadhaar HMAC (Optional for demo)
            </label>
            <input
              type="text"
              value={buyerIdentity}
              onChange={(e) => setBuyerIdentity(e.target.value)}
              placeholder="e.g. AADHAAR-HMAC-SHA256 (Never raw Aadhaar)"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Sale Deed Agreement Text / Consideration Terms
            </label>
            <textarea
              rows={3}
              value={deedText}
              onChange={(e) => setDeedText(e.target.value)}
              placeholder="Enter agreement clauses, agreed consideration value, boundaries..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedUlpin || !buyerName}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Submitting Draft..." : "Submit to Sub-Registrar Queue"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
