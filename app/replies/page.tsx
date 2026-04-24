"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToPosts, subscribeToReplies } from "@/lib/services/dataService";
import { MessageSquare, User, Clock, ChevronDown, ChevronUp } from "lucide-react";

export default function RepliesPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [allReplies, setAllReplies] = useState<any>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribePosts = subscribeToPosts((data) => {
      setPosts(data.filter(p => p.replies > 0)); // Only show posts with replies
    });
    
    const unsubscribeReplies = subscribeToReplies((data) => {
      setAllReplies(data);
    });

    return () => {
      unsubscribePosts && unsubscribePosts();
      unsubscribeReplies && unsubscribeReplies();
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Replies Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all discussions and citizen interactions</p>
        </div>

        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                {/* Post Header (Click to Toggle) */}
                <div 
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                      {post.category === "Roads" ? "🛣️" : post.category === "Water" ? "💧" : "📋"}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{post.description?.substring(0, 60)}...</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><User size={12} /> {post.name || "Anonymous"}</span>
                        <span className="flex items-center gap-1 font-bold text-blue-600"><MessageSquare size={12} /> {post.replies} Replies</span>
                      </div>
                    </div>
                  </div>
                  {expandedPost === post.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>

                {/* Replies List */}
                {expandedPost === post.id && (
                  <div className="bg-gray-50/50 p-5 border-t border-gray-50">
                    <div className="space-y-4">
                      {allReplies[post.id] ? (
                        Object.entries(allReplies[post.id]).map(([replyId, reply]: [string, any]) => (
                          <div key={replyId} className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${reply.name === "Admin" ? 'bg-blue-600' : 'bg-gray-400'}`}>
                              {(reply.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs font-bold ${reply.name === "Admin" ? 'text-blue-600' : 'text-gray-700'}`}>
                                  {reply.name} {reply.name === "Admin" && <span className="ml-1 text-[8px] bg-blue-100 px-1 rounded">STAFF</span>}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {reply.timestamp ? new Date(reply.timestamp).toLocaleString() : ""}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{reply.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm italic">
                          Loading replies...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-gray-500 font-medium">No discussions found yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
