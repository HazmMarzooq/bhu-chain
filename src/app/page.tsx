"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Scale,
  Landmark,
  FileCheck,
  ArrowRight,
  QrCode,
  Lock,
  Layers,
  FileText,
  UserCheck
} from "lucide-react";

interface PlatformStats {
  totalParcels: number;
  totalEvents: number;
  totalWorkflows: number;
  mortgagedCount: number;
  disputedCount: number;
  recentParcels: Array<{
    ulpin: string;
    district: string;
    village: string;
    surveyNumber: string;
    currentOwnerName: string;
    encumbranceStatus: string;
    disputeStatus: string;
  }>;
}

export default function HomePage() {
  const router = useRouter();
  const [searchUlpin, setSearchUlpin] = useState("");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUlpin.trim()) return;
    router.push(`/verify?ulpin=${encodeURIComponent(searchUlpin.trim())}`);
  };

  const sampleParcels = [
    {
      ulpin: "33-002-001-00101",
      location: "Chennai • Mylapore",
      owner: "K. R. Sundaram",
      type: "CLEAN",
      badge: "Clean Freehold Title",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
    {
      ulpin: "33-015-008-00620",
      location: "Madurai • Melur",
      owner: "P. Muthukumar",
      type: "MORTGAGED",
      badge: "Mortgaged to SBI",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    },
    {
      ulpin: "33-028-014-00840",
      location: "Salem • Attur",
      owner: "D. Venkataraman",
      type: "DISPUTED",
      badge: "Sub-Court Injunction Active",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    },
    {
      ulpin: "33-003-004-00190",
      location: "Kanchipuram • Sriperumbudur",
      owner: "M. Balaji",
      type: "FORGERY_TEST",
      badge: "Interactive Forgery Demo",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-20 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-900/60 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-medium text-blue-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>National Land Records Modernization Pilot • Tamil Nadu</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Bhu-Chain: Blockchain Land Verification for India
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Detect forged deeds, eliminate duplicate land registrations, and verify approved ownership histories in seconds with cryptographic SHA-256 ledger integrity.
            </p>

            {/* Live ULPIN Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row shadow-2xl rounded-xl overflow-hidden bg-white/10 p-1.5 backdrop-blur-md border border-white/20 gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4" />
                  <input
                    type="text"
                    value={searchUlpin}
                    onChange={(e) => setSearchUlpin(e.target.value)}
                    placeholder="Enter 14-digit ULPIN (e.g., 33-002-001-00101)..."
                    className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base transition shadow-md shrink-0"
                >
                  <span>Verify Title</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick Demo Parcel Pills */}
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">
                Or inspect one of these preloaded Tamil Nadu test scenarios:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {sampleParcels.map((p) => (
                  <button
                    key={p.ulpin}
                    onClick={() => router.push(`/verify?ulpin=${p.ulpin}`)}
                    className="inline-flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <span className="font-mono text-blue-300 font-semibold">{p.ulpin}</span>
                    <span className="text-slate-400">•</span>
                    <span>{p.location.split("•")[0]}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${p.badgeColor}`}>
                      {p.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Counter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="border-r border-slate-100 last:border-0 pr-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.totalParcels ?? 10}
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
              Onboarded ULPIN Parcels
            </div>
          </div>

          <div className="border-r border-slate-100 last:border-0 pr-4">
            <div className="text-3xl font-extrabold text-blue-700">
              {loading ? "..." : stats?.totalEvents ?? 24}
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
              Cryptographic Blocks
            </div>
          </div>

          <div className="border-r border-slate-100 last:border-0 pr-4">
            <div className="text-3xl font-extrabold text-amber-600">
              {loading ? "..." : stats?.mortgagedCount ?? 2}
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
              Active Bank Mortgages
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-emerald-600">
              100%
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
              Chain Integrity Validated
            </div>
          </div>
        </div>
      </section>

      {/* 4 Interactive Test Scenarios Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Core Land Governance Test Cases
            </h2>
            <p className="text-sm text-slate-600">
              Click any scenario below to evaluate how Bhu-Chain prevents fraud, blocks disputed transactions, and flags forgeries.
            </p>
          </div>
          <Link
            href="/verify"
            className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Open Full Verification Desk <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {sampleParcels.map((parcel) => (
            <div
              key={parcel.ulpin}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${parcel.badgeColor}`}>
                    {parcel.type}
                  </span>
                  <QrCode className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="font-mono text-sm font-bold text-slate-900">
                  {parcel.ulpin}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {parcel.location}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
                  <div className="text-slate-500">Current Owner:</div>
                  <div className="font-semibold text-slate-800">{parcel.owner}</div>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href={`/verify?ulpin=${parcel.ulpin}`}
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold transition"
                >
                  <span>Inspect & Verify</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Highlights: How It Works */}
      <section className="bg-slate-100 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How Bhu-Chain Eliminates Land Document Fraud
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Replacing opaque paper records with mathematical certainty through a privacy-preserving SHA-256 verification layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                ULPIN & Genesis Baseline
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Parcels are registered with their 14-digit Bhu-Aadhaar ULPIN, survey coordinates, and georeferenced boundary hashes. Revenue Officers approve the initial baseline into Genesis Block #1.
              </p>
              <div className="text-xs text-blue-700 font-semibold flex items-center space-x-1 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero duplicate ULPINs tolerated</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Multi-Party Event Validation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When a sale is drafted, the Sub-Registrar engine verifies that the seller matches the approved owner and that no court disputes or active mortgages exist before appending the `SALE_DEED` block.
              </p>
              <div className="text-xs text-emerald-700 font-semibold flex items-center space-x-1 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Automated encumbrance block</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Zero-Knowledge Deed Verification
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                No raw Aadhaar numbers or scanned deeds are exposed. When citizens or banks verify a deed, its SHA-256 hash is computed and matched against the immutable on-chain document hash.
              </p>
              <div className="text-xs text-indigo-700 font-semibold flex items-center space-x-1 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Immediate 1-bit forgery detection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Role Gateways Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Dedicated Role-Based Portals
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Experience the system from the perspective of each stakeholder with pre-configured demo credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Citizen */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Citizen Property Locker</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Search parcels by ULPIN, scan QR verification tokens, inspect chain history, and draft sale deed requests.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">citizen@bhu-chain.gov.in</span>
              <Link
                href="/citizen"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Sub-Registrar */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sub-Registrar Office</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verify title authenticity, enforce seller-owner matching, check mortgages, and register signed sale deeds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">registrar@bhu-chain.gov.in</span>
              <Link
                href="/registrar"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Revenue Officer */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Revenue Officer / Tehsildar</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Approve mutations, update land records, flag active court disputes/liens, and record boundary corrections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">revenue@bhu-chain.gov.in</span>
              <Link
                href="/revenue"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bank Officer */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Bank Officer Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verify collateral before loan sanction, record mortgage encumbrances, and approve pledge release upon repayment.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">bank@bhu-chain.gov.in</span>
              <Link
                href="/bank"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Auditor */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Independent Auditor / C&AG</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect system-wide immutable audit trail, validate hash chain integrity, and review unauthorized transaction alerts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">auditor@bhu-chain.gov.in</span>
              <Link
                href="/auditor"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Admin */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">System Administrator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Onboard new parcels with georeferenced survey data, mint Genesis Blocks, and monitor platform health.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">admin@bhu-chain.gov.in</span>
              <Link
                href="/admin"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
