"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToPosts } from "@/lib/services/dataService";
import { Image as ImageIcon, MapPin, MessageSquare, Search, SquarePen, User } from "lucide-react";

type Post = {
  id: string;
  category?: string;
  description?: string;
  image_url?: string;
  location?: string;
  name?: string;
  replies?: number;
  timestamp?: string;
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToPosts((data) => {
      setPosts(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const query = search.toLowerCase();
    return (
      (post.description || "").toLowerCase().includes(query) ||
      (post.category || "").toLowerCase().includes(query) ||
      (post.location || "").toLowerCase().includes(query) ||
      (post.name || "").toLowerCase().includes(query)
    );
  });

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
              onChange={(e) => setSearch(e.target.value)}
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
            <p className="text-sm font-medium opacity-90">With Responses</p>
            <p className="mt-1 text-3xl font-bold">{posts.filter((post) => (post.replies || 0) > 0).length}</p>
          </div>
          <div className="rounded-2xl bg-orange-500 p-5 text-white shadow-sm">
            <p className="text-sm font-medium opacity-90">Pending Posts</p>
            <p className="mt-1 text-3xl font-bold">{posts.filter((post) => (post.replies || 0) === 0).length}</p>
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredPosts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <SquarePen size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800">{post.category || "General"}</h2>
                      <p className="text-xs text-gray-400">{post.timestamp || "No date available"}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {(post.replies || 0) > 0 ? "Responded" : "Pending"}
                  </span>
                </div>

                <p className="mb-4 text-sm leading-6 text-gray-700">{post.description || "No description added"}</p>

                {post.image_url && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    <img src={post.image_url} alt="Post attachment" className="h-48 w-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-gray-400" />
                    <span className="truncate">{post.name || "Anonymous"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-gray-400" />
                    <span className="truncate">{post.location || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-gray-400" />
                    <span>{post.replies || 0} replies</span>
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
      </main>
    </div>
  );
}
