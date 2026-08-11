"use client";
import { ExceptionEvent } from "@/lib/types";

const SEVERITY_COLOR: Record<string, string> = {
  low: "border-gray-200 bg-gray-50",
  medium: "border-amber-200 bg-amber-50",
  high: "border-orange-300 bg-orange-50",
  critical: "border-red-300 bg-red-50",
};

export default function EventLog({ events }: { events: ExceptionEvent[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Nhật ký ngoại lệ (EX1–EX7)
      </h2>
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
        {events.length === 0 && (
          <p className="text-xs text-gray-400">Chưa có sự kiện ngoại lệ nào.</p>
        )}
        {events.map((e) => (
          <div
            key={e.event_id}
            className={`text-[11px] border rounded-lg px-2.5 py-2 ${SEVERITY_COLOR[e.severity]}`}
          >
            <span className="font-semibold uppercase mr-1">{e.type}</span>
            {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
