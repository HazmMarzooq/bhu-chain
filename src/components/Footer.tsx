import React from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      {/* Important Legal & Architecture Disclaimer Banner */}
      <div className="bg-slate-950 border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Statutory Advisory & Verification Scope: </span>
              Bhu-Chain is an immutable verification platform designed to detect duplicate registrations, forged land deeds, and unauthorized transfers.
              Under current Indian land administration, legal title authority remains vested in state revenue records (e.g. Patta, Chitta, RoR) and the Registration Act, 1908.
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs bg-slate-800/60 text-slate-300 px-3 py-1.5 rounded border border-slate-700/60 shrink-0">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Raw Aadhaar Stored • SHA-256 Hashes Only</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: System */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                B
              </div>
              <span className="text-white font-bold text-base tracking-tight">
                Bhu-Chain Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s Next-Gen Land Ownership Verification Platform integrating Unique Land Parcel Identification Numbers (ULPIN / Bhu-Aadhaar) with cryptographic append-only blockchains.
            </p>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pilot Region: Tamil Nadu State</span>
            </div>
          </div>

          {/* Col 2: Public Verifications */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Citizen Verification
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/verify" className="hover:text-white transition">
                  Search by 14-Digit ULPIN
                </Link>
              </li>
              <li>
                <Link href="/verify?ulpin=33-003-004-00190" className="hover:text-white transition">
                  Forged vs Authentic Deed Test
                </Link>
              </li>
              <li>
                <Link href="/verify?ulpin=33-015-008-00620" className="hover:text-white transition">
                  Mortgage Encumbrance Check
                </Link>
              </li>
              <li>
                <Link href="/verify?ulpin=33-028-014-00840" className="hover:text-white transition">
                  Dispute & Litigation Filter
                </Link>
              </li>
              <li>
                <Link href="/blockchain" className="hover:text-white transition">
                  Global Cryptographic Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Role Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Administrative Gateways
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/registrar" className="hover:text-white transition">
                  Sub-Registrar Registration Queue
                </Link>
              </li>
              <li>
                <Link href="/revenue" className="hover:text-white transition">
                  Revenue Officer Mutation Desk
                </Link>
              </li>
              <li>
                <Link href="/bank" className="hover:text-white transition">
                  Bank Collateral & Pledge Portal
                </Link>
              </li>
              <li>
                <Link href="/auditor" className="hover:text-white transition">
                  C&AG Independent Audit Feed
                </Link>
              </li>
              <li>
                <Link href="/citizen" className="hover:text-white transition">
                  Citizen Property Locker
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Technical Specs */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Technical Specifications
            </h4>
            <div className="text-xs space-y-1.5 text-slate-400">
              <p><strong className="text-slate-300">Hashing:</strong> SHA-256 Merkle Block Linking</p>
              <p><strong className="text-slate-300">Standard:</strong> Bhu-Aadhaar 14-Digit ULPIN</p>
              <p><strong className="text-slate-300">Privacy:</strong> Zero Knowledge PII (HMAC-SHA256)</p>
              <p><strong className="text-slate-300">Portability:</strong> Hyperledger Fabric / Ethereum EVM Bridge Ready</p>
              <p><strong className="text-slate-300">Stack:</strong> Next.js 14, TypeScript, Prisma, Tailwind</p>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} Bhu-Chain Initiative. National Land Record Verification System.
          </div>
          <div className="flex space-x-4">
            <span className="text-slate-400">Ministry of Rural Development • Dept of Land Resources</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
