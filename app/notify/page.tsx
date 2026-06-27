"use client";

import { useEffect, useState } from "react";
import { Bell, Clock, Send, Share2, Trash2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
  createUserNotification,
  deleteUserNotification,
  subscribeToUserNotifications,
  type UserNotificationRecord,
} from "@/lib/services/dataService";

const maxMessageLength = 240;

const formatDateTime = (timestamp?: string) => {
  if (!timestamp) return "No date";

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? timestamp : parsed.toLocaleString();
};

const getRemainingHours = (expiresAt?: string) => {
  if (!expiresAt) return 0;

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(remainingMs) || remainingMs <= 0) return 0;

  return Math.ceil(remainingMs / (60 * 60 * 1000));
};

export default function NotifyUsersPage() {
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState<UserNotificationRecord[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const trimmedMessage = message.trim();

  useEffect(() => {
    const unsubscribe = subscribeToUserNotifications((data) => {
      setNotifications(data);
    });

    return () => unsubscribe?.();
  }, []);

  const handleSend = async () => {
    if (!trimmedMessage) {
      setStatusMessage("Enter a notification message first.");
      return;
    }

    setIsSending(true);
    setStatusMessage("");
    const saved = await createUserNotification(trimmedMessage);
    setIsSending(false);

    if (saved) {
      setMessage("");
      setStatusMessage("Notification sent and saved to Firebase for 48 hours.");
    } else {
      setStatusMessage("Failed to send notification. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Remove this notification from Firebase?");
    if (!confirmed) return;

    const deleted = await deleteUserNotification(id);
    if (!deleted) {
      alert("Failed to remove notification. Please try again.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notify Users</h1>
            <p className="mt-1 text-sm text-gray-500">Send app notifications that stay active for 48 hours</p>
          </div>

          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            {notifications.length} active
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Send size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Create Notification</h2>
                <p className="text-sm text-gray-500">This message will be stored in Firebase with date and time.</p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-500">Message</span>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value.slice(0, maxMessageLength));
                  setStatusMessage("");
                }}
                className="min-h-36 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Tomorrow some change will happen..."
              />
            </label>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-gray-400">
              <span>Available for 48 hours after sending</span>
              <span>
                {message.length}/{maxMessageLength}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={handleSend}
                disabled={isSending || !trimmedMessage}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Share2 size={17} />
                {isSending ? "Sending..." : "Share / Send"}
              </button>

              {statusMessage && (
                <p className={`text-sm font-semibold ${statusMessage.startsWith("Failed") ? "text-red-600" : "text-green-600"}`}>
                  {statusMessage}
                </p>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Preview</h2>
            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex gap-3">
                <img src="/CityVoiceLogo.jpeg" alt="CityVoice logo" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0">
                  <p className="font-bold text-gray-800">CityVoice Notification</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                    {trimmedMessage || "Your notification message will appear here."}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-gray-400">Expires 48 hours after sending</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Active Firebase Notifications</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">48 hour window</span>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <article key={notification.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="flex min-w-0 gap-3">
                    <img
                      src={notification.logoUrl || "/CityVoiceLogo.jpeg"}
                      alt="CityVoice logo"
                      className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                          <Bell size={13} />
                          Notify
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase text-orange-700">
                          <Clock size={13} />
                          {getRemainingHours(notification.expiresAt)}h left
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                        {notification.message || "No message"}
                      </p>
                      <div className="mt-3 grid gap-1 text-xs font-semibold text-gray-500 sm:grid-cols-2">
                        <span>Created: {formatDateTime(notification.createdAt)}</span>
                        <span>Expires: {formatDateTime(notification.expiresAt)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </article>
            ))}

            {notifications.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
                <Bell size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-500">No active user notifications</p>
                <p className="mt-1 text-sm text-gray-400">Sent notifications will appear here until they expire.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
