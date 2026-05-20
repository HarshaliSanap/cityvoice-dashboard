"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { User } from "../components/userprofilemodal";

import {
  subscribeToUsers,
  subscribeToPosts,
} from "@/lib/services/dataService";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    subscribeToUsers((fetchedUsers) => {
      subscribeToPosts((fetchedPosts) => {
        const mappedUsers = fetchedUsers.map((u) => {
          const userPosts = fetchedPosts.filter(
            (p) => p.uid === u.id
          );

          return {
            id: u.id,
            name: u.name || "Anonymous",
            email: u.email || "No email",
            location: u.address || "Unknown",
            pincode: u.pincode || "N/A",

            voices: userPosts.length,

            posts: userPosts.map((p) => ({
              title: p.description,
              time: p.timestamp,
            })),

            initial: (u.name || "U")
              .charAt(0)
              .toUpperCase(),

            color: "bg-blue-500",
          };
        });

        setUsers(mappedUsers);

        // Auto select top voice user
        if (mappedUsers.length > 0) {
          const topUser = [...mappedUsers].sort(
            (a, b) =>
              (b.voices || 0) -
              (a.voices || 0)
          )[0];

          setSelectedUser(topUser);
        }
      });
    });
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      u.email
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      u.location
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const topUsers = [...users]
    .sort(
      (a, b) =>
        (b.voices || 0) -
        (a.voices || 0)
    )
    .slice(0, 5);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              User Management
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Monitor and manage platform users
            </p>
          </div>

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none focus:border-blue-400 bg-white w-full sm:w-80"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          <div className="bg-blue-600 text-white rounded-3xl p-6">
            <p className="text-sm opacity-90">
              Total Users
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {users.length}
            </h2>
          </div>

          <div className="bg-green-500 text-white rounded-3xl p-6">
            <p className="text-sm opacity-90">
              Active Users
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {
                users.filter(
                  (u) =>
                    u.voices > 0
                ).length
              }
            </h2>
          </div>

          <div className="bg-orange-500 text-white rounded-3xl p-6">
            <p className="text-sm opacity-90">
              Total Voices
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {users.reduce(
                (a, u) =>
                  a + (u.voices || 0),
                0
              )}
            </h2>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Top Voice Contributors
            </h2>

            <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-semibold">
              MOST ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {topUsers.map((user, index) => (
              <div
                key={user.id}
                onClick={() =>
                  setSelectedUser(user)
                }
                className={`rounded-2xl p-5 cursor-pointer transition-all border ${
                  selectedUser?.id === user.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl ${user.color} text-white flex items-center justify-center font-bold text-xl`}
                  >
                    {user.initial}
                  </div>

                  <span className="text-xs font-bold text-orange-500">
                    #{index + 1}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800">
                  {user.name}
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  {user.email}
                </p>

                <div className="mt-4">
                  <p className="text-3xl font-bold text-blue-600">
                    {user.voices}
                  </p>

                  <p className="text-xs text-gray-500">
                    Total Voices
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="xl:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 max-h-[850px] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              All Users
            </h2>

            <div className="space-y-3">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  onClick={() =>
                    setSelectedUser(user)
                  }
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    selectedUser?.id === user.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${user.color} text-white flex items-center justify-center font-bold`}
                    >
                      {user.initial}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {user.name}
                      </h3>

                      <p className="text-xs text-gray-400">
                        {user.email}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {user.voices}
                      </p>

                      <p className="text-[10px] text-gray-400">
                        voices
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  No users found
                </div>
              )}
            </div>
          </div>

          {/* Full Screen User Details */}
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            {selectedUser ? (
              <>
                {/* Top */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-24 h-24 rounded-3xl ${selectedUser.color} text-white flex items-center justify-center font-bold text-4xl shadow-lg`}
                    >
                      {selectedUser.initial}
                    </div>

                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">
                        {selectedUser.name}
                      </h2>

                      <p className="text-gray-500 mt-1">
                        {selectedUser.email}
                      </p>

                      <p className="text-sm text-gray-400 mt-2">
                        📍{" "}
                        {selectedUser.location}
                        ,{" "}
                        {
                          selectedUser.pincode
                        }
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-3xl px-8 py-6 text-center">
                    <p className="text-sm text-gray-500">
                      Total Voices
                    </p>

                    <h2 className="text-5xl font-bold text-blue-600 mt-2">
                      {selectedUser.voices}
                    </h2>
                  </div>
                </div>

                {/* Posts */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-5">
                    User Reports / Voices
                  </h3>

                  {selectedUser.posts &&
                  selectedUser.posts.length >
                    0 ? (
                    <div className="space-y-4">
                      {selectedUser.posts.map(
                        (post, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-gray-800 font-medium leading-relaxed">
                                  {post.title}
                                </p>

                                <p className="text-xs text-gray-400 mt-3">
                                  {post.time}
                                </p>
                              </div>

                              <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                                REPORT
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-3xl py-16 text-center border border-dashed border-gray-200">
                      <p className="text-gray-400">
                        No reports posted yet
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a user to view details
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}