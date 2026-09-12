"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Authentication failed. Please check credentials.");
        setIsLoading(false);
        return;
      }

      // Successful login: navigate to assigned dashboard and refresh server state
      router.push(data.redirectUrl);
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the authentication service. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-800/40 bg-white/95 shadow-2xl backdrop-blur-xl">
      {/* Official Municipal Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 px-8 py-7 text-center text-white">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 ring-4 ring-emerald-500/30">
          <Sprout className="h-8 w-8 text-emerald-300" />
        </div>
        <h1 className="mt-3 text-lg font-extrabold tracking-wider">OMAG POLOMOLOK</h1>
        <p className="text-xs font-semibold tracking-wide text-emerald-200">
          OFFICE OF THE MUNICIPAL AGRICULTURIST
        </p>
        <p className="text-[10px] text-emerald-300/80">Municipality of Polomolok, South Cotabato</p>
      </div>

      {/* Form Container */}
      <div className="px-8 py-6">
        <div className="mb-5 text-center">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
            Sign In to Municipal Portal
          </h2>
          <p className="text-xs text-slate-500">
            Agricultural Resource Distribution & Production Analytics System
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Username or Email"
              id="identifier-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. staff.polomolok or staff@polomolok.gov.ph"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              label="Password"
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Secure Role-Based Session Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
