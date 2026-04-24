"use client";
import { useState, useRef } from "react";

export default function FounderAddress() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [address, setAddress] = useState({
    name: "Abhijit Polke",
    title: "Founder, CityVoice",
    line1: "CityVoice is built to give power to your voice.",
    line2: "This is a platform where people come together, support each other, and make real change happen.",
    line3: "Speak up — because together, our voices are stronger.",
    lastUpdated: "July 15, 2021",
  });
  const [photo, setPhoto] = useState("https://i.pravatar.cc/80?img=11");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate real database save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setAddress((prev) => ({
      ...prev,
      lastUpdated: new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      }),
    }));
    setIsSaving(false);
    setIsEditing(false);
    alert("Address updated successfully!");
  };

  return (
    <div className="bg-white rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Founder's Address</h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit Address
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Change Photo
              </button>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-5">
        {/* Photo */}
        <div className="flex-shrink-0 text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-gray-200">
            <img src={photo} alt="Founder" className="w-full h-full object-cover" />
          </div>
          {isEditing ? (
            <div className="mt-2 space-y-1">
              <input
                className="text-sm font-semibold text-center border-b border-gray-300 outline-none w-28"
                value={address.name}
                onChange={(e) => setAddress({ ...address, name: e.target.value })}
              />
              <input
                className="text-xs text-gray-500 text-center border-b border-gray-300 outline-none w-28"
                value={address.title}
                onChange={(e) => setAddress({ ...address, title: e.target.value })}
              />
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold mt-2 text-gray-800">{address.name}</p>
              <p className="text-xs text-gray-500">{address.title}</p>
            </>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 text-sm text-gray-700 leading-relaxed">
          {isEditing ? (
            <div className="space-y-2">
              <input
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm font-semibold outline-none focus:border-blue-400"
                value={address.line3}
                onChange={(e) => setAddress({ ...address, line3: e.target.value })}
              />
            </div>
          ) : (
            <>
              <p>{address.line1}</p>
              <p className="mt-1">{address.line2}</p>
              <p className="mt-2 font-semibold">{address.line3}</p>
            </>
          )}
          <p className="mt-3 text-xs text-gray-400">Last Updated: {address.lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}