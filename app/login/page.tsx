"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { loginAdmin } from "@/lib/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await loginAdmin(email.trim(), password);
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to login. Please try again.");
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
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Super admin: full controls</span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Admin: no block actions</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Login</h2>
              <p className="mt-1 text-sm text-gray-500">Use your super admin or admin account.</p>
            </div>

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

            {message && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{message}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <p className="mt-5 text-center text-sm text-gray-500">
              Need an account?{" "}
              <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700">
                Create admin account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
