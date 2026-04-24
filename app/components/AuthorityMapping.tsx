"use client";
import { useState } from "react";

interface Authority {
  id: number;
  name: string;
}

export default function AuthorityMapping() {
  const [authorities, setAuthorities] = useState<Authority[]>([
    { id: 1, name: "Ward A BMC" },
    { id: 2, name: "Ward C-1 BMC" },
    { id: 3, name: "Mumbai Police Zone 3" },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (authority: Authority) => {
    setEditingId(authority.id);
    setEditValue(authority.name);
  };

  const handleSave = (id: number) => {
    setAuthorities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: editValue } : a))
    );
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="bg-white rounded-xl p-5 flex-1">
      <h2 className="font-semibold text-gray-800 mb-4">Authority Mapping</h2>

      <div className="space-y-3">
        {authorities.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-sm">
            {editingId === a.id ? (
              // Edit mode
              <div className="flex items-center gap-2 w-full">
                <input
                  className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(a.id);
                    if (e.key === "Escape") handleCancel();
                  }}
                  autoFocus
                />
                <button
                  onClick={() => handleSave(a.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // View mode
              <>
                <span className="text-gray-700">{a.name}</span>
                <button
                  onClick={() => handleEdit(a)}
                  className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Announcements */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-yellow-700">📢 Announcements</p>
        <p className="text-xs text-yellow-600 mt-1">System maintenance on August 5th, 2021</p>
      </div>
    </div>
  );
}