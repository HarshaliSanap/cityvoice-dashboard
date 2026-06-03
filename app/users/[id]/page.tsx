"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle, Image as ImageIcon, Mail, MapPin, MessageSquare, SquarePen, UserRound } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import Sidebar from "../../components/Sidebar";
import { subscribeToPosts, subscribeToReplies, subscribeToUsers, updateUserBlocked } from "@/lib/services/dataService";

type RawUser = {
  id: string;
  address?: string;
  email?: string;
  location?: string;
  name?: string;
  pincode?: string;
  blocked?: boolean;
  blockedAt?: string | null;
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

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [users, setUsers] = useState<RawUser[]>([]);
  const [posts, setPosts] = useState<RawPost[]>([]);
  const [allReplies, setAllReplies] = useState<Record<string, Record<string, Reply>>>({});
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

    return () => {
      unsubscribeUsers?.();
      unsubscribePosts?.();
      unsubscribeReplies?.();
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

  const resolvedPosts = userPosts.filter((post) => post.status === "Resolved").length;
  const displayName = user?.name || "Anonymous";
  const initial = displayName.charAt(0).toUpperCase();
  const isBlocked = Boolean(user?.blocked);

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
                    <SquarePen size={18} className="mx-auto mb-2 text-orange-500" />
                    <p className="text-3xl font-bold text-orange-500">{resolvedPosts}</p>
                    <p className="text-xs font-semibold uppercase text-gray-400">Resolved</p>
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
              <h2 className="mb-5 text-2xl font-bold text-gray-800">User Reports / Voices</h2>

              {userPosts.length > 0 ? (
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
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center text-gray-400">
            User profile not found
          </div>
        )}
      </main>
    </div>
  );
}
