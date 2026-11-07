"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  QrCode,
  Download,
  Copy,
  ExternalLink,
  Lock,
  ArrowRight,
  Clock,
  Layers,
  FileWarning
} from "lucide-react";
import { truncateHash, formatDate } from "@/lib/utils";

interface BlockchainBlock {
  id: string;
  blockNumber: number;
  ulpin: string;
  eventType: string;
  documentHash: string | null;
  previousHash: string;
  currentHash: string;
  approverDigitalId: string;
  digitalSignature: string;
  timestamp: string;
}

interface ParcelData {
  id: string;
  ulpin: string;
  state: string;
  district: string;
  taluk: string;
  village: string;
  surveyNumber: string;
  subdivisionNumber: string;
  currentOwnerName: string;
  currentOwnerHash: string;
  encumbranceStatus: string;
  disputeStatus: string;
  disputeRemarks: string | null;
  mapReferenceHash: string;
  qrCodeUrl: string;
  lastMutationDate: string;
  blockchainEvents: BlockchainBlock[];
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryUlpin = searchParams.get("ulpin") || "";

  const [inputUlpin, setInputUlpin] = useState(queryUlpin);
  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document verification state
  const [docContent, setDocContent] = useState("");
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    hash: string;
    message: string;
    matchedEvent?: any;
  } | null>(null);
  const [verifyingDoc, setVerifyingDoc] = useState(false);

  // Chain integrity state
  const [chainStatus, setChainStatus] = useState<{
    valid: boolean;
    totalBlocks: number;
    genesisBlockHash: string;
    latestBlockHash: string;
    message?: string;
  } | null>(null);
  const [checkingChain, setCheckingChain] = useState(false);

  useEffect(() => {
    if (queryUlpin) {
      setInputUlpin(queryUlpin);
      fetchParcel(queryUlpin);
    }
  }, [queryUlpin]);

  const fetchParcel = async (ulpinToFetch: string) => {
    if (!ulpinToFetch) return;
    setLoading(true);
    setError(null);
    setParcel(null);
    setVerifyResult(null);
    setChainStatus(null);
    setDocContent("");
    setComputedHash(null);

    try {
      const res = await fetch(`/api/parcels/${encodeURIComponent(ulpinToFetch)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch parcel");
      }
      setParcel(data);
    } catch (err: any) {
      setError(err.message || "Parcel not found on Bhu-Chain ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUlpin.trim()) return;
    router.push(`/verify?ulpin=${encodeURIComponent(inputUlpin.trim())}`);
  };

  // Real-time client-side SHA-256 calculation
  const calculateClientHash = async (text: string) => {
    if (!text) {
      setComputedHash(null);
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setComputedHash(hashHex);
  };

  const handleDocTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDocContent(text);
    calculateClientHash(text);
  };

  const verifyDocumentHash = async () => {
    if (!parcel || !docContent.trim()) return;
    setVerifyingDoc(true);
    try {
      const res = await fetch(`/api/parcels/${parcel.ulpin}/verify-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentContent: docContent }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        hash: computedHash || "ERROR",
        message: err.message || "Verification request failed",
      });
    } finally {
      setVerifyingDoc(false);
    }
  };

  // Sample Authentic & Forged Deed Buttons for Kanchipuram Demo (33-003-004-00190)
  const loadAuthenticDeed = () => {
    const authentic = `SALE DEED AGREEMENT
State: Tamil Nadu
District: Kanchipuram
Sub-Registrar Office: Sriperumbudur SRO
ULPIN: 33-003-004-00190
Survey Number: 45 / Subdivision: 1B
Vendor: K. Ramanathan
Purchaser: M. Balaji
Approved Value: INR 45,00,000
Registered Date: 2024-03-15
Sub-Registrar Digital ID: SR-TN-KAN-004`;

    setDocContent(authentic);
    calculateClientHash(authentic);
    setVerifyResult(null);
  };

  const loadForgedDeed = () => {
    const forged = `SALE DEED AGREEMENT
State: Tamil Nadu
District: Kanchipuram
Sub-Registrar Office: Sriperumbudur SRO
ULPIN: 33-003-004-00190
Survey Number: 45 / Subdivision: 1B
Vendor: K. Ramanathan
Purchaser: S. Fraudster [TAMPERED]
Approved Value: INR 85,00,000 [TAMPERED]
Registered Date: 2024-03-15
Sub-Registrar Digital ID: SR-TN-KAN-004`;

    setDocContent(forged);
    calculateClientHash(forged);
    setVerifyResult(null);
  };

  const runChainIntegrityCheck = async () => {
    if (!parcel) return;
    setCheckingChain(true);
    try {
      const res = await fetch(`/api/parcels/${parcel.ulpin}/chain-status`);
      const data = await res.json();
      setChainStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingChain(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Public Title & Document Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Verify Land Title & Detect Forged Documents
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search any 14-digit ULPIN to inspect approved ownership, encumbrance status, court disputes, and verify deed hashes against the blockchain.
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={inputUlpin}
                onChange={(e) => setInputUlpin(e.target.value)}
                placeholder="Enter ULPIN (e.g. 33-002-001-00101, 33-003-004-00190)..."
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono font-medium"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg text-sm transition shadow-sm shrink-0 flex items-center justify-center space-x-2"
            >
              <span>Search Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick links */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Quick Test Samples:</span>
            <button
              onClick={() => router.push("/verify?ulpin=33-002-001-00101")}
              className="text-blue-600 hover:underline font-mono"
            >
              Chennai (Clean)
            </button>
            <span>•</span>
            <button
              onClick={() => router.push("/verify?ulpin=33-015-008-00620")}
              className="text-amber-600 hover:underline font-mono"
            >
              Madurai (Mortgaged)
            </button>
            <span>•</span>
            <button
              onClick={() => router.push("/verify?ulpin=33-028-014-00840")}
              className="text-rose-600 hover:underline font-mono"
            >
              Salem (Disputed)
            </button>
            <span>•</span>
            <button
              onClick={() => router.push("/verify?ulpin=33-003-004-00190")}
              className="text-purple-600 hover:underline font-mono font-bold"
            >
              Kanchipuram (Forged Deed Demo)
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Querying Bhu-Chain cryptographic ledger...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 flex items-start space-x-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">Record Not Found</h3>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs text-rose-600 mt-2">
              Ensure you have entered a valid registered 14-digit ULPIN from the pilot dataset.
            </p>
          </div>
        </div>
      )}

      {/* Parcel Details Section */}
      {parcel && (
        <div className="space-y-8">
          {/* Top Parcel Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header banner */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400 font-mono">Bhu-Aadhaar / ULPIN</div>
                <div className="text-xl font-bold font-mono tracking-wider text-emerald-400">
                  {parcel.ulpin}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {parcel.disputeStatus === "ACTIVE_DISPUTE" ? (
                  <span className="inline-flex items-center space-x-1.5 bg-rose-900/80 text-rose-200 border border-rose-500 text-xs px-3 py-1 rounded-full font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>LITIGATION / ACTIVE DISPUTE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>NO ACTIVE COURT DISPUTE</span>
                  </span>
                )}

                {parcel.encumbranceStatus === "MORTGAGED" ? (
                  <span className="inline-flex items-center space-x-1.5 bg-amber-900/80 text-amber-200 border border-amber-500 text-xs px-3 py-1 rounded-full font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ENCUMBERED (BANK MORTGAGE)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 bg-slate-800 text-slate-300 border border-slate-700 text-xs px-3 py-1 rounded-full font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>FREEHOLD / UNENCUMBERED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Main parcel content */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Col 1 & 2: Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Administrative & Cadastral Location
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">State</div>
                      <div className="font-semibold text-slate-900">{parcel.state}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">District</div>
                      <div className="font-semibold text-slate-900">{parcel.district}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Taluk</div>
                      <div className="font-semibold text-slate-900">{parcel.taluk}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Village</div>
                      <div className="font-semibold text-slate-900">{parcel.village}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Survey No.</div>
                      <div className="font-semibold text-slate-900 font-mono">{parcel.surveyNumber}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Subdivision</div>
                      <div className="font-semibold text-slate-900 font-mono">{parcel.subdivisionNumber}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-slate-500">Last Mutation Timestamp</div>
                      <div className="font-medium text-slate-800">{formatDate(parcel.lastMutationDate)}</div>
                    </div>
                  </div>
                </div>

                {/* Ownership & Identity Card */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Approved Legal Ownership
                  </h3>
                  <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-blue-900 font-medium">Current Approved Owner</div>
                        <div className="text-lg font-bold text-slate-900">{parcel.currentOwnerName}</div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded border border-blue-300">
                        MUTATION APPROVED
                      </span>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Owner Identity Hash (HMAC-SHA256 • Privacy-Preserved)</div>
                      <div className="font-mono text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 break-all select-all">
                        {parcel.currentOwnerHash}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">GIS Cadastral Map Hash (Shapefile Boundary Polygon)</div>
                      <div className="font-mono text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 break-all select-all">
                        {parcel.mapReferenceHash}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispute Alert Note if any */}
                {parcel.disputeRemarks && (
                  <div className="bg-rose-50 border border-rose-300 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Litigation / Injunction Notice:</span>
                    </div>
                    <p className="text-xs text-rose-900 mt-1 font-mono">{parcel.disputeRemarks}</p>
                    <p className="text-[11px] text-rose-700 mt-2">
                      Statutory Warning: Under Section 52 of the Transfer of Property Act (Lis Pendens), transactions on this parcel are locked pending judicial review.
                    </p>
                  </div>
                )}
              </div>

              {/* Col 3: QR Code & Verification Token */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col items-center justify-between text-center space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bhu-Aadhaar QR Token
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scan for instant mobile title validation
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 inline-block">
                  {parcel.qrCodeUrl ? (
                    <img
                      src={parcel.qrCodeUrl}
                      alt={`QR Code for ${parcel.ulpin}`}
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      QR Generated
                    </div>
                  )}
                </div>

                <div className="w-full space-y-2">
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    ULPIN: {parcel.ulpin}
                  </div>
                  {parcel.qrCodeUrl && (
                    <a
                      href={parcel.qrCodeUrl}
                      download={`bhu-chain-qr-${parcel.ulpin}.png`}
                      className="inline-flex items-center justify-center space-x-1.5 w-full py-2 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR Token</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Document Forgery Verification Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Interactive Cryptographic Deed Verification</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Detect Forged or Altered Land Deeds
                </h2>
                <p className="text-xs text-slate-600">
                  Upload or paste the exact deed text to compute its SHA-256 fingerprint and match against approved Sub-Registrar records.
                </p>
              </div>

              {/* Demo Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={loadAuthenticDeed}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition"
                >
                  Load Authentic Deed
                </button>
                <button
                  onClick={loadForgedDeed}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg transition"
                >
                  Load Forged Deed
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Deed Content / Document Text
                </label>
                <textarea
                  rows={7}
                  value={docContent}
                  onChange={handleDocTextChange}
                  placeholder="Paste legal deed text or click 'Load Authentic Deed' / 'Load Forged Deed' to test..."
                  className="w-full p-3 font-mono text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 text-slate-800"
                />
              </div>

              {/* Computed Realtime Hash */}
              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-slate-700">Client-Computed SHA-256 Hash: </span>
                  <span className="font-mono text-slate-900 font-semibold break-all">
                    {computedHash || "— (No text entered)"}
                  </span>
                </div>
                <button
                  onClick={verifyDocumentHash}
                  disabled={!docContent.trim() || verifyingDoc}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 shrink-0"
                >
                  {verifyingDoc ? "Verifying..." : "Verify Against Ledger"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Verification Result Banner */}
              {verifyResult && (
                <div
                  className={`p-4 rounded-lg border flex items-start space-x-3 ${
                    verifyResult.valid
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}
                >
                  {verifyResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <FileWarning className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-sm">
                      {verifyResult.valid ? "DEED AUTHENTICATED: REGISTERED ON BHU-CHAIN" : "FORGERY DETECTED: HASH MISMATCH"}
                    </div>
                    <p>{verifyResult.message}</p>
                    {verifyResult.matchedEvent && (
                      <div className="pt-2 text-[11px] font-mono text-emerald-800">
                        Matched Block #{verifyResult.matchedEvent.blockNumber} • Event: {verifyResult.matchedEvent.eventType} • Approver: {verifyResult.matchedEvent.approverDigitalId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Blockchain Event History & Chain Integrity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cryptographic History</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  On-Chain Blocks for {parcel.ulpin}
                </h2>
                <p className="text-xs text-slate-600">
                  Chronological, append-only blocks cryptographically chained with SHA-256 parent links.
                </p>
              </div>

              <button
                onClick={runChainIntegrityCheck}
                disabled={checkingChain}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center space-x-2 shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{checkingChain ? "Auditing Chain..." : "Validate Chain Integrity"}</span>
              </button>
            </div>

            {/* Chain Integrity Alert Banner */}
            {chainStatus && (
              <div
                className={`p-4 rounded-lg border flex items-start space-x-3 text-xs ${
                  chainStatus.valid
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                {chainStatus.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {chainStatus.valid ? "Cryptographic Chain Validated" : "Chain Integrity Compromised"}
                  </div>
                  <p className="mt-0.5">
                    {chainStatus.message || `All ${chainStatus.totalBlocks} sequential blocks match their cryptographic SHA-256 parent pointers.`}
                  </p>
                  <div className="mt-1 font-mono text-[11px] text-slate-600">
                    Genesis: {truncateHash(chainStatus.genesisBlockHash)} ➔ Latest: {truncateHash(chainStatus.latestBlockHash)}
                  </div>
                </div>
              </div>
            )}

            {/* Block Timeline */}
            <div className="space-y-4">
              {parcel.blockchainEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 transition hover:border-slate-300 text-xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                        Block #{evt.blockNumber}
                      </span>
                      <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                        {evt.eventType}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {formatDate(evt.timestamp)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Block Hash: </span>
                      <span className="font-mono font-semibold text-slate-800 break-all">
                        {evt.currentHash}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Previous Hash: </span>
                      <span className="font-mono text-slate-600 break-all">
                        {evt.previousHash}
                      </span>
                    </div>
                    {evt.documentHash && (
                      <div className="md:col-span-2">
                        <span className="text-slate-500">Document Hash: </span>
                        <span className="font-mono text-emerald-700 font-semibold break-all">
                          {evt.documentHash}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Approver ID: </span>
                      <span className="font-medium text-slate-800">
                        {evt.approverDigitalId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Digital Signature: </span>
                      <span className="font-mono text-slate-500">
                        {truncateHash(evt.digitalSignature, 12, 12)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading Verification Desk...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
