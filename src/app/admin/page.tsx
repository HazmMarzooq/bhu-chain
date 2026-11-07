"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Layers,
  Search,
  Database
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Parcel {
  id: string;
  ulpin: string;
  district: string;
  village: string;
  surveyNumber: string;
  subdivisionNumber: string;
  currentOwnerName: string;
  encumbranceStatus: string;
  disputeStatus: string;
  createdAt: string;
}

export default function AdminPortal() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [ulpin, setUlpin] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [district, setDistrict] = useState("Thanjavur");
  const [taluk, setTaluk] = useState("Kumbakonam");
  const [village, setVillage] = useState("Darasuram");
  const [surveyNumber, setSurveyNumber] = useState("188");
  const [subdivisionNumber, setSubdivisionNumber] = useState("2A");
  const [ownerName, setOwnerName] = useState("K. Swaminathan");
  const [ownerIdentity, setOwnerIdentity] = useState("9988-7766-5544");
  const [documentContent, setDocumentContent] = useState("ORIGINAL ALLOTMENT PATTA RECORD 2024");
  
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleOnboardParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ulpin || !ownerName) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: ulpin.trim(),
          state,
          district,
          taluk,
          village,
          surveyNumber,
          subdivisionNumber,
          ownerName,
          ownerIdentity,
          documentContent,
          registrationOfficeId: "ADMIN-GENESIS-PILOT",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard parcel");
      }

      setFeedback({
        type: "success",
        text: `Parcel ${ulpin} onboarded! Genesis Block #1 minted with parent hash 0000000000000000.`,
      });

      setUlpin("");
      setSurveyNumber("");
      setSubdivisionNumber("");
      fetchParcels();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to onboard parcel",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Parcel Onboarding & Pilot Ledger Management
          </h1>
          <p className="text-xs text-slate-600">
            Enforces strict ULPIN uniqueness, generates QR tokens, and mints initial Genesis Block on-chain.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/blockchain"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-lg transition"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Mined Blocks</span>
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
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Onboarding Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-blue-700" />
            <span>Onboard New Land Parcel (Mint Genesis Block #1)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Register baseline land data. All identity fields will be hashed before storage.
          </p>
        </div>

        <form onSubmit={handleOnboardParcel} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                14-Digit ULPIN (Bhu-Aadhaar)
              </label>
              <input
                type="text"
                required
                value={ulpin}
                onChange={(e) => setUlpin(e.target.value)}
                placeholder="e.g. 33-018-005-00999"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                District
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Taluk
              </label>
              <input
                type="text"
                required
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Village
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Survey Number
              </label>
              <input
                type="text"
                required
                value={surveyNumber}
                onChange={(e) => setSurveyNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Subdivision Number
              </label>
              <input
                type="text"
                required
                value={subdivisionNumber}
                onChange={(e) => setSubdivisionNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Current Approved Owner Full Name
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. K. Swaminathan"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Owner Identity Reference (Hashed with HMAC-SHA256)
              </label>
              <input
                type="text"
                required
                value={ownerIdentity}
                onChange={(e) => setOwnerIdentity(e.target.value)}
                placeholder="e.g. 9988-7766-5544"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Initial Baseline Document / Patta Text
            </label>
            <input
              type="text"
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !ulpin || !ownerName}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{submitting ? "Minting Genesis Block..." : "Onboard Parcel & Mint Genesis Block"}</span>
          </button>
        </form>
      </div>

      {/* Directory of Onboarded Parcels */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Registered Parcels on Ledger ({parcels.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            SQLite Database: prisma/dev.db
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading directory...</div>
        ) : parcels.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No parcels onboarded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">ULPIN</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Survey / Subdiv</th>
                  <th className="py-2.5 px-3">Approved Owner</th>
                  <th className="py-2.5 px-3">Encumbrance</th>
                  <th className="py-2.5 px-3">Dispute</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parcels.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {p.ulpin}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.village}, {p.district}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {p.surveyNumber} / {p.subdivisionNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {p.currentOwnerName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.encumbranceStatus === "MORTGAGED"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {p.encumbranceStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.disputeStatus === "ACTIVE_DISPUTE"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {p.disputeStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/verify?ulpin=${p.ulpin}`}
                        className="text-blue-700 hover:underline font-semibold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
