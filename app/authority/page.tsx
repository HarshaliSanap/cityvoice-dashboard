"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createAuthority,
  subscribeToAuthorities,
  updateAuthority,
  type AuthorityRecord,
} from "@/lib/services/dataService";
import Sidebar from "../components/Sidebar";
import { Building2, Check, Edit2, Mail, MapPin, Megaphone, Plus, X } from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  address: "",
};

export default function AuthorityPage() {
  const [authorities, setAuthorities] = useState<AuthorityRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthorities((data) => {
      setAuthorities(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleEdit = (authority: AuthorityRecord) => {
    setEditingId(authority.id);
    setEditValue(authority.name || "");
  };

  const handleSave = async (id: string) => {
    if (!editValue.trim()) return;

    setIsSaving(true);
    await updateAuthority(id, editValue.trim());
    setIsSaving(false);
    setEditingId(null);
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.address.trim()) return;

    setIsSaving(true);
    const created = await createAuthority({
      name: form.name.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    });
    setIsSaving(false);

    if (created) {
      setForm(emptyForm);
      setIsAdding(false);
    }
  };

  const updateForm = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeForm = () => {
    setIsAdding(false);
    setForm(emptyForm);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Authority Mapping</h1>
            <p className="mt-1 text-sm text-gray-500">Manage city departments and ward-level authorities</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800"
          >
            <Plus size={18} /> Add Authority
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Add Authority</h2>
                <p className="mt-1 text-sm text-gray-500">Enter the authority contact details</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close add authority form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-bold uppercase text-gray-500">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Authority name"
                  required
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-gray-500">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="authority@example.com"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-gray-500">Address</span>
                <input
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ward office address"
                  required
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Authority"}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {authorities.length > 0 ? (
            authorities.map((authority) => (
              <div
                key={authority.id}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Building2 size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === authority.id ? (
                      <input
                        className="w-full border-b-2 border-blue-500 bg-transparent text-lg font-bold text-gray-800 outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <h3 className="truncate text-lg font-bold text-gray-800">{authority.name}</h3>
                    )}
                    <p className="text-xs font-medium text-gray-400">DEPARTMENT ID: {authority.id.substring(0, 8)}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="shrink-0 text-gray-400" />
                    <span className="break-all">{authority.email || "No email added"}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>{authority.address || "No address added"}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  {editingId === authority.id ? (
                    <>
                      <button
                        onClick={() => handleSave(authority.id)}
                        disabled={isSaving}
                        className="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Save authority name"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-gray-100 p-2 text-gray-400 transition-colors hover:bg-gray-200"
                        aria-label="Cancel editing authority"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(authority)}
                      className="rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
                      aria-label="Edit authority name"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
              <div className="mb-4 flex justify-center text-blue-500">
                <Building2 size={42} />
              </div>
              <p className="font-medium text-gray-500">No authorities mapped yet</p>
              <button onClick={() => setIsAdding(true)} className="mt-4 text-sm font-bold text-blue-600">
                Create First Ward Authority
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center gap-6 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Megaphone size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold italic text-orange-800">System Announcement</h4>
            <p className="mt-0.5 text-xs text-orange-700">
              Please ensure all department mappings are updated before the next ward meeting on Friday.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
