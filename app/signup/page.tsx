"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../components/AuthProvider";
import {
  getAdminRoleLabel,
  getCreatableRolesForRole,
  getDashboardPathForRole,
  signupAdmin,
  type AdminRole,
} from "@/lib/services/authService";
import { Lock, Mail, ShieldCheck, UserPlus, UserRound } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { adminProfile, isLoading } = useAuth();
  const roleOptions = getCreatableRolesForRole(adminProfile?.role);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roleOptions.length > 0) {
      setRole(roleOptions[0]);
    }
  }, [roleOptions.join("|")]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!adminProfile || roleOptions.length === 0) {
      setMessage("You do not have permission to create admin users.");
      return;
    }

    if (!roleOptions.includes(role)) {
      setMessage("Selected role is not allowed for your account.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Password and confirm password must match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signupAdmin({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        createdBy: adminProfile.uid,
      });
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setMessage(`${getAdminRoleLabel(role)} account created successfully.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  if (!adminProfile || roleOptions.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <ShieldCheck className="mx-auto mb-4 text-gray-300" size={44} />
            <h1 className="text-xl font-bold text-gray-800">Access denied</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Admin users cannot create accounts or access role management pages.
            </p>
            <button
              onClick={() => router.replace(getDashboardPathForRole(adminProfile?.role || "admin"))}
              className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Back to dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Register User</h1>
            <p className="mt-1 text-sm text-gray-500">
              {adminProfile.role === "developer"
                ? "Developer can create and manage Super Admin and Admin accounts."
                : "Super Admin can create and manage Admin accounts."}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            <UserPlus size={18} />
            {getAdminRoleLabel(adminProfile.role)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Name</span>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
                  placeholder="Full name"
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
                  placeholder="At least 6 characters"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Confirm Password</span>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
                  placeholder="Repeat password"
                />
              </div>
            </label>
          </div>

          <div className="mt-5">
            <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as AdminRole)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition-colors focus:border-blue-400 focus:bg-white"
            >
              {roleOptions.map((item) => (
                <option key={item} value={item}>
                  {getAdminRoleLabel(item)}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              message.includes("successfully") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : `Create ${getAdminRoleLabel(role)}`}
          </button>
        </form>
      </main>
    </div>
  );
}
