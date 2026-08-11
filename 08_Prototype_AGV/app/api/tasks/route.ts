import { NextResponse } from "next/server";
import { createTask, getState } from "@/lib/engine";

// FR-A1 — tạo task thủ công từ nhân viên kho (US-01)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pickup_zone_id, dropoff_zone_id, priority } = body;
    if (!pickup_zone_id || !dropoff_zone_id) {
      return NextResponse.json(
        { error: "Thiếu điểm lấy hàng hoặc điểm giao hàng" },
        { status: 400 }
      );
    }
    const task = createTask(
      pickup_zone_id,
      dropoff_zone_id,
      priority === "urgent" ? "urgent" : "normal",
      "manual"
    );
    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ tasks: getState().tasks });
}
