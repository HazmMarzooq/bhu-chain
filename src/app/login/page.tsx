"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Building2, 
  Scale, 
  Landmark, 
  FileCheck, 
  Users, 
  UserCheck,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("registrar@bhu-chain.gov.in");
  const [password, setPassword] = useState("demo@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoRoles = [
    {
      role: "SUB_REGISTRAR",
      name: "T. Annamalai (Sub-Registrar)",
      email: "registrar@bhu-chain.gov.in",
      office: "Sub-Registrar Office, Chennai Central",
      icon: Building2,
      color: "border-indigo-200 hover:border-indigo-500 bg-indigo-50/40",
      targetPath: "/registrar",
    },
    {
      role: "REVENUE_OFFICER",
      name: "S. K. Radhakrishnan (Tehsildar)",
      email: "revenue@bhu-chain.gov.in",
      office: "Revenue Division, Madurai",
      icon: Scale,
      color: "border-amber-200 hover:border-amber-500 bg-amber-50/40",
      targetPath: "/revenue",
    },
    {
      role: "BANK_OFFICER",
      name: "V. Meenakshi (Chief Manager, SBI)",
      email: "bank@bhu-chain.gov.in",
      office: "State Bank of India, Commercial Branch",
      icon: Landmark,
      color: "border-emerald-200 hover:border-emerald-500 bg-emerald-50/40",
      targetPath: "/bank",
    },
    {
      role: "AUDITOR",
      name: "G. Shankaran (Senior Audit Officer)",
      email: "auditor@bhu-chain.gov.in",
      office: "C&AG State Audit Directorate",
      icon: FileCheck,
      color: "border-rose-200 hover:border-rose-500 bg-rose-50/40",
      targetPath: "/auditor",
    },
    {
      role: "CITIZEN",
      name: "K. R. Sundaram (Landowner)",
      email: "citizen@bhu-chain.gov.in",
      office: "Mylapore, Chennai",
      icon: Users,
      color: "border-cyan-200 hover:border-cyan-500 bg-cyan-50/40",
      targetPath: "/citizen",
    },
    {
      role: "ADMIN",
      name: "State Super Administrator",
      email: "admin@bhu-chain.gov.in",
      office: "e-Governance & Land Admin, TN",
      icon: UserCheck,
      color: "border-slate-200 hover:border-slate-500 bg-slate-50",
      targetPath: "/admin",
    },
  ];

  const handleSelectRole = (r: typeof demoRoles[0]) => {
    setEmail(r.email);
    setPassword("demo@123");
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Redirect based on user's role
      const matched = demoRoles.find((r) => r.email === email);
      const target = matched ? matched.targetPath : "/verify";
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Role-Based Authentication Gateway</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Access Bhu-Chain Portal
        </h1>
        <p className="text-sm text-slate-600">
          Select any official or citizen profile below for instant 1-click test credentials.
        </p>
      </div>

      {/* 1-Click Role Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoRoles.map((r) => {
          const Icon = r.icon;
          const isSelected = email === r.email;
          return (
            <button
              key={r.role}
              type="button"
              onClick={() => handleSelectRole(r)}
              className={`p-4 rounded-xl border text-left transition shadow-sm flex items-start space-x-3 ${r.color} ${
                isSelected ? "ring-2 ring-blue-600 border-blue-600 bg-white" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0 border border-slate-200">
                <Icon className="w-5 h-5 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 truncate">{r.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{r.office}</div>
                <div className="text-[10px] font-mono font-semibold text-blue-700 mt-1 truncate">
                  {r.email}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Login Form */}
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-blue-700" />
          <span>Authenticate Session</span>
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Official / Citizen Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Default test password is <code>demo@123</code></p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Role Portal"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
