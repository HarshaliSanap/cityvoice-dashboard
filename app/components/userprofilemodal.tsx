import { useState } from "react";
import { X, MapPin, Megaphone, Heart, MessageCircle } from "lucide-react";

export interface User {
  id: string | number;
  name: string;
  email: string;
  location: string;
  pincode: string;
  voices: number;
  supported: number;
  replies: number;
  posts: { title: string; time: string }[];
  initial: string;
  color: string;
}

interface Props {
  user: User;
  onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: Props) {
  const [activeTab, setActiveTab] = useState("My Posts");

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#f5f0eb] rounded-3xl w-[360px] max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center px-6 pb-4">
          <div className={`w-24 h-24 rounded-2xl ${user.color} text-white flex items-center justify-center text-4xl font-bold shadow-md`}>
            {user.initial}
          </div>
          <h2 className="text-2xl font-bold mt-3 text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin size={13} />
            <span>{user.location}, {user.pincode}</span>
          </div>
          <button className="mt-3 px-6 py-2 border-2 border-[#e8694a] text-[#e8694a] rounded-full text-sm font-medium hover:bg-[#e8694a] hover:text-white transition-colors">
            ✏️ Edit Profile
          </button>
        </div>

        {/* Stats */}
        <div className="mx-4 bg-white rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { icon: Megaphone, value: user.voices, label: "VOICES", color: "text-[#e8694a]", bg: "bg-[#fde8e2]" },
              { icon: Heart, value: user.supported, label: "SUPPORTED", color: "text-green-500", bg: "bg-green-50" },
              { icon: MessageCircle, value: user.replies, label: "REPLIES", color: "text-blue-500", bg: "bg-blue-50" },
            ].map(({ icon: Icon, value, label, color, bg }) => (
              <div key={label} className="flex flex-col items-center gap-1 px-2">
                <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center`}>
                  <Icon size={16} className={color} />
                </div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-[10px] text-gray-400 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-4 mb-4">
          <div className="bg-white rounded-2xl flex p-1 overflow-hidden shadow-sm">
            {["My Posts", "Supported", "Replies"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold transition-all duration-200
                  ${activeTab === tab 
                    ? "bg-gray-900 text-white rounded-xl shadow-md" 
                    : "text-gray-400 hover:text-gray-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mx-4 mb-4 space-y-2">
          {activeTab === "My Posts" && (
            user.posts.length > 0 ? (
              user.posts.map((post, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">{post.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    🕒 {post.time ? new Date(post.time.split(' ')[0]).toLocaleDateString() : "Recently"}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl px-4 py-8 text-center text-gray-400 text-sm italic">
                No posts found
              </div>
            )
          )}
          
          {activeTab === "Supported" && (
            <div className="bg-white rounded-2xl px-4 py-8 text-center text-gray-400 text-sm italic">
              No supported voices yet
            </div>
          )}

          {activeTab === "Replies" && (
            <div className="bg-white rounded-2xl px-4 py-8 text-center text-gray-400 text-sm italic">
              No replies found
            </div>
          )}
        </div>

        {/* Our Vision */}
        <div className="mx-4 mb-6 bg-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-lg">✳️</div>
            <p className="font-bold text-gray-800">Our Vision</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            A world where every neighborhood has a calm, trusted voice for the change it wants to see.
          </p>
        </div>
      </div>
    </div>
  );
}