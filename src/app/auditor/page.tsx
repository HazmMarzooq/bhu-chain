"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Search,
  RefreshCw,
  Lock,
  ArrowRight
} from "lucide-react";
import { formatDate, truncateHash } from "@/lib/utils";

interface AuditLogItem {
  id: string;
  action: string;
  userEmail: string;
  userRole: string;
  ulpin: string | null;
  status: string;
  ipAddress: string;
  details: string | null;
  createdAt: string;
}

export default function AuditorPortal() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingAll, setValidatingAll] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    status: "PASS" | "FAIL";
    checkedParcels: number;
    totalBlocks: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs?limit=50");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runGlobalIntegrityAudit = async () => {
    setValidatingAll(true);
    setAuditResult(null);

    try {
      // Fetch all parcels
      const pRes = await fetch("/api/parcels");
      const pData = await pRes.json();
      const parcels = pData.parcels || [];

      let totalBlocks = 0;
      let allValid = true;

      // Verify each parcel's chain status
      for (const p of parcels) {
        const cRes = await fetch(`/api/parcels/${p.ulpin}/chain-status`);
        const cData = await cRes.json();
        totalBlocks += cData.totalBlocks || 0;
        if (!cData.valid) {
          allValid = false;
        }
      }

      setAuditResult({
        status: allValid ? "PASS" : "FAIL",
        checkedParcels: parcels.length,
        totalBlocks,
        message: allValid
          ? `All ${parcels.length} parcel chains and ${totalBlocks} blocks verified with 100% mathematical integrity.`
          : `Tampering or hash broken in one or more parcel chains!`,
      });
    } catch (err: any) {
      setAuditResult({
        status: "FAIL",
        checkedParcels: 0,
        totalBlocks: 0,
        message: err.message || "Failed to complete audit",
      });
    } finally {
      setValidatingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Independent Audit Directorate</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            System-Wide Audit Logs & Ledger Validator
          </h1>
          <p className="text-xs text-slate-600">
            Authority: <strong>Comptroller and Auditor General (C&AG) / State Vigilance</strong> • Non-Repudiation Verified
          </p>
        </div>

        <button
          onClick={runGlobalIntegrityAudit}
          disabled={validatingAll}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition flex items-center space-x-2 shadow-sm"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{validatingAll ? "Auditing All Chains..." : "Run Global Chain Integrity Audit"}</span>
        </button>
      </div>

      {/* Global Audit Result Banner */}
      {auditResult && (
        <div
          className={`p-5 rounded-xl border flex items-start space-x-3 text-xs ${
            auditResult.status === "PASS"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          {auditResult.status === "PASS" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold text-sm">
              {auditResult.status === "PASS"
                ? "AUDIT VERIFIED: ALL LEDGER CHAINS PASS INTEGRITY CHECKS"
                : "AUDIT ALERT: CHAIN TAMPERING DETECTED"}
            </div>
            <p>{auditResult.message}</p>
            <div className="text-[11px] font-mono text-slate-600 pt-1">
              Checked Parcels: {auditResult.checkedParcels} • Scanned Blocks: {auditResult.totalBlocks} • Cryptographic Algorithm: SHA-256
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Immutable System Activity & Access Log
            </h2>
            <p className="text-xs text-slate-500">
              Captures all logins, hash verifications, mortgage registrations, and mutation actions.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs text-blue-700 hover:underline flex items-center space-x-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading audit feed...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No audit records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {log.action}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {log.status}
                    </span>
                    {log.ulpin && (
                      <span className="font-mono text-blue-700 font-semibold">
                        ULPIN: {log.ulpin}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <div className="text-slate-600 text-[11px] font-mono">
                      {log.details}
                    </div>
                  )}
                  <div className="text-slate-400 text-[11px]">
                    User: {log.userEmail} ({log.userRole}) • IP: {log.ipAddress}
                  </div>
                </div>

                <div className="text-slate-400 text-[11px] whitespace-nowrap flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
