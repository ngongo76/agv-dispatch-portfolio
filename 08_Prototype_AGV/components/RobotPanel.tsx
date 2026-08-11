"use client";
import { Robot } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  idle: "Rảnh",
  moving: "Đang di chuyển",
  picking: "Đang lấy hàng",
  delivering: "Đang giao hàng",
  charging: "Đang sạc",
  error: "Lỗi / cần can thiệp",
  unknown: "Mất kết nối",
};

const BADGE_COLOR: Record<string, string> = {
  idle: "bg-green-100 text-green-700",
  moving: "bg-blue-100 text-blue-700",
  picking: "bg-purple-100 text-purple-700",
  delivering: "bg-blue-100 text-blue-700",
  charging: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  unknown: "bg-gray-200 text-gray-700",
};

function batteryColor(level: number) {
  if (level < 20) return "bg-red-500";
  if (level < 40) return "bg-amber-500";
  return "bg-green-500";
}

export default function RobotPanel({ robots }: { robots: Robot[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Đội robot (UC7 — giám sát real-time)
      </h2>
      <div className="space-y-2">
        {robots.map((r) => (
          <div key={r.robot_id} className="border border-gray-100 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-800">{r.robot_id}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${BADGE_COLOR[r.status]}`}>
                {STATUS_LABEL[r.status] || r.status}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${batteryColor(r.battery_level)}`}
                  style={{ width: `${r.battery_level}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 w-9 text-right">
                {r.battery_level.toFixed(0)}%
              </span>
            </div>
            {r.current_task_id && (
              <p className="text-[11px] text-gray-500 mt-1">Task: {r.current_task_id}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
