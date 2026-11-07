"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Clock,
  ArrowRight,
  Layers,
  Search,
  Lock
} from "lucide-react";
import { formatDate, truncateHash } from "@/lib/utils";

interface WorkflowItem {
  id: string;
  ulpin: string;
  workflowType: string;
  status: string;
  initiatorName: string;
  payload: string;
  createdAt: string;
  parcel?: {
    district: string;
    village: string;
    currentOwnerName: string;
    encumbranceStatus: string;
    disputeStatus: string;
  };
}

export default function RegistrarPortal() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows?status=PENDING_REGISTRAR");
      const data = await res.json();
      setWorkflows(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVE" | "REJECT", remarks?: string) => {
    setProcessingId(id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/workflows/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          remarks: remarks || (action === "APPROVE" ? "Sale deed verified and signed" : "Registration rejected"),
          registrationOfficeId: "SR-TN-CHE-001",
          approverDigitalId: "SR-OFFICER-7741",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setFeedback({
        type: "success",
        text: data.message || `Request successfully ${action === "APPROVE" ? "registered & forwarded to Revenue Officer" : "rejected"}`,
      });

      fetchWorkflows();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to process transaction",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
            <Building2 className="w-3.5 h-3.5" />
            <span>Sub-Registrar Office Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Sale Deed Registration & Verification Queue
          </h1>
          <p className="text-xs text-slate-600">
            Jurisdiction: <strong>Chennai Central / Sriperumbudur Registration Zone</strong> • Digital Signatures Active
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/verify"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify Deed Hashes</span>
          </Link>
          <Link
            href="/blockchain"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-lg transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ledger Explorer</span>
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

      {/* Verification Rules Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Automated Statutory Checks Enforced:</div>
            <div className="text-slate-400 mt-0.5">
              1. Seller must match current approved owner • 2. Dispute status must be NO_DISPUTE • 3. Encumbrance must be UNENCUMBERED
            </div>
          </div>
        </div>
        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[11px] px-2.5 py-1 rounded">
          RULE ENGINE: RIGID
        </span>
      </div>

      {/* Workflows Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Pending Sale Deed Applications ({workflows.length})
          </h2>
          <button
            onClick={fetchWorkflows}
            className="text-xs text-blue-700 hover:underline font-semibold"
          >
            Refresh Queue
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border">
            Loading registration queue...
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-bold text-slate-800">Registration Queue Clear</div>
            <p className="text-xs text-slate-500">
              No pending sale deeds awaiting Sub-Registrar action at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((wf) => {
              let parsedPayload: any = {};
              try {
                parsedPayload = JSON.parse(wf.payload);
              } catch (e) {}

              return (
                <div
                  key={wf.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200">
                        {wf.workflowType}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        ULPIN: {wf.ulpin}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Filed: {formatDate(wf.createdAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Declared Seller:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {parsedPayload.sellerName || "N/A"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Prospective Purchaser:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {parsedPayload.buyerName || "N/A"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Initiated By:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {wf.initiatorName}
                      </span>
                    </div>
                  </div>

                  {parsedPayload.documentContent && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="text-slate-500 font-semibold mb-1">Deed Agreement Preview:</div>
                      <div className="font-mono text-[11px] text-slate-700 line-clamp-3">
                        {parsedPayload.documentContent}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => handleAction(wf.id, "REJECT", "Rejected after verification")}
                      disabled={processingId === wf.id}
                      className="px-4 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleAction(wf.id, "APPROVE")}
                      disabled={processingId === wf.id}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{processingId === wf.id ? "Signing On-Chain..." : "Approve & Sign Sale Deed"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
