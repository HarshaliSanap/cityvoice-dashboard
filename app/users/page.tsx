"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileModal, { User } from "../components/userprofilemodal";
import { subscribeToUsers, subscribeToPosts, subscribeToReplies } from "@/lib/services/dataService";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Subscribe to users, posts, and the nested replies structure
    subscribeToUsers((fetchedUsers) => {
      subscribeToPosts((fetchedPosts) => {
        subscribeToReplies((repliesData) => {
          const mappedUsers = fetchedUsers.map(u => {
            const userPosts = fetchedPosts.filter(p => p.uid === u.id);
            
            // Count replies sent BY this user across all posts
            let userRepliesCount = 0;
            Object.values(repliesData).forEach((postReplies: any) => {
              Object.values(postReplies).forEach((reply: any) => {
                if (reply.uid === u.id) userRepliesCount++;
              });
            });
            
            return {
              id: u.id,
              name: u.name || "Anonymous",
              email: u.email || "No email",
              location: u.address || "Unknown",
              pincode: u.pincode || "N/A",
              voices: userPosts.length,
              supported: u.supported || 0,
              replies: userRepliesCount,
              posts: userPosts.map(p => ({ title: p.description, time: p.timestamp })),
              initial: (u.name || "U").charAt(0).toUpperCase(),
              color: "bg-blue-500"
            };
          });
          setUsers(mappedUsers);
        });
      });
    });
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Total {users.length} users registered</p>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-400 w-64"
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: users.length, color: "bg-blue-500" },
            { label: "Active Users", value: users.filter(u => u.voices > 0 || (u.posts && u.posts.length > 0)).length, color: "bg-green-500" },
            { label: "Total Voices", value: users.reduce((a, u) => a + (u.voices || 0), 0), color: "bg-orange-500" },
            { label: "Total Replies", value: users.reduce((a, u) => a + (u.replies || 0), 0), color: "bg-purple-500" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-xl p-4`}>
              <p className="text-sm opacity-90">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Location</th>
                <th className="px-6 py-3 text-center">Voices</th>
                <th className="px-6 py-3 text-center">Supported</th>
                <th className="px-6 py-3 text-center">Replies</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${user.color} text-white flex items-center justify-center font-bold text-sm`}>
                        {user.initial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.location}, {user.pincode}</td>
                  <td className="px-6 py-4 text-center font-medium">{user.voices}</td>
                  <td className="px-6 py-4 text-center font-medium">{user.supported}</td>
                  <td className="px-6 py-4 text-center font-medium">{user.replies}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">No users found</div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedUser && (
        <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}