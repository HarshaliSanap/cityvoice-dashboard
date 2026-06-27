"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Shield, UserRound } from "lucide-react";
import { signupAdmin, type AdminRole } from "@/lib/services/authService";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signupAdmin({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="grid w-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="bg-navy p-8 text-white lg:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
              <Shield size={28} />
            </div>
            <h1 className="mt-8 text-3xl font-bold">Create Admin Access</h1>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              Super admins can see credentials and block users. Admin accounts can work reports without block controls.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold">Super Admin</p>
                <p className="mt-1 text-slate-300">Full dashboard, credentials, and user block access.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold">Admin</p>
                <p className="mt-1 text-slate-300">Dashboard access without user blocking.</p>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-800">Sign up</h2>
              <p className="mt-1 text-sm text-gray-500">Account details are saved to Firebase.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Full Name</span>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
                    placeholder="Admin name"
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
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

              <label className="block sm:col-span-2">
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
                    placeholder="At least 6 characters"
                  />
                </div>
              </label>
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Role</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["admin", "super_admin"] as AdminRole[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      role === item ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="block text-sm font-bold">{item === "super_admin" ? "Super Admin" : "Admin"}</span>
                    <span className="mt-1 block text-xs">{item === "super_admin" ? "Full access" : "No block option"}</span>
                  </button>
                ))}
              </div>
            </div>

            {message && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{message}</p>}
            {message.includes("login instead") && (
              <Link
                href="/login"
                className="mt-3 flex w-full items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
              >
                Go to login
              </Link>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have access?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
