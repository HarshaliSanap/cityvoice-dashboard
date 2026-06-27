"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Ban, CheckCircle, Clock, History, Image as ImageIcon, Mail, MapPin, MessageSquare, SquarePen, UserRound, X } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import Sidebar from "../../components/Sidebar";
import { subscribeToAccountBlockClaims, subscribeToPosts, subscribeToReplies, subscribeToUsers, updateUserBlocked } from "@/lib/services/dataService";

type RawUser = {
  id: string;
  address?: string;
  email?: string;
  location?: string;
  name?: string;
  pincode?: string;
  blocked?: boolean;
  blockedAt?: string | null;
  blockHistory?: Record<string, BlockHistoryItem>;
};

type RawPost = {
  id: string;
  category?: string;
  description?: string;
  image_url?: string;
  location?: string;
  name?: string;
  replies?: number;
  status?: string;
  timestamp?: string;
  uid?: string;
};

type Reply = {
  name?: string;
  text?: string;
  timestamp?: string;
  uid?: string;
};

type BlockHistoryItem = {
  action?: string;
  blocked?: boolean;
  timestamp?: string;
  updatedBy?: string;
};

type AccountBlockClaim = {
  active?: boolean;
  id: string;
  description?: string;
  resolvedAt?: string | null;
  status?: string;
  timestamp?: string;
  userBlocked?: boolean;
  userEmail?: string;
  userId?: string;
  userName?: string;
  userPincode?: string;
};

type ProfileTab = "posts" | "claims";

const getTimestampValue = (timestamp?: string) => {
  if (!timestamp) return 0;

  const parsed = new Date(timestamp.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDateTime = (timestamp?: string) => {
  const parsed = getTimestampValue(timestamp);
  if (!parsed) return "No date";

  return new Date(parsed).toLocaleString();
};

const isActiveClaim = (claim: AccountBlockClaim) => {
  const status = String(claim.status || "new").toLowerCase();
  return claim.active !== false && !["closed", "resolved", "dismissed", "done"].includes(status);
};

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const userId = params.id;
  const [users, setUsers] = useState<RawUser[]>([]);
  const [posts, setPosts] = useState<RawPost[]>([]);
  const [allReplies, setAllReplies] = useState<Record<string, Record<string, Reply>>>({});
  const [claims, setClaims] = useState<AccountBlockClaim[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>(searchParams.get("tab") === "claims" ? "claims" : "posts");
  const [selectedClaim, setSelectedClaim] = useState<AccountBlockClaim | null>(null);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    const unsubscribeUsers = subscribeToUsers((fetchedUsers: RawUser[]) => {
      setUsers(fetchedUsers);
    });

    const unsubscribePosts = subscribeToPosts((fetchedPosts: RawPost[]) => {
      setPosts(fetchedPosts);
    });

    const unsubscribeReplies = subscribeToReplies((fetchedReplies: Record<string, Record<string, Reply>>) => {
      setAllReplies(fetchedReplies);
    });

    const unsubscribeClaims = subscribeToAccountBlockClaims((fetchedClaims: AccountBlockClaim[]) => {
      setClaims(fetchedClaims);
    });

    return () => {
      unsubscribeUsers?.();
      unsubscribePosts?.();
      unsubscribeReplies?.();
      unsubscribeClaims?.();
    };
  }, []);

  const user = users.find((item) => item.id === userId) || null;

  const userPosts = useMemo(() => {
    if (!user) return [];

    return posts.filter((post) => post.uid === user.id || (post.name && post.name === user.name));
  }, [posts, user]);

  const totalResponses = userPosts.reduce((count, post) => {
    const liveReplyCount = Object.keys(allReplies[post.id] || {}).length;
    return count + (liveReplyCount || post.replies || 0);
  }, 0);

  const displayName = user?.name || "Anonymous";
  const initial = displayName.charAt(0).toUpperCase();
  const isBlocked = Boolean(user?.blocked);
  const userClaims = useMemo(() => {
    if (!user) return [];

    return claims
      .filter((claim) => {
        return (
          claim.userId === user.id ||
          Boolean(claim.userEmail && user.email && claim.userEmail.toLowerCase() === user.email.toLowerCase()) ||
          Boolean(claim.userName && user.name && claim.userName.toLowerCase() === user.name.toLowerCase())
        );
      })
      .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp));
  }, [claims, user]);
  const blockHistory = useMemo(() => {
    if (!user?.blockHistory) return [];

    return Object.entries(user.blockHistory)
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp));
  }, [user]);

  const handleBlockToggle = async () => {
    if (!user) return;

    const nextBlocked = !isBlocked;
    const confirmed = window.confirm(
      nextBlocked
        ? "Block this user? They will be marked blocked across CityVoice."
        : "Unblock this user? They will be allowed back on CityVoice."
    );

    if (!confirmed) return;

    setIsUpdatingBlock(true);
    const saved = await updateUserBlocked(user.id, nextBlocked);
    setIsUpdatingBlock(false);

    if (!saved) {
      alert("Failed to update user block status. Please try again.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Link href="/users" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
          <ArrowLeft size={16} />
          Back to users
        </Link>

        {user ? (
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              {isBlocked && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  This user is currently blocked from CityVoice.
                  {user.blockedAt && <span className="ml-2 font-normal text-red-400">Blocked on {new Date(user.blockedAt).toLocaleString()}</span>}
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
                <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                  <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl text-4xl font-bold text-white shadow-lg ${isBlocked ? "bg-red-500" : "bg-blue-600"}`}>
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <h1 className="truncate text-3xl font-bold text-gray-800">{displayName}</h1>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${isBlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                        {isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-500">
                      <p className="flex min-w-0 items-center gap-2">
                        <Mail size={15} className="shrink-0 text-gray-400" />
                        <span className="truncate">{user.email || "No email available"}</span>
                      </p>
                      <p className="flex min-w-0 items-center gap-2">
                        <MapPin size={15} className="shrink-0 text-gray-400" />
                        <span className="truncate">
                          {user.address || user.location || "Location not available"}, {user.pincode || "N/A"}
                        </span>
                      </p>
                      <p className="flex min-w-0 items-center gap-2">
                        <UserRound size={15} className="shrink-0 text-gray-400" />
                        <span className="truncate">User ID: {user.id}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-blue-50 p-4 text-center">
                    <SquarePen size={18} className="mx-auto mb-2 text-blue-600" />
                    <p className="text-3xl font-bold text-blue-600">{userPosts.length}</p>
                    <p className="text-xs font-semibold uppercase text-gray-400">Posts</p>
                  </div>
                  <div className="rounded-2xl bg-green-50 p-4 text-center">
                    <MessageSquare size={18} className="mx-auto mb-2 text-green-600" />
                    <p className="text-3xl font-bold text-green-600">{totalResponses}</p>
                    <p className="text-xs font-semibold uppercase text-gray-400">Responses</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-4 text-center">
                    <AlertTriangle size={18} className="mx-auto mb-2 text-orange-500" />
                    <p className="text-3xl font-bold text-orange-500">{userClaims.length}</p>
                    <p className="text-xs font-semibold uppercase text-gray-400">Claims</p>
                  </div>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
                  <button
                    onClick={handleBlockToggle}
                    disabled={isUpdatingBlock}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isBlocked ? <CheckCircle size={17} /> : <Ban size={17} />}
                    {isUpdatingBlock ? "Saving..." : isBlocked ? "Unblock User" : "Block User"}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-gray-800">User Activity</h2>
                <div className="flex w-fit rounded-2xl bg-gray-50 p-1">
                  <button
                    onClick={() => setActiveTab("posts")}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                      activeTab === "posts" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-700"
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setActiveTab("claims")}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                      activeTab === "claims" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-700"
                    }`}
                  >
                    Claims & History
                  </button>
                </div>
              </div>

              {activeTab === "posts" && (userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <article key={post.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="flex aspect-video items-center justify-center overflow-hidden bg-white lg:aspect-auto lg:min-h-44">
                          {post.image_url ? (
                            <img src={post.image_url} alt="Report attachment" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full min-h-40 w-full items-center justify-center text-gray-300">
                              <ImageIcon size={36} />
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
                              {post.category || "REPORT"}
                            </span>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                              {post.status || "Pending"}
                            </span>
                          </div>
                          <p className="break-words text-sm leading-6 text-gray-800">{post.description || "No description added"}</p>
                          <p className="mt-3 text-xs text-gray-400">{post.timestamp || "No date available"}</p>
                        </div>

                          <div className="shrink-0 text-sm font-semibold text-gray-500">
                            {Object.keys(allReplies[post.id] || {}).length || post.replies || 0} responses
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center text-gray-400">
                  No reports posted yet
                </div>
              ))}

              {activeTab === "claims" && (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-4">
                    {userClaims.length > 0 ? (
                      userClaims.map((claim, index) => (
                        <article key={claim.id} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase text-orange-700">
                                Claim #{userClaims.length - index}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-gray-500">
                                {claim.status || "pending"}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                  isActiveClaim(claim) ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                                }`}
                              >
                                {isActiveClaim(claim) ? "Active" : "Resolved"}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-400">{formatDateTime(claim.timestamp)}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                            {claim.description || "No claim details provided"}
                          </p>
                          {claim.resolvedAt && (
                            <p className="mt-3 text-xs font-semibold text-green-600">
                              Resolved on {formatDateTime(claim.resolvedAt)}
                            </p>
                          )}
                          <button
                            onClick={() => setSelectedClaim(claim)}
                            className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                          >
                            View details
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center text-gray-400">
                        No block claims found for this user
                      </div>
                    )}
                  </div>

                  <aside className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <History size={18} className="text-blue-600" />
                      <h3 className="font-bold text-gray-800">Block History</h3>
                    </div>
                    <div className="space-y-3">
                      {blockHistory.length > 0 ? (
                        blockHistory.map((history) => (
                          <div key={history.id} className="rounded-2xl bg-white p-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`font-bold capitalize ${history.blocked ? "text-red-600" : "text-green-600"}`}>
                                {history.action || (history.blocked ? "blocked" : "unblocked")}
                              </span>
                              <Clock size={14} className="text-gray-300" />
                            </div>
                            <p className="mt-1 text-xs font-semibold text-gray-400">{formatDateTime(history.timestamp)}</p>
                            <p className="mt-1 text-xs text-gray-400">By {history.updatedBy || "admin"}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                          No block/unblock history yet
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center text-gray-400">
            User profile not found
          </div>
        )}
      </main>

      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Claim Details</h2>
                <p className="mt-1 text-sm text-gray-500">{formatDateTime(selectedClaim.timestamp)}</p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close claim details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase text-orange-600">Claim text</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {selectedClaim.description || "No claim details provided"}
                </p>
              </div>

              <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase text-gray-400">User</p>
                  <p className="mt-1 break-words font-semibold">{selectedClaim.userName || displayName}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase text-gray-400">Status</p>
                  <p className="mt-1 font-semibold capitalize">
                    {selectedClaim.status || "pending"} {isActiveClaim(selectedClaim) ? "(active)" : "(resolved)"}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase text-gray-400">Email</p>
                  <p className="mt-1 break-all font-semibold">{selectedClaim.userEmail || user?.email || "No email"}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase text-gray-400">User ID</p>
                  <p className="mt-1 break-all font-semibold">{selectedClaim.userId || user?.id || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
