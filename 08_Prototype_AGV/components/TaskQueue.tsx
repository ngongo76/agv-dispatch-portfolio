"use client";
import { Task } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ gán",
  assigned: "Đã gán",
  "in-progress": "Đang thực hiện",
  paused: "Tạm dừng (pin)",
  "on-hold": "Tạm giữ (khu cấm)",
  exception: "Ngoại lệ",
  completed: "Hoàn thành",
  failed: "Thất bại",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  "in-progress": "bg-purple-100 text-purple-700",
  paused: "bg-amber-100 text-amber-700",
  "on-hold": "bg-red-100 text-red-700",
  exception: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function TaskQueue({ tasks }: { tasks: Task[] }) {
  const visible = tasks.slice(0, 12);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Hàng đợi Task (UC1/UC2 — 12 gần nhất)
      </h2>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {visible.length === 0 && (
          <p className="text-xs text-gray-400">Chưa có task nào — thử tạo task bằng lệnh AI bên dưới.</p>
        )}
        {visible.map((t) => (
          <div
            key={t.task_id}
            className="flex items-center justify-between text-xs border border-gray-100 rounded-lg px-2.5 py-2"
          >
            <div>
              <span className="font-medium text-gray-800">{t.task_id}</span>
              <span className="text-gray-500">
                {" "}
                · {t.pickup_zone_id} → {t.dropoff_zone_id}
              </span>
              {t.priority === "urgent" && (
                <span className="ml-1 text-amber-600 font-semibold">⚡ gấp</span>
              )}
              <span className="ml-1 text-gray-400">
                ({t.source === "ai-agent" ? "AI" : t.source === "wms" ? "WMS" : "thủ công"})
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status]}`}>
              {STATUS_LABEL[t.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
