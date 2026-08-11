"use client";
import { useState } from "react";

interface Result {
  kind: "success" | "clarify" | "error";
  text: string;
}

export default function CommandBar({ onTaskCreated }: { onTaskCreated: () => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function send() {
    if (!value.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ kind: "error", text: data.error || "Có lỗi xảy ra" });
      } else if (data.needs_clarification) {
        setResult({ kind: "clarify", text: data.question });
      } else {
        setResult({
          kind: "success",
          text: `Đã tạo ${data.task.task_id}: ${data.task.pickup_zone_id} → ${data.task.dropoff_zone_id}${
            data.task.priority === "urgent" ? " (ưu tiên gấp)" : ""
          }`,
        });
        setValue("");
        onTaskCreated();
      }
    } catch (e: any) {
      setResult({ kind: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">
        AI Dispatcher — ra lệnh bằng ngôn ngữ tự nhiên (UC14, FR-L)
      </h2>
      <p className="text-[11px] text-gray-400 mb-2">
        Ví dụ: &quot;Chuyển hàng từ kho A sang khu đóng gói, ưu tiên gấp&quot;
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nhập lệnh vận chuyển..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
        >
          {loading ? "Đang xử lý..." : "Gửi"}
        </button>
      </div>
      {result && (
        <div
          className={`mt-2 text-xs rounded-lg px-3 py-2 ${
            result.kind === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : result.kind === "clarify"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.text}
        </div>
      )}
    </div>
  );
}
