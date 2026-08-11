"use client";
import { useState } from "react";
import { Zone } from "@/lib/types";

export default function ManualTaskForm({
  zones,
  onTaskCreated,
}: {
  zones: Zone[];
  onTaskCreated: () => void;
}) {
  const [pickup, setPickup] = useState(zones[0]?.zone_id || "");
  const [dropoff, setDropoff] = useState(zones[1]?.zone_id || "");
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup_zone_id: pickup,
        dropoff_zone_id: dropoff,
        priority: urgent ? "urgent" : "normal",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    onTaskCreated();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Tạo task thủ công (UC1, US-01)
      </h2>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-900"
        >
          {zones.map((z) => (
            <option key={z.zone_id} value={z.zone_id}>
              {z.name}
            </option>
          ))}
        </select>
        <span className="text-gray-400">→</span>
        <select
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-900"
        >
          {zones.map((z) => (
            <option key={z.zone_id} value={z.zone_id}>
              {z.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          Ưu tiên gấp
        </label>
        <button
          onClick={submit}
          className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          Tạo task
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
