"use client";
import { useEffect, useState } from "react";
import { Check, Edit2, Trash2, X } from "lucide-react";
import {
  deleteAuthority,
  subscribeToAuthorities,
  updateAuthority,
  type AuthorityRecord,
} from "@/lib/services/dataService";

const emptyEdit = {
  name: "",
};

export default function AuthorityMapping() {
  const [authorities, setAuthorities] = useState<AuthorityRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(emptyEdit.name);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthorities((data) => {
      setAuthorities(data);
    });

    return () => unsubscribe?.();
  }, []);

  const handleEdit = (authority: AuthorityRecord) => {
    setEditingId(authority.id);
    setEditValue(authority.name || "");
  };

  const handleSave = async (id: string) => {
    if (!editValue.trim()) return;

    setIsSaving(true);
    const updated = await updateAuthority(id, { name: editValue.trim() });
    setIsSaving(false);

    if (updated) {
      setEditingId(null);
      setEditValue("");
    } else {
      alert("Failed to update authority. Please try again.");
    }
  };

  const handleDelete = async (authority: AuthorityRecord) => {
    const confirmed = window.confirm(`Delete ${authority.name || "this authority"}? This cannot be undone.`);
    if (!confirmed) return;

    setIsSaving(true);
    const deleted = await deleteAuthority(authority.id);
    setIsSaving(false);

    if (!deleted) {
      alert("Failed to delete authority. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="bg-white rounded-xl p-5 flex-1">
      <h2 className="font-semibold text-gray-800 mb-4">Authority Mapping</h2>

      <div className="space-y-3">
        {authorities.length > 0 ? (
          authorities.slice(0, 5).map((authority) => (
            <div key={authority.id} className="flex items-center justify-between gap-3 text-sm">
              {editingId === authority.id ? (
                <div className="flex w-full items-center gap-2">
                  <input
                    className="min-w-0 flex-1 rounded border border-blue-400 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(authority.id);
                      if (e.key === "Escape") handleCancel();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(authority.id)}
                    disabled={isSaving}
                    className="rounded bg-blue-600 p-1.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Save authority"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50"
                    aria-label="Cancel editing authority"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="min-w-0 truncate text-gray-700">{authority.name || "Unnamed authority"}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleEdit(authority)}
                      className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                      aria-label="Edit authority"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(authority)}
                      disabled={isSaving}
                      className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete authority"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
            No authorities mapped yet
          </div>
        )}
      </div>

      {/* Announcements */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-yellow-700">📢 Announcements</p>
        <p className="text-xs text-yellow-600 mt-1">System maintenance on August 5th, 2021</p>
      </div>
    </div>
  );
}
