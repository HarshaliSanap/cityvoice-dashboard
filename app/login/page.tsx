"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import {
  completeAdminLogin,
  getDashboardPathForRole,
  getCurrentUserIdToken,
  loginAdmin,
  verifyAdminOtp,
  type AdminProfile,
} from "@/lib/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingProfile, setPendingProfile] = useState<AdminProfile | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);

  const sendOtp = async (profile: AdminProfile) => {
    const idToken = await getCurrentUserIdToken();
    const response = await fetch("/api/send-admin-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: profile.uid,
        email: profile.email,
        idToken,
        name: profile.name,
      }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Unable to send OTP. Please try again.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const profile = await loginAdmin(email.trim(), password);
      await sendOtp(profile);
      setPendingProfile(profile);
      setIsOtpStep(true);
      setMessage("OTP sent to your admin email. Please verify to continue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingProfile) return;

    setMessage("");
    setIsSubmitting(true);

    try {
      await verifyAdminOtp(pendingProfile.uid, otp);
      await completeAdminLogin(pendingProfile);
      router.replace(getDashboardPathForRole(pendingProfile.role));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingProfile) return;
    setMessage("");
    setIsSubmitting(true);
    try {
      await sendOtp(pendingProfile);
      setMessage("A new OTP has been sent to your admin email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to resend OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="flex items-center bg-navy px-8 py-12 text-white lg:px-16">
          <div className="max-w-2xl">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">CityVoice Admin</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
              Sign in to manage reports, citizens, authorities, settings, and role-based admin access.
            </p>
            <div className="mt-10 grid gap-3 text-sm font-semibold text-slate-200 sm:grid-cols-2">
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Developer: highest access</span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Super admin: full controls</span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Admin: no block actions</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <form onSubmit={isOtpStep ? handleOtpSubmit : handleSubmit} className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{isOtpStep ? "Verify OTP" : "Login"}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {isOtpStep ? "Enter the 6-digit code sent to your admin email." : "Use your developer, super admin, or admin account."}
              </p>
            </div>

            {!isOtpStep ? (
              <>
                <label className="mb-4 block">
                  <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Email</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
                      placeholder="admin@cityvoice.gov"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Password</span>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
                      placeholder="Password"
                    />
                  </div>
                </label>
              </>
            ) : (
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase text-gray-400">OTP Code</span>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    inputMode="numeric"
                    minLength={6}
                    maxLength={6}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm tracking-[0.25em] outline-none transition-colors focus:border-blue-400 focus:bg-white"
                    placeholder="000000"
                  />
                </div>
              </label>
            )}

            {message && (
              <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
                message.includes("sent") ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"
              }`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (isOtpStep ? "Verifying..." : "Signing in...") : isOtpStep ? "Verify and continue" : "Sign in"}
            </button>

            {isOtpStep && (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="mt-3 w-full rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-wait disabled:opacity-70"
              >
                Resend OTP
              </button>
            )}

            <p className="mt-5 text-center text-sm text-gray-500">
              Need access? Ask a Developer or Super Admin to register your account.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
