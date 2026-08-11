"use client";
import { Robot, Task, Zone } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  idle: "#16a34a",
  moving: "#2563eb",
  picking: "#9333ea",
  delivering: "#2563eb",
  charging: "#f59e0b",
  error: "#dc2626",
  unknown: "#6b7280",
};

const ZONE_COLOR: Record<string, string> = {
  storage: "#dbeafe",
  packing: "#fef9c3",
  shipping: "#dcfce7",
  charging: "#fee2e2",
  staging: "#e5e7eb",
  restricted: "#fecaca",
};

export default function WarehouseMap({
  zones,
  robots,
  tasks,
}: {
  zones: Zone[];
  robots: Robot[];
  tasks: Task[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        Bản đồ kho — vị trí robot real-time (FR-D2)
      </h2>
      <svg viewBox="0 0 100 60" className="w-full h-[360px] bg-gray-50 rounded-lg border border-gray-100">
        {zones.map((z) => (
          <g key={z.zone_id}>
            <rect
              x={z.x - 7}
              y={z.y - 6}
              width={14}
              height={12}
              rx={1.5}
              fill={ZONE_COLOR[z.zone_type] || "#eee"}
              stroke="#9ca3af"
              strokeWidth={0.3}
            />
            <text x={z.x} y={z.y + 9.5} fontSize={2.6} textAnchor="middle" fill="#374151">
              {z.name}
            </text>
          </g>
        ))}

        {robots.map((r) => {
          const task = tasks.find((t) => t.task_id === r.current_task_id);
          return (
            <g key={r.robot_id}>
              <circle
                cx={r.x}
                cy={r.y}
                r={2.6}
                fill={STATUS_COLOR[r.status] || "#000"}
                stroke="white"
                strokeWidth={0.4}
              />
              <text x={r.x} y={r.y - 3.5} fontSize={2.3} textAnchor="middle" fill="#111827" fontWeight={600}>
                {r.robot_id}
              </text>
              <text x={r.x} y={r.y + 5.2} fontSize={2} textAnchor="middle" fill="#4b5563">
                {r.battery_level.toFixed(0)}%{task ? ` · ${task.priority === "urgent" ? "⚡" : ""}` : ""}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-gray-600">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
