"use client";

import Link from "next/link";
import { Heart, Image as ImageIcon, UserRound } from "lucide-react";
import { useDashboardData } from "@/lib/hooks/useDashboardData";

type UserScore = {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
  posts: number;
  supports: number;
};

const getUserImageUrl = (user: {
  avatar?: string;
  image_url?: string;
  photo?: string;
  photoURL?: string;
  profileImage?: string;
  profileImageUrl?: string;
}) => user.photoURL || user.profileImageUrl || user.profileImage || user.image_url || user.avatar || user.photo || "";

export default function TopDashboardHighlights() {
  const { posts, users } = useDashboardData();

  const topSupportedReports = [...posts]
    .sort((a, b) => (b.supports || 0) - (a.supports || 0))
    .slice(0, 5);

  const userScores = users
    .filter((user) => !user.blocked)
    .map<UserScore>((user) => {
      const userPosts = posts.filter(
        (post) => post.uid === user.id || post.authorUserId === user.id || (user.name && post.name === user.name)
      );

      return {
        id: user.id,
        name: user.name || "Unknown user",
        email: user.email,
        imageUrl: getUserImageUrl(user),
        posts: userPosts.length,
        supports: userPosts.reduce((total, post) => total + (post.supports || 0), 0),
      };
    })
    .sort((a, b) => b.supports - a.supports || b.posts - a.posts || a.name.localeCompare(b.name))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Top Supported Reports</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase text-blue-600">
            Live voices
          </span>
        </div>

        <div className="space-y-3">
          {topSupportedReports.length > 0 ? (
            topSupportedReports.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts?postId=${encodeURIComponent(post.id)}`}
                className="flex min-h-[66px] items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    {post.image_url ? (
                      <img src={post.image_url} alt="Report attachment" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <span className="absolute left-1 top-1 flex h-4 min-w-4 items-center justify-center rounded bg-white/90 px-1 text-[9px] font-bold text-blue-600 shadow-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {post.description || post.category || "No content"}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {post.location || "Unknown"} | {post.category || "General"} | {post.name || "Anonymous"}
                      {post.authorBlocked ? " | Blocked" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  <Heart size={13} />
                  <span>{post.supports || 0}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
              No supported reports yet
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Top Users</h2>
          <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold uppercase text-green-600">
            Active citizens
          </span>
        </div>

        <div className="space-y-3">
          {userScores.length > 0 ? (
            userScores.map((user, index) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="flex min-h-[66px] items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-green-50 text-green-600">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                      <p className="truncate text-sm font-semibold text-gray-800">{user.name}</p>
                    </div>
                    <p className="truncate text-xs text-gray-400">{user.email || "No email"}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-800">{user.supports}</p>
                  <p className="text-[10px] font-semibold uppercase text-gray-400">
                    voices | {user.posts} posts
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
              No active users yet
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
