import { NextResponse } from "next/server";
import { tick } from "@/lib/engine";

// GET /api/state — FR-D1/FR-D2: nguồn dữ liệu telemetry cho dashboard.
// Mỗi lần gọi tiến 1 tick mô phỏng (đơn giản hóa cho demo, không dùng WebSocket).
export async function GET() {
  const state = tick();
  return NextResponse.json(state);
}
