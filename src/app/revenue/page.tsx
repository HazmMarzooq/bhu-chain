"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Layers,
  Search,
  PlusCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  };
}

export default function RevenuePortal() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dispute form state
  const [disputeUlpin, setDisputeUlpin] = useState("");
  const [disputeRemarks, setDisputeRemarks] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows?status=PENDING_REVENUE");
      const data = await res.json();
      setWorkflows(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/workflows/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          remarks: action === "APPROVE" ? "Mutation sanctioned and title transferred" : "Mutation rejected",
          registrationOfficeId: "REV-OFFICE-MDU",
          approverDigitalId: "REV-OFFICER-4491",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setFeedback({
        type: "success",
        text: data.message || `Mutation successfully approved and recorded on blockchain!`,
      });

      fetchWorkflows();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to process mutation",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleFlagDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeUlpin || !disputeRemarks) return;

    setDisputeSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: disputeUlpin.trim(),
          workflowType: "DISPUTE",
          remarks: disputeRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to flag dispute");
      }

      setFeedback({
        type: "success",
        text: `Court dispute successfully flagged on ULPIN ${disputeUlpin}. Sale registrations are now locked.`,
      });
      setDisputeUlpin("");
      setDisputeRemarks("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to flag dispute",
      });
    } finally {
      setDisputeSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
            <Scale className="w-3.5 h-3.5" />
            <span>Revenue Officer / Tehsildar Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Mutation Sanction & Land Dispute Registry
          </h1>
          <p className="text-xs text-slate-600">
            Jurisdiction: <strong>Madurai & Regional Taluk Revenue Administration</strong> • Patta / RoR Final Authority
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/verify"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify Parcel</span>
          </Link>
          <Link
            href="/blockchain"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-2 rounded-lg transition"
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

      {/* Pending Mutation Applications Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Pending Mutation Approvals ({workflows.length})
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
            Loading mutation queue...
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white rounded-xl border space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-bold text-slate-800">All Mutations Up to Date</div>
            <p className="text-xs text-slate-500">
              No registered sale deeds are currently awaiting Revenue Officer mutation approval.
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
                      <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
                        MUTATION PENDING
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        ULPIN: {wf.ulpin}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Approved by Sub-Registrar: {formatDate(wf.createdAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Current Registered Owner:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {parsedPayload.sellerName || "N/A"}
                      </span>
                    </div>

                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                      <span className="text-emerald-900 block font-medium">New Transferee to Mutate:</span>
                      <span className="font-bold text-emerald-900 text-sm">
                        {parsedPayload.buyerName || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => handleAction(wf.id, "REJECT")}
                      disabled={processingId === wf.id}
                      className="px-4 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                    >
                      Reject Mutation
                    </button>
                    <button
                      onClick={() => handleAction(wf.id, "APPROVE")}
                      disabled={processingId === wf.id}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{processingId === wf.id ? "Sealing On-Chain..." : "Sanction Mutation & Transfer Title"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Flag Dispute / Lis Pendens Tool */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Flag Court Dispute / Lis Pendens Injunction</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Record a court injunction, pending title suit, or land revenue dispute. Flagging immediately halts sale registrations across all Sub-Registrar offices.
          </p>
        </div>

        <form onSubmit={handleFlagDispute} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target ULPIN
              </label>
              <input
                type="text"
                required
                value={disputeUlpin}
                onChange={(e) => setDisputeUlpin(e.target.value)}
                placeholder="e.g. 33-028-014-00840"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Court Case / Revenue Case Reference
              </label>
              <input
                type="text"
                required
                value={disputeRemarks}
                onChange={(e) => setDisputeRemarks(e.target.value)}
                placeholder="e.g. OS 112/2024 Sub-Court Salem: Injunction against alienating property"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={disputeSubmitting || !disputeUlpin || !disputeRemarks}
            className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition flex items-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{disputeSubmitting ? "Locking Parcel..." : "Apply Dispute Lock to Blockchain"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
