"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Blocks, 
  Search, 
  Filter, 
  ShieldCheck, 
  Hash, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers
} from "lucide-react";
import { formatDate, truncateHash } from "@/lib/utils";

interface BlockchainEvent {
  id: string;
  blockNumber: number;
  ulpin: string;
  eventType: string;
  previousHash: string;
  currentHash: string;
  documentHash: string | null;
  registrationOfficeId: string;
  approverDigitalId: string;
  digitalSignature: string;
  timestamp: string;
  parcel?: {
    district: string;
    village: string;
    currentOwnerName: string;
  };
}

export default function BlockchainExplorer() {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/blockchain/events?limit=50");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      !search ||
      evt.ulpin.toLowerCase().includes(search.toLowerCase()) ||
      evt.currentHash.toLowerCase().includes(search.toLowerCase()) ||
      evt.approverDigitalId.toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedType === "ALL" || evt.eventType === selectedType;

    return matchesSearch && matchesType;
  });

  const eventTypes = [
    "ALL",
    "PARCEL_REGISTRATION",
    "SALE_DEED",
    "MUTATION_APPROVAL",
    "MORTGAGE",
    "PLEDGE_RELEASE",
    "DISPUTE_FLAG",
    "RECORD_CORRECTION"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Explorer Header */}
      <div className="bg-slate-900 text-white rounded-xl p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              <Blocks className="w-3.5 h-3.5" />
              <span>Bhu-Chain Distributed Ledger Explorer</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Immutable Cryptographic Block Feed
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every parcel onboarding, sale deed registration, mortgage lien, and mutation approval is permanently sealed into SHA-256 chained blocks.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/80 text-center shrink-0">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {events.length}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Mined Ledger Blocks
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ULPIN, Block Hash, or Officer ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono placeholder:font-sans placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Block Stream */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Loading blockchain stream...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <p className="text-sm font-medium">No blockchain blocks match your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((block) => (
            <div
              key={block.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold bg-slate-900 text-emerald-400 px-3 py-1 rounded-md text-xs">
                    Block #{block.blockNumber}
                  </span>
                  <span className="font-bold text-xs px-2.5 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200">
                    {block.eventType}
                  </span>
                  <Link
                    href={`/verify?ulpin=${block.ulpin}`}
                    className="font-mono text-xs font-semibold text-slate-700 hover:text-blue-700 hover:underline flex items-center space-x-1"
                  >
                    <span>ULPIN: {block.ulpin}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(block.timestamp)}</span>
                </div>
              </div>

              {/* Cryptographic Linkage Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 font-medium">Current Block Hash (SHA-256):</div>
                  <div className="font-mono text-slate-900 font-bold break-all select-all">
                    {block.currentHash}
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 font-medium">Previous Parent Hash:</div>
                  <div className="font-mono text-slate-600 font-medium break-all select-all">
                    {block.previousHash}
                  </div>
                </div>

                {block.documentHash && (
                  <div className="md:col-span-2 space-y-1 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                    <div className="text-emerald-900 font-medium">Approved Document SHA-256 Fingerprint:</div>
                    <div className="font-mono text-emerald-800 font-bold break-all select-all">
                      {block.documentHash}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Registration Office: <strong>{block.registrationOfficeId}</strong></span>
                  <span>Approver: <strong>{block.approverDigitalId}</strong></span>
                </div>

                <div className="text-slate-500 text-[11px] truncate">
                  Digital Signature: <span className="font-mono">{truncateHash(block.digitalSignature, 16, 16)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
