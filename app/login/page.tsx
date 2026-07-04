"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Mail } from "lucide-react";
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
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

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
    <main className="min-h-screen overflow-hidden bg-[#0e1420]">
      <div className="flex min-h-screen">
        <section className="relative hidden min-w-0 flex-[1_1_auto] overflow-hidden bg-[#0e1420] px-12 py-12 text-white lg:flex lg:w-[70vw] lg:flex-col lg:justify-between xl:px-20">
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(180deg,transparent,black_22%,black_78%,transparent)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[620px] rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/CityVoiceLogo.jpeg"
              alt="CityVoice logo"
              className="h-12 w-12 rounded-2xl object-cover shadow-sm ring-1 ring-white/15"
            />
            <div>
              <p className="text-lg font-bold tracking-wide text-slate-100">CityVoice</p>
              <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.28em] text-blue-300/70">Control room</p>
            </div>
          </div>

          <div className="relative z-10 max-w-[760px]">
            <h1 className="text-[clamp(4rem,6vw,6.4rem)] font-bold leading-[1.05] tracking-normal">
              The city, <span className="text-blue-400">on one</span>
              <br />
              <span className="text-blue-400">desk.</span>
            </h1>
            <p className="mt-8 max-w-[590px] text-xl leading-9 text-blue-100/80">
              Sign in to track reports, coordinate response, and keep civic operations moving.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8">
            <div className="flex items-center gap-3">
              <span className="live-dot h-2 w-2 rounded-full bg-amber-400" />
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-blue-300/70">Live city desk</p>
                <p className="mt-2 text-base text-blue-100/80">Operating normally</p>
              </div>
            </div>

            <svg className="hidden h-10 w-52 sm:block" viewBox="0 0 208 40" fill="none" aria-hidden="true">
              <path className="beat-line" d="M0 20H54L66 7L82 33L98 20H208" stroke="#4C7CFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span className="font-mono text-sm text-blue-200/70">{clock}</span>
          </div>
        </section>

        <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white/90 px-7 py-10 backdrop-blur-xl lg:w-[30vw] lg:min-w-[430px]">
          <div className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-slate-200/80 blur-3xl" />
          <form onSubmit={isOtpStep ? handleOtpSubmit : handleSubmit} className="relative z-10 w-full max-w-md rounded-[2rem] bg-white/70 p-8 shadow-2xl shadow-slate-200/60 ring-1 ring-white/80 backdrop-blur-xl">
            <div className="mb-8">
              <h2 className="text-4xl font-bold tracking-normal text-[#12151c]">{isOtpStep ? "Verify OTP" : "Welcome back"}</h2>
              <p className="mt-4 text-base leading-7 text-gray-500">
                {isOtpStep ? "Enter the 6-digit code sent to your admin email." : "Sign in with your admin account to continue."}
              </p>
            </div>

            {!isOtpStep ? (
              <>
                <label className="mb-5 block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Email</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-base text-gray-900 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="admin@cityvoice.gov"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Password</span>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={6}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-base text-gray-900 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Enter your password"
                    />
                  </div>
                </label>
              </>
            ) : (
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-400">OTP Code</span>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    inputMode="numeric"
                    minLength={6}
                    maxLength={6}
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-base tracking-[0.25em] text-gray-900 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="000000"
                  />
                </div>
              </label>
            )}

            {message && (
              <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${
                message.includes("sent") ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"
              }`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 h-15 w-full rounded-2xl bg-[#0e1420] px-5 py-4 text-base font-bold text-white transition-colors hover:bg-[#1c2536] disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (isOtpStep ? "Verifying..." : "Signing in...") : isOtpStep ? "Verify and continue" : "Sign in"}
            </button>

            {isOtpStep && (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="mt-3 h-12 w-full rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-wait disabled:opacity-70"
              >
                Resend OTP
              </button>
            )}

            <p className="mt-6 text-center text-sm leading-6 text-gray-400">
              Need access? Ask a Developer or Super Admin to register your account.
            </p>
          </form>
        </section>
      </div>
      <style jsx>{`
        .live-dot {
          box-shadow: 0 0 0 0 rgba(242, 169, 59, 0.58);
          animation: livePulse 2s infinite;
        }

        .beat-line {
          fill: none;
          stroke-dasharray: 320;
          stroke-dashoffset: 320;
          animation: drawBeat 2.2s ease-out forwards, moveBeat 3s 2.2s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes livePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(242, 169, 59, 0.58);
          }
          70% {
            box-shadow: 0 0 0 11px rgba(242, 169, 59, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(242, 169, 59, 0);
          }
        }

        @keyframes drawBeat {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes moveBeat {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-8px);
          }
        }
      `}</style>
    </main>
  );
}
