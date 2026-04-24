"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { subscribeToAuthorities, updateAuthority } from "@/lib/services/dataService";
import { Shield, Building2, Edit2, Check, X, Plus } from "lucide-react";

export default function AuthorityPage() {
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthorities((data) => {
      setAuthorities(data);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setEditValue(a.name);
  };

  const handleSave = async (id: string) => {
    if (!editValue.trim()) return;
    setIsSaving(true);
    await updateAuthority(id, editValue);
    setIsSaving(false);
    setEditingId(null);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Authority Mapping</h1>
            <p className="text-sm text-gray-500 mt-1">Manage city departments and ward-level authorities</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg">
            <Plus size={18} /> Add Authority
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authorities.length > 0 ? (
            authorities.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1">
                    {editingId === a.id ? (
                      <input
                        className="w-full border-b-2 border-blue-500 bg-transparent text-lg font-bold text-gray-800 outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-gray-800">{a.name}</h3>
                    )}
                    <p className="text-xs text-gray-400 font-medium">DEPARTMENT ID: {a.id.substring(0, 8)}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingId === a.id ? (
                    <>
                      <button 
                        onClick={() => handleSave(a.id)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleEdit(a)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="text-4xl mb-4">🏢</div>
              <p className="text-gray-500 font-medium">No authorities mapped yet</p>
              <button className="mt-4 text-blue-600 font-bold text-sm">Create First Ward Authority</button>
            </div>
          )}
        </div>

        {/* Announcements Footer */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            📢
          </div>
          <div>
            <h4 className="font-bold text-orange-800 text-sm italic">System Announcement</h4>
            <p className="text-xs text-orange-700 mt-0.5">Please ensure all department mappings are updated before the next ward meeting on Friday.</p>
          </div>
        </div>
      </main>
    </div>
  );
}