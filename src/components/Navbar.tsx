"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Search, 
  Blocks, 
  UserCheck, 
  LogOut, 
  LogIn, 
  Menu, 
  X,
  FileCheck,
  Building2,
  Landmark,
  Scale,
  Users
} from "lucide-react";

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleDashboardPath = (role: string) => {
    switch (role) {
      case "CITIZEN": return "/citizen";
      case "SUB_REGISTRAR": return "/registrar";
      case "REVENUE_OFFICER": return "/revenue";
      case "BANK_OFFICER": return "/bank";
      case "AUDITOR": return "/auditor";
      case "ADMIN": return "/admin";
      default: return "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Tiranga Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />
      
      {/* Official Top Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Government of India • Land Records Modernization Pilot</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">DILRMP & Bhu-Aadhaar (ULPIN) Standard</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] px-2 py-0.5 rounded font-mono font-medium">
            Tamil Nadu Pilot Active
          </span>
          <span className="hidden md:inline text-slate-400">SHA-256 Ledger Integrity: VERIFIED</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Identity */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-md group-hover:bg-blue-900 transition-colors">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                    Bhu<span className="text-blue-700">-Chain</span>
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 uppercase px-1.5 py-0.5 rounded tracking-wide">
                    Platform
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Blockchain Land Title Verification & Forgery Shield
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/" 
                  ? "bg-slate-100 text-slate-900 font-semibold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/verify"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                pathname.startsWith("/verify") 
                  ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Verify Parcel & Deeds</span>
            </Link>

            <Link
              href="/blockchain"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                pathname === "/blockchain" 
                  ? "bg-slate-100 text-slate-900 font-semibold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Blocks className="w-4 h-4 text-emerald-600" />
              <span>Ledger Explorer</span>
            </Link>

            {/* Role Portals Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                onBlur={() => setTimeout(() => setRoleDropdownOpen(false), 200)}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center space-x-1"
              >
                <span>Role Portals</span>
                <span className="text-xs">▾</span>
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white border border-slate-200 py-2 z-50 text-sm">
                  <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Official Portals
                  </div>
                  <Link
                    href="/registrar"
                    className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-700"
                  >
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-medium">Sub-Registrar Office</div>
                      <div className="text-xs text-slate-400">Sale deeds & deed verification</div>
                    </div>
                  </Link>
                  <Link
                    href="/revenue"
                    className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-700"
                  >
                    <Scale className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-medium">Revenue Officer / Tehsildar</div>
                      <div className="text-xs text-slate-400">Mutation approvals & dispute flags</div>
                    </div>
                  </Link>
                  <Link
                    href="/bank"
                    className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-700"
                  >
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Bank Officer</div>
                      <div className="text-xs text-slate-400">Mortgage liens & pledge releases</div>
                    </div>
                  </Link>
                  <Link
                    href="/auditor"
                    className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-700"
                  >
                    <FileCheck className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-medium">C&AG / State Auditor</div>
                      <div className="text-xs text-slate-400">Audit logs & hash validator</div>
                    </div>
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <Link
                    href="/citizen"
                    className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-700"
                  >
                    <Users className="w-4 h-4 text-cyan-600" />
                    <div>
                      <div className="font-medium">Citizen Dashboard</div>
                      <div className="text-xs text-slate-400">Owned parcels & sale requests</div>
                    </div>
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-700"
                  >
                    <UserCheck className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="font-medium">System Admin</div>
                      <div className="text-xs text-slate-400">Parcel onboarding & metrics</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* User Auth CTA */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href={getRoleDashboardPath(user.role)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-medium transition"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                      {user.role.replace("_", " ")}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              Overview
            </Link>
            <Link
              href="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50"
            >
              Verify Parcel & Deed Hashes
            </Link>
            <Link
              href="/blockchain"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Blockchain Ledger Explorer
            </Link>
            <div className="border-t border-slate-200 pt-2 pb-1 text-xs font-bold text-slate-400 uppercase px-3">
              Role Dashboards
            </div>
            <Link
              href="/registrar"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Sub-Registrar Portal
            </Link>
            <Link
              href="/revenue"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Revenue Officer Portal
            </Link>
            <Link
              href="/bank"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Bank Officer Portal
            </Link>
            <Link
              href="/auditor"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Auditor Portal
            </Link>
            <Link
              href="/citizen"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Citizen Portal
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Admin Portal
            </Link>
            <div className="pt-2 border-t border-slate-200">
              {user ? (
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm font-semibold">{user.name} ({user.role})</span>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-xs text-rose-600 font-bold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 px-4 rounded bg-blue-700 text-white font-medium text-sm"
                >
                  Login to Portal
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
