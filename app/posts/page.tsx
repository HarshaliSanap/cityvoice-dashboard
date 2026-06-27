"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import {
  subscribeToAuthorities,
  subscribeToPostReportsWithUsers,
  subscribeToPostsWithUsers,
  subscribeToRepliesWithUsers,
  subscribeToUsers,
  updatePostAuthorityEscalation,
  updatePostStatus,
  updatePostSupport,
  type AuthorityRecord,
} from "@/lib/services/dataService";
import { Check, Flag, Heart, Image as ImageIcon, Mail, MapPin, MessageSquare, Search, Send, SquarePen, User, X } from "lucide-react";

type PostStatus = "Pending" | "In Review" | "Escalated to Authority" | "Rejected" | "Resolved";
type StatusFilter = "All" | PostStatus;

type Post = {
  id: string;
  authorAddress?: string | null;
  category?: string;
  coordinates?: {
    lat?: number | string;
    latitude?: number | string;
    lng?: number | string;
    longitude?: number | string;
  };
  description?: string;
  email?: string;
  image_url?: string;
  lat?: number | string;
  latitude?: number | string;
  lng?: number | string;
  location?: string;
  longitude?: number | string;
  name?: string;
  replies?: number;
  status?: PostStatus;
  supports?: number;
  timestamp?: string;
  uid?: string;
  authorBlocked?: boolean;
  authorEmail?: string | null;
  authorLocation?: string | null;
  authorName?: string;
  authorPhone?: string | null;
  authorPincode?: string | null;
  authorProfileStatus?: string;
  authorUserId?: string | null;
  authorityEmail?: string;
  authorityId?: string;
  authorityName?: string;
  authoritySentAt?: string;
};

type Reply = {
  name?: string;
  text?: string;
  timestamp?: string;
  uid?: string;
  userBlocked?: boolean;
};

type PostIssueReport = {
  id: string;
  postId: string;
  issue?: string;
  details?: string;
  timestamp?: string;
  reporterBlocked?: boolean;
  reporterEmail?: string;
  reporterId?: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterPincode?: string;
};

type AppUser = {
  id: string;
  address?: string;
  email?: string;
  location?: string;
  name?: string;
  pincode?: string;
};

const statusOptions: PostStatus[] = ["Pending", "In Review", "Escalated to Authority", "Rejected", "Resolved"];
const filterOptions: StatusFilter[] = ["All", ...statusOptions];
const postQueryParam = "postId";
const postStatusFilterStorageKey = "cityvoice-post-status-filter";
const postSupportStorageKey = "cityvoice-supported-posts";

const statusStyles: Record<PostStatus, string> = {
  Pending: "bg-orange-50 text-orange-600",
  "In Review": "bg-blue-50 text-blue-600",
  "Escalated to Authority": "bg-purple-50 text-purple-600",
  Rejected: "bg-red-50 text-red-600",
  Resolved: "bg-green-50 text-green-600",
};

const isPostStatus = (status: unknown): status is PostStatus => {
  return typeof status === "string" && statusOptions.includes(status as PostStatus);
};

const getPostStatus = (post: Post): PostStatus => {
  return isPostStatus(post.status) ? post.status : "Pending";
};

const getPostDescription = (post: Post) => post.description || "No description added";

const hasLongDescription = (post: Post) => getPostDescription(post).length > 72;

const formatResponseCount = (count: number) => `${count} ${count === 1 ? "response" : "responses"}`;
const getReporterName = (post: Post) => post.authorName || post.name || "Anonymous";

const getPostTime = (timestamp?: string) => {
  if (!timestamp) return 0;

  const parsed = new Date(timestamp.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getCoordinateValue = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);

  return numericValue.toFixed(6);
};

const getPostLatitude = (post: Post) => {
  return getCoordinateValue(post.latitude || post.lat || post.coordinates?.latitude || post.coordinates?.lat);
};

const getPostLongitude = (post: Post) => {
  return getCoordinateValue(post.longitude || post.lng || post.coordinates?.longitude || post.coordinates?.lng);
};

const hasPostCoordinates = (post: Post) => Boolean(getPostLatitude(post) || getPostLongitude(post));

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allReplies, setAllReplies] = useState<Record<string, Record<string, Reply>>>({});
  const [postReports, setPostReports] = useState<Record<string, PostIssueReport[]>>({});
  const [users, setUsers] = useState<AppUser[]>([]);
  const [authorities, setAuthorities] = useState<AuthorityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activePanel, setActivePanel] = useState<"details" | "replies" | "reports">("details");
  const [savingStatus, setSavingStatus] = useState<PostStatus | null>(null);
  const [sendingAuthority, setSendingAuthority] = useState(false);
  const [authorityMessage, setAuthorityMessage] = useState("");
  const [selectedAuthorityId, setSelectedAuthorityId] = useState("");
  const [supportingPostId, setSupportingPostId] = useState<string | null>(null);
  const [supportedPostIds, setSupportedPostIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const openedPostIdRef = useRef<string | null>(null);

  useEffect(() => {
    const savedFilter = window.localStorage.getItem(postStatusFilterStorageKey);
    const savedSupportedPosts = window.localStorage.getItem(postSupportStorageKey);

    if (filterOptions.includes(savedFilter as StatusFilter)) {
      window.setTimeout(() => {
        setStatusFilter(savedFilter as StatusFilter);
        setCurrentPage(1);
      }, 0);
    }

    if (savedSupportedPosts) {
      try {
        const parsedSupportedPosts = JSON.parse(savedSupportedPosts);
        if (Array.isArray(parsedSupportedPosts)) {
          const nextSupportedPostIds = parsedSupportedPosts.filter((id): id is string => typeof id === "string");
          window.setTimeout(() => {
            setSupportedPostIds(nextSupportedPostIds);
          }, 0);
        }
      } catch {
        window.localStorage.removeItem(postSupportStorageKey);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPostsWithUsers((data) => {
      setPosts(data);
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    const unsubscribeReplies = subscribeToRepliesWithUsers((data) => {
      setAllReplies(data);
    });

    const unsubscribePostReports = subscribeToPostReportsWithUsers((data) => {
      setPostReports(data);
    });

    const unsubscribeUsers = subscribeToUsers((data) => {
      setUsers(data);
    });

    return () => {
      unsubscribeReplies?.();
      unsubscribePostReports?.();
      unsubscribeUsers?.();
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuthorities = subscribeToAuthorities((data) => {
      setAuthorities(data);
      setSelectedAuthorityId((currentId) => {
        if (currentId && data.some((authority) => authority.id === currentId)) return currentId;
        return data[0]?.id || "";
      });
    });

    return () => unsubscribeAuthorities?.();
  }, []);

  useEffect(() => {
    const updatePageSize = () => {
      if (window.innerWidth >= 1280) {
        setPageSize(12);
      } else if (window.innerWidth >= 640) {
        setPageSize(6);
      } else {
        setPageSize(3);
      }
      setCurrentPage(1);
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  useEffect(() => {
    const targetPostId = new URLSearchParams(window.location.search).get(postQueryParam);
    if (!targetPostId || openedPostIdRef.current === targetPostId) return;

    const targetPostIndex = posts.findIndex((post) => post.id === targetPostId);
    if (targetPostIndex === -1) return;

    const targetPost = posts[targetPostIndex];
    openedPostIdRef.current = targetPostId;

    window.setTimeout(() => {
      setSearch("");
      setStatusFilter("All");
      window.localStorage.setItem(postStatusFilterStorageKey, "All");
      setCurrentPage(Math.floor(targetPostIndex / pageSize) + 1);
      setSelectedPost(targetPost);
      setActivePanel("details");
    }, 0);
  }, [pageSize, posts]);

  const filteredPosts = posts.filter((post) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (post.description || "").toLowerCase().includes(query) ||
      (post.category || "").toLowerCase().includes(query) ||
      (post.location || "").toLowerCase().includes(query) ||
      (post.name || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || getPostStatus(post) === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => getPostTime(b.timestamp) - getPostTime(a.timestamp));

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedPosts = filteredPosts.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleStatusChange = async (status: PostStatus) => {
    if (!selectedPost) return;

    setSavingStatus(status);
    const saved = await updatePostStatus(selectedPost.id, status);
    setSavingStatus(null);

    if (saved) {
      setSelectedPost((post) => (post ? { ...post, status } : post));
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === selectedPost.id ? { ...post, status } : post))
      );
    } else {
      alert("Failed to update post status. Please try again.");
    }
  };

  const handleSendToAuthority = async () => {
    if (!selectedPost) return;

    const authority = authorities.find((item) => item.id === selectedAuthorityId);
    if (!authority?.email) {
      setAuthorityMessage("Select an authority with an email address.");
      return;
    }

    setSendingAuthority(true);
    setAuthorityMessage("");

    try {
      const response = await fetch("/api/send-authority-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorityEmail: authority.email,
          authorityName: authority.name,
          postCategory: selectedPost.category,
          postDescription: getPostDescription(selectedPost),
          postImageUrl: selectedPost.image_url,
          postLatitude: getPostLatitude(selectedPost),
          postLocation: selectedPost.location,
          postLongitude: getPostLongitude(selectedPost),
          postReporter: selectedPost.name,
          postTimestamp: selectedPost.timestamp,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email.");
      }

      const updated = await updatePostAuthorityEscalation(selectedPost.id, authority);
      if (!updated) {
        throw new Error("Email sent, but failed to update post status.");
      }

      const nextPost: Post = {
        ...selectedPost,
        status: "Escalated to Authority",
        authorityId: authority.id,
        authorityName: authority.name,
        authorityEmail: authority.email,
        authoritySentAt: new Date().toISOString(),
      };

      setSelectedPost(nextPost);
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === selectedPost.id ? nextPost : post))
      );
      setAuthorityMessage(`Sent to ${authority.name || authority.email}.`);
    } catch (error) {
      setAuthorityMessage(error instanceof Error ? error.message : "Failed to send email.");
    } finally {
      setSendingAuthority(false);
    }
  };

  const handleSupport = async (post: Post, event?: MouseEvent) => {
    event?.stopPropagation();
    if (supportingPostId) return;

    const isSupported = supportedPostIds.includes(post.id);
    const nextSupportedPostIds = isSupported
      ? supportedPostIds.filter((id) => id !== post.id)
      : [...supportedPostIds, post.id];

    setSupportingPostId(post.id);
    const nextSupports = await updatePostSupport(post.id, !isSupported);
    setSupportingPostId(null);

    if (nextSupports !== null) {
      setSupportedPostIds(nextSupportedPostIds);
      window.localStorage.setItem(postSupportStorageKey, JSON.stringify(nextSupportedPostIds));
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id ? { ...currentPost, supports: nextSupports } : currentPost
        )
      );
      setSelectedPost((currentPost) =>
        currentPost?.id === post.id ? { ...currentPost, supports: nextSupports } : currentPost
      );
    } else {
      alert("Failed to update support. Please try again.");
    }
  };

  const openPost = (post: Post) => {
    setSelectedPost(post);
    setActivePanel("details");
  };

  const selectedPostReplies = selectedPost ? Object.entries(allReplies[selectedPost.id] || {}) : [];
  const selectedPostReports = selectedPost ? postReports[selectedPost.id] || [] : [];

  const selectedUser = selectedPost
    ? users.find((user) => user.id === selectedPost.uid) ||
      users.find((user) => user.name && user.name === selectedPost.name) ||
      null
    : null;

  const getReplyCount = (post: Post) => {
    const liveReplyCount = Object.keys(allReplies[post.id] || {}).length;
    return liveReplyCount || post.replies || 0;
  };

  const getReportCount = (post: Post) => postReports[post.id]?.length || 0;

  const selectedProfileId = selectedUser?.id || selectedPost?.uid || "";
  const selectedAuthority = authorities.find((authority) => authority.id === selectedAuthorityId) || null;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Post</h1>
            <p className="mt-1 text-sm text-gray-500">View citizen posts submitted on CityVoice</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-72 rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-blue-400"
              placeholder="Search posts..."
            />
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Total Posts</p>
            <p className="mt-1 text-3xl font-bold">{posts.length}</p>
          </div>
          <div className="rounded-2xl bg-green-600 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Resolved</p>
            <p className="mt-1 text-3xl font-bold">{posts.filter((post) => getPostStatus(post) === "Resolved").length}</p>
          </div>
          <div className="rounded-2xl bg-orange-500 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Pending Posts</p>
            <p className="mt-1 text-3xl font-bold">{posts.filter((post) => getPostStatus(post) === "Pending").length}</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((status) => {
              const isActive = statusFilter === status;
              const count = status === "All" ? posts.length : posts.filter((post) => getPostStatus(post) === status).length;

              return (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    window.localStorage.setItem(postStatusFilterStorageKey, status);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                    isActive ? "bg-blue-600 text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {status}
                  <span className={`ml-2 text-xs ${isActive ? "text-blue-100" : "text-gray-400"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {paginatedPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => openPost(post)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openPost(post);
                }}
                role="button"
                tabIndex={0}
                className="flex h-full cursor-pointer flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <SquarePen size={20} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-gray-800">{post.category || "General"}</h2>
                      <p className="truncate text-xs text-gray-400">{post.timestamp || "No date available"}</p>
                    </div>
                  </div>
                </div>

                <span className={`mb-3 w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[getPostStatus(post)]}`}>
                  {getPostStatus(post)}
                </span>

                <div className="mb-3">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-700">
                    {getPostDescription(post)}
                  </p>
                  {hasLongDescription(post) && (
                    <span className="mt-1 inline-block text-xs font-bold text-blue-600">Read more</span>
                  )}
                </div>

                <div className="mb-4 aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  {post.image_url ? (
                    <img src={post.image_url} alt="Post attachment" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <ImageIcon size={34} />
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-3 border-t border-gray-100 pt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-gray-400" />
                    <span className="truncate">{getReporterName(post)}</span>
                    {post.authorBlocked && (
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                        Blocked
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-gray-400" />
                    <span className="truncate">{post.location || "N/A"}</span>
                  </div>
                  {hasPostCoordinates(post) && (
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-400">
                      <span className="truncate">Lat: {getPostLatitude(post) || "N/A"}</span>
                      <span className="truncate">Long: {getPostLongitude(post) || "N/A"}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={15} className="text-gray-400" />
                        <span>{formatResponseCount(getReplyCount(post))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flag size={15} className={getReportCount(post) > 0 ? "text-red-400" : "text-gray-400"} />
                        <span>{getReportCount(post)} reports</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleSupport(post, e)}
                      disabled={supportingPostId === post.id}
                      aria-pressed={supportedPostIds.includes(post.id)}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-70 ${
                        supportedPostIds.includes(post.id)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      <Heart size={13} fill={supportedPostIds.includes(post.id) ? "currentColor" : "none"} />
                      <span>{post.supports || 0}</span>
                      <span>{supportedPostIds.includes(post.id) ? "Supported" : "Support"}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 flex justify-center text-gray-300">
              <ImageIcon size={48} />
            </div>
            <p className="font-medium text-gray-500">No posts found</p>
          </div>
        )}

        {filteredPosts.length > pageSize && (
          <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex-row">
            <p className="text-sm text-gray-500">
              Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredPosts.length)} of{" "}
              {filteredPosts.length} posts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={activePage === 1}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="min-w-24 text-center text-sm font-bold text-gray-700">
                Page {activePage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={activePage === totalPages}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800">{selectedPost.category || "General"}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[getPostStatus(selectedPost)]}`}>
                    {getPostStatus(selectedPost)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{selectedPost.timestamp || "No date available"}</p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close status options"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <p className="mb-2 text-xs font-bold uppercase text-gray-400">Full Post Content</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
                    {getPostDescription(selectedPost)}
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  {selectedPost.image_url ? (
                    <img src={selectedPost.image_url} alt="Post attachment" className="max-h-[420px] w-full object-contain" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-gray-300">
                      <ImageIcon size={44} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 text-sm text-gray-600 sm:grid-cols-2 xl:grid-cols-5">
                  {selectedProfileId ? (
                    <Link
                      href={`/users/${selectedProfileId}`}
                      className="flex min-w-0 items-center gap-2 rounded-xl p-2 text-left transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      <User size={15} className="shrink-0 text-gray-400" />
                      <span className="truncate">{getReporterName(selectedPost)}</span>
                    </Link>
                  ) : (
                    <div className="flex min-w-0 items-center gap-2 rounded-xl p-2 text-left">
                      <User size={15} className="shrink-0 text-gray-400" />
                      <span className="truncate">{getReporterName(selectedPost)}</span>
                    </div>
                  )}
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin size={15} className="shrink-0 text-gray-400" />
                    <span className="truncate">{selectedPost.location || "N/A"}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-xl p-2">
                    <MapPin size={15} className="shrink-0 text-gray-400" />
                    <span className="truncate">
                      Lat: {getPostLatitude(selectedPost) || "N/A"} / Long: {getPostLongitude(selectedPost) || "N/A"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActivePanel("replies")}
                    className={`flex items-center gap-2 rounded-xl p-2 text-left transition-colors ${
                      activePanel === "replies" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <MessageSquare size={15} className="text-gray-400" />
                    <span>{formatResponseCount(getReplyCount(selectedPost))}</span>
                  </button>
                  <button
                    onClick={() => setActivePanel("reports")}
                    className={`flex items-center gap-2 rounded-xl p-2 text-left transition-colors ${
                      activePanel === "reports" ? "bg-red-50 text-red-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <Flag size={15} className={getReportCount(selectedPost) > 0 ? "text-red-400" : "text-gray-400"} />
                    <span>{getReportCount(selectedPost)} reports</span>
                  </button>
                  <button
                    onClick={() => handleSupport(selectedPost)}
                    disabled={supportingPostId === selectedPost.id}
                    aria-pressed={supportedPostIds.includes(selectedPost.id)}
                    className={`flex items-center gap-2 rounded-xl p-2 text-left font-bold transition-colors disabled:cursor-wait disabled:opacity-70 ${
                      supportedPostIds.includes(selectedPost.id)
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <Heart size={15} fill={supportedPostIds.includes(selectedPost.id) ? "currentColor" : "none"} />
                    <span>
                      {selectedPost.supports || 0} {supportedPostIds.includes(selectedPost.id) ? "Supported" : "Support"}
                    </span>
                  </button>
                </div>

                {activePanel === "replies" && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800">Responses</h3>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                        {selectedPostReplies.length}
                      </span>
                    </div>
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {selectedPostReplies.length > 0 ? (
                        selectedPostReplies.map(([replyId, reply]) => (
                          <div key={replyId} className="flex gap-3 rounded-2xl bg-gray-50 p-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-600">
                              {(reply.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-gray-800">{reply.name || "Anonymous"}</span>
                                {reply.userBlocked && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                                    Blocked
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">
                                  {reply.timestamp ? new Date(reply.timestamp).toLocaleString() : ""}
                                </span>
                              </div>
                              <p className="break-words text-sm leading-6 text-gray-600">{reply.text || "No response text"}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                          No responses yet
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activePanel === "reports" && (
                  <div className="rounded-2xl border border-red-100 bg-white p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                          <Flag size={16} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Post Reports</h3>
                      </div>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                        {selectedPostReports.length}
                      </span>
                    </div>
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {selectedPostReports.length > 0 ? (
                        selectedPostReports.map((report) => (
                          <div key={report.id} className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                            <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                              <div className="min-w-0">
                                <p className="break-words text-base font-bold text-gray-800">{report.issue || "Reported post"}</p>
                                <div className="mt-2 grid gap-1 text-xs font-semibold text-gray-500 sm:grid-cols-2">
                                  <span className="break-words">By: {report.reporterName || "Anonymous"}</span>
                                  <span className="break-all">Email: {report.reporterEmail || "No email"}</span>
                                </div>
                              </div>
                              {report.reporterBlocked && (
                                <span className="w-fit rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                                  Blocked
                                </span>
                              )}
                            </div>
                            {report.details && (
                              <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{report.details}</p>
                            )}
                            <div className="grid gap-2 rounded-xl bg-white/70 p-3 text-[11px] font-semibold text-gray-500 sm:grid-cols-3">
                              <span className="break-all">User ID: {report.reporterId || "N/A"}</span>
                              <span>Pin: {report.reporterPincode || "N/A"}</span>
                              <span>
                                {report.timestamp ? new Date(report.timestamp.replace(" ", "T")).toLocaleString() : "No date"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                          No one has reported this post yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 p-4">
                  <h3 className="mb-3 text-sm font-bold text-gray-800">Update Status</h3>
                  <div className="space-y-3">
                    {statusOptions.map((status) => {
                      const isActive = getPostStatus(selectedPost) === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={savingStatus !== null}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <span>{status}</span>
                          {savingStatus === status ? (
                            <span className="text-xs text-gray-400">Saving...</span>
                          ) : (
                            isActive && <Check size={18} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Mail size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-800">Send to Authority</h3>
                  </div>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Authority</span>
                    <select
                      value={selectedAuthorityId}
                      onChange={(event) => {
                        setSelectedAuthorityId(event.target.value);
                        setAuthorityMessage("");
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-blue-400"
                    >
                      {authorities.length > 0 ? (
                        authorities.map((authority) => (
                          <option key={authority.id} value={authority.id}>
                            {authority.name || authority.email || "Unnamed authority"}
                          </option>
                        ))
                      ) : (
                        <option value="">No authorities mapped</option>
                      )}
                    </select>
                  </label>

                  <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                    <p className="font-bold uppercase text-gray-400">To</p>
                    <p className="mt-1 break-all font-semibold text-gray-700">
                      {selectedAuthority?.email || "No authority email selected"}
                    </p>
                    {selectedPost.authorityEmail && (
                      <p className="mt-2 text-[11px] text-gray-400">
                        Last sent to {selectedPost.authorityName || selectedPost.authorityEmail}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleSendToAuthority}
                    disabled={sendingAuthority || !selectedAuthority?.email}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={15} />
                    {sendingAuthority ? "Sending..." : "Send to Authority"}
                  </button>

                  {authorityMessage && (
                    <p
                      className={`mt-3 text-xs font-semibold ${
                        authorityMessage.startsWith("Sent") ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {authorityMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
