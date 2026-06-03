"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Clock, Search, ShieldAlert, UserRound } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { subscribeToAccountBlockClaims } from "@/lib/services/dataService";

type NotificationFilter = "all" | "block_claims" | "blocked_users" | "open";

type AccountBlockClaim = {
  id: string;
  description?: string;
  status?: string;
  timestamp?: string;
  type?: string;
  userBlocked?: boolean;
  userEmail?: string;
  userId?: string;
  userName?: string;
  userPincode?: string;
};

const filterOptions: { label: string; value: NotificationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Block Claims", value: "block_claims" },
  { label: "Currently Blocked", value: "blocked_users" },
  { label: "Open", value: "open" },
];

const getTimestampValue = (timestamp?: string) => {
  if (!timestamp) return 0;

  const parsed = new Date(timestamp.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatClaimDate = (timestamp?: string) => {
  if (!timestamp) return "No date";

  const parsed = new Date(timestamp.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? timestamp : parsed.toLocaleString();
};

const isOpenClaim = (claim: AccountBlockClaim) => {
  const status = String(claim.status || "new").toLowerCase();
  return !["closed", "resolved", "dismissed", "done"].includes(status);
};

export default function NotificationsPage() {
  const [claims, setClaims] = useState<AccountBlockClaim[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<NotificationFilter>("all");

  useEffect(() => {
    const unsubscribe = subscribeToAccountBlockClaims((data) => {
      setClaims(data);
    });

    return () => unsubscribe?.();
  }, []);

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();

    return claims
      .filter((claim) => {
        const matchesFilter =
          filter === "all" ||
          filter === "block_claims" ||
          (filter === "blocked_users" && claim.userBlocked) ||
          (filter === "open" && isOpenClaim(claim));
        const matchesSearch =
          !query ||
          (claim.userName || "").toLowerCase().includes(query) ||
          (claim.userEmail || "").toLowerCase().includes(query) ||
          (claim.userId || "").toLowerCase().includes(query) ||
          (claim.description || "").toLowerCase().includes(query);

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp));
  }, [claims, filter, search]);

  const blockedClaimCount = claims.filter((claim) => claim.userBlocked).length;
  const openClaimCount = claims.filter((claim) => isOpenClaim(claim)).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">Review Firebase alerts and account block claims</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-3xl bg-blue-600 p-6 text-white">
            <Bell size={22} className="mb-3 opacity-90" />
            <p className="text-sm opacity-90">Total Claims</p>
            <h2 className="mt-2 text-4xl font-bold">{claims.length}</h2>
          </div>

          <div className="rounded-3xl bg-orange-500 p-6 text-white">
            <Clock size={22} className="mb-3 opacity-90" />
            <p className="text-sm opacity-90">Open Claims</p>
            <h2 className="mt-2 text-4xl font-bold">{openClaimCount}</h2>
          </div>

          <div className="rounded-3xl bg-red-600 p-6 text-white">
            <ShieldAlert size={22} className="mb-3 opacity-90" />
            <p className="text-sm opacity-90">Blocked Users</p>
            <h2 className="mt-2 text-4xl font-bold">{blockedClaimCount}</h2>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = filter === option.value;
              const count =
                option.value === "all"
                  ? claims.length
                  : option.value === "blocked_users"
                  ? blockedClaimCount
                  : option.value === "open"
                  ? openClaimCount
                  : claims.length;

              return (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
                    isActive ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {option.label}
                  <span className={`ml-2 text-xs ${isActive ? "text-blue-100" : "text-gray-400"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-800">Account Block Claims</h2>
            <Link
              href="/users?filter=claims"
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
            >
              <UserRound size={16} />
              User claim filter
            </Link>
          </div>

          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <article key={claim.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase text-orange-700">
                        <AlertTriangle size={13} />
                        Block Claim
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          claim.userBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {claim.userBlocked ? <ShieldAlert size={13} /> : <CheckCircle2 size={13} />}
                        {claim.userBlocked ? "User blocked" : "User active"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-gray-500">
                        {claim.status || "new"}
                      </span>
                    </div>

                    <h3 className="break-words text-lg font-bold text-gray-800">
                      {claim.userName || "Unknown user"} claimed account block issue
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                      {claim.description || "No claim details provided"}
                    </p>

                    <div className="mt-4 grid gap-2 text-xs font-semibold text-gray-500 sm:grid-cols-3">
                      <span className="break-all">Email: {claim.userEmail || "No email"}</span>
                      <span className="break-all">User ID: {claim.userId || "N/A"}</span>
                      <span>Pin: {claim.userPincode || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <span className="text-xs font-semibold text-gray-400">{formatClaimDate(claim.timestamp)}</span>
                    {claim.userId ? (
                      <Link
                        href={`/users/${claim.userId}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        View user
                      </Link>
                    ) : (
                      <Link
                        href="/users?filter=claims"
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        Match user
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {filteredClaims.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
                <Bell size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-500">No block claims found</p>
                <p className="mt-1 text-sm text-gray-400">New Firebase account block claims will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
