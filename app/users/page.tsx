"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { subscribeToAccountBlockClaims, subscribeToPosts, subscribeToUsers } from "@/lib/services/dataService";

type UserFilter = "all" | "active" | "blocked" | "claims";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  location: string;
  pincode: string;
  voices: number;
  initial: string;
  color: string;
  blocked: boolean;
  hasBlockClaim: boolean;
};

type RawUser = {
  id: string;
  address?: string;
  email?: string;
  location?: string;
  name?: string;
  pincode?: string;
  blocked?: boolean;
};

type RawPost = {
  uid?: string;
};

type AccountBlockClaim = {
  active?: boolean;
  id: string;
  status?: string;
  userId?: string;
  userName?: string;
};

const isActiveClaim = (claim: AccountBlockClaim) => {
  const status = String(claim.status || "new").toLowerCase();
  return claim.active !== false && !["closed", "resolved", "dismissed", "done"].includes(status);
};

const userFilterOptions: { label: string; value: UserFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Blocked", value: "blocked" },
  { label: "Block Claims", value: "claims" },
];

export default function UserManagement() {
  const searchParams = useSearchParams();
  const queryFilter = searchParams.get("filter");
  const initialFilter = userFilterOptions.some((option) => option.value === queryFilter)
    ? (queryFilter as UserFilter)
    : "all";
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>(initialFilter);

  useEffect(() => {
    let latestUsers: RawUser[] = [];
    let latestPosts: RawPost[] = [];
    let latestClaims: AccountBlockClaim[] = [];

    const updateUsers = () => {
      const activeClaims = latestClaims.filter(isActiveClaim);
      const claimUserIds = new Set(activeClaims.map((claim) => claim.userId).filter(Boolean));
      const claimUserNames = new Set(
        activeClaims.map((claim) => claim.userName?.toLowerCase()).filter((name): name is string => Boolean(name))
      );

      const mappedUsers = latestUsers.map((user) => {
        const userPosts = latestPosts.filter((post) => post.uid === user.id);
        const hasBlockClaim =
          claimUserIds.has(user.id) || Boolean(user.name && claimUserNames.has(user.name.toLowerCase()));

        return {
          id: user.id,
          name: user.name || "Anonymous",
          email: user.email || "No email",
          location: user.address || user.location || "Unknown",
          pincode: user.pincode || "N/A",
          voices: userPosts.length,
          initial: (user.name || "U").charAt(0).toUpperCase(),
          color: user.blocked ? "bg-red-500" : "bg-blue-500",
          blocked: Boolean(user.blocked),
          hasBlockClaim,
        };
      });

      setUsers(mappedUsers);
    };

    const unsubscribeUsers = subscribeToUsers((fetchedUsers: RawUser[]) => {
      latestUsers = fetchedUsers;
      updateUsers();
    });

    const unsubscribePosts = subscribeToPosts((fetchedPosts: RawPost[]) => {
      latestPosts = fetchedPosts;
      updateUsers();
    });

    const unsubscribeClaims = subscribeToAccountBlockClaims((claims: AccountBlockClaim[]) => {
      latestClaims = claims;
      updateUsers();
    });

    return () => {
      unsubscribeUsers?.();
      unsubscribePosts?.();
      unsubscribeClaims?.();
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !user.blocked) ||
      (filter === "blocked" && user.blocked) ||
      (filter === "claims" && user.hasBlockClaim);

    return (
      matchesFilter &&
      (user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.location.toLowerCase().includes(query))
    );
  });

  const topUsers = users
    .filter((user) => !user.blocked)
    .sort((a, b) => (b.voices || 0) - (a.voices || 0))
    .slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">Monitor and manage platform users</p>
          </div>

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm outline-none focus:border-blue-400 sm:w-80"
          />
        </div>

        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {userFilterOptions.map((option) => {
              const isActive = filter === option.value;
              const count =
                option.value === "all"
                  ? users.length
                  : option.value === "active"
                  ? users.filter((user) => !user.blocked).length
                  : option.value === "blocked"
                  ? users.filter((user) => user.blocked).length
                  : users.filter((user) => user.hasBlockClaim).length;

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

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl bg-blue-600 p-6 text-white">
            <p className="text-sm opacity-90">Total Users</p>
            <h2 className="mt-2 text-4xl font-bold">{users.length}</h2>
          </div>

          <div className="rounded-3xl bg-green-500 p-6 text-white">
            <p className="text-sm opacity-90">Active Users</p>
            <h2 className="mt-2 text-4xl font-bold">{users.filter((user) => !user.blocked && user.voices > 0).length}</h2>
          </div>

          <div className="rounded-3xl bg-orange-500 p-6 text-white">
            <p className="text-sm opacity-90">Blocked Users</p>
            <h2 className="mt-2 text-4xl font-bold">{users.filter((user) => user.blocked).length}</h2>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Top Voice Contributors</h2>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">MOST ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {topUsers.map((user, index) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${user.color} text-xl font-bold text-white`}>
                    {user.initial}
                  </div>

                  <span className="text-xs font-bold text-orange-500">#{index + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 truncate font-semibold text-gray-800">{user.name}</h3>
                  {user.blocked && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                      Blocked
                    </span>
                  )}
                  {user.hasBlockClaim && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-600">
                      Claim
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-gray-400">{user.email}</p>

                <div className="mt-4">
                  <p className="text-3xl font-bold text-blue-600">{user.voices}</p>
                  <p className="text-xs text-gray-500">Total Voices</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-800">All Users</h2>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredUsers.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className={`rounded-2xl border p-4 transition-all ${
                  user.blocked
                    ? "border-red-100 bg-red-50/60 hover:border-red-200 hover:bg-red-50"
                    : "border-gray-100 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${user.color} font-bold text-white`}>
                    {user.initial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate font-semibold text-gray-800">{user.name}</h3>
                      {user.blocked && (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                          Blocked
                        </span>
                      )}
                      {user.hasBlockClaim && (
                        <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-600">
                          Claim
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{user.voices}</p>
                    <p className="text-[10px] text-gray-400">voices</p>
                  </div>
                </div>
              </Link>
            ))}

            {filteredUsers.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-400">No users found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
